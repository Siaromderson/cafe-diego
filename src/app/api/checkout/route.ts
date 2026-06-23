import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, hasNupay, env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products-repo";
import { createNupayPayment } from "@/lib/nupay";
import { getShippingConfig, isPickup, PICKUP_KEY } from "@/lib/shipping";
import { feeCentsFor, PAY_BY_KEY } from "@/lib/payments";
import { T } from "@/lib/tables";

interface CheckoutBody {
  customer: { name: string; phone: string; cpf: string; email: string };
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    reference?: string;
  };
  items: { id: string; qty: number }[];
  shippingMethod?: string;
  paymentMethod?: string;
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { customer, address, items, shippingMethod, paymentMethod } = body;
  const pickup = isPickup(shippingMethod);
  if (!customer?.name || !customer?.phone || !customer?.email) {
    return NextResponse.json(
      { error: "Preencha nome, telefone e e-mail." },
      { status: 400 }
    );
  }
  // Endereço só é obrigatório quando há entrega (retirada no local dispensa).
  if (!pickup && (!address?.cep || !address?.street || !address?.number)) {
    return NextResponse.json(
      { error: "Endereço incompleto." },
      { status: 400 }
    );
  }
  if (!items?.length) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  // Preços validados no servidor (nunca confie no preço do cliente).
  const catalog = await getProducts();
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const lines = items
    .map((i) => {
      const p = byId.get(i.id);
      if (!p) return null;
      const qty = Math.max(1, Math.min(99, Math.floor(i.qty)));
      return { product: p, qty };
    })
    .filter(Boolean) as { product: (typeof catalog)[number]; qty: number }[];

  if (!lines.length) {
    return NextResponse.json(
      { error: "Itens indisponíveis." },
      { status: 400 }
    );
  }

  const subtotalCents = lines.reduce(
    (n, l) => n + l.qty * l.product.price_cents,
    0
  );

  // ---- Frete (validado no servidor a partir das configurações) ----
  const shipConfig = await getShippingConfig();
  const chosen =
    shipConfig.options.find((o) => o.key === shippingMethod) ??
    shipConfig.options.find((o) => o.key === PICKUP_KEY)!;
  const shippingCents = pickup ? 0 : chosen.cents;
  const shippingLabel = chosen.label;

  // ---- Taxa da forma de pagamento (repassada ao cliente) ----
  const payMethod = paymentMethod ?? "pix";
  const feeCents = feeCentsFor(payMethod, subtotalCents + shippingCents);
  const payLabel = PAY_BY_KEY.get(payMethod as never)?.label ?? "Pix";

  const totalCents = subtotalCents + shippingCents + feeCents;
  const referenceId = `CF-${Date.now().toString(36).toUpperCase()}`;
  // Entrega em até 24h; retirada no local fica disponível no mesmo dia.
  const eta = new Date();
  eta.setDate(eta.getDate() + 1);

  // ---- Cria o pedido ----
  let orderId = referenceId;

  if (hasSupabase) {
    const sb = getSupabaseAdmin();

    // tenta vincular/criar a conta do cliente (não bloqueia a venda se falhar)
    let customerId: string | null = null;
    try {
      const { data: created } = await sb.auth.admin.createUser({
        email: customer.email,
        email_confirm: true,
        user_metadata: { name: customer.name },
      });
      customerId = created?.user?.id ?? null;
      if (customerId) {
        await sb.from(T.customers).upsert({
          id: customerId,
          name: customer.name,
          phone: customer.phone,
          cpf: customer.cpf,
          email: customer.email,
        });
        await sb.from(T.addresses).insert({
          customer_id: customerId,
          ...address,
        });
      }
    } catch {
      // usuário já existe ou auth indisponível — segue com snapshot
    }

    const { data: order, error } = await sb
      .from(T.orders)
      .insert({
        customer_id: customerId,
        status: "pending",
        total_cents: totalCents,
        shipping_cents: shippingCents,
        shipping_method: pickup ? PICKUP_KEY : shippingMethod ?? "delivery",
        reference_id: referenceId,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_cpf: customer.cpf,
        customer_email: customer.email,
        address_json: address,
        delivery_eta: eta.toISOString().slice(0, 10),
      })
      .select("id")
      .single();

    if (error || !order) {
      return NextResponse.json(
        { error: "Não foi possível criar o pedido." },
        { status: 500 }
      );
    }
    orderId = order.id;

    await sb.from(T.orderItems).insert(
      lines.map((l) => ({
        order_id: orderId,
        product_id: l.product.id,
        name: l.product.name,
        qty: l.qty,
        unit_price_cents: l.product.price_cents,
      }))
    );
  }

  // ---- Pagamento ----
  if (!hasNupay) {
    // Sem chaves NuPay ainda: simula o redirect para testar o fluxo ponta a ponta.
    return NextResponse.json({
      orderId,
      simulated: true,
      paymentUrl: `${env.siteUrl}/checkout/sucesso?order=${orderId}&sim=1`,
    });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const payment = await createNupayPayment({
      orderId,
      referenceId,
      amount: totalCents / 100,
      shopper: {
        name: customer.name,
        document: customer.cpf,
        email: customer.email,
        phone: customer.phone,
        ip,
      },
      items: [
        ...lines.map((l) => ({
          reference: l.product.id,
          name: l.product.name,
          quantity: l.qty,
          unitAmount: l.product.price_cents / 100,
        })),
        ...(shippingCents > 0
          ? [
              {
                reference: "frete",
                name: `Frete (${shippingLabel})`,
                quantity: 1,
                unitAmount: shippingCents / 100,
              },
            ]
          : []),
        ...(feeCents > 0
          ? [
              {
                reference: "taxa",
                name: `Taxa (${payLabel})`,
                quantity: 1,
                unitAmount: feeCents / 100,
              },
            ]
          : []),
      ],
    });

    if (hasSupabase && payment.pspReferenceId) {
      await getSupabaseAdmin()
        .from(T.orders)
        .update({
          payment_ref: payment.pspReferenceId,
          payment_url: payment.paymentUrl,
        })
        .eq("id", orderId);
    }

    return NextResponse.json({
      orderId,
      paymentUrl: payment.paymentUrl,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no pagamento." },
      { status: 502 }
    );
  }
}
