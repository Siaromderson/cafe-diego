import { NextRequest, NextResponse } from "next/server";
import { hasSupabase, hasNupay, hasMercadoPago, hasMercadoPagoEmbedded, env } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getProducts } from "@/lib/products-repo";
import { createNupayPayment } from "@/lib/nupay";
import { createMercadoPagoPreference } from "@/lib/mercadopago";
import {
  getShippingConfig,
  isPickup,
  PICKUP_KEY,
  getPaymentMethods,
} from "@/lib/shipping";
import { feeCentsForPct } from "@/lib/payments";
import { isValidBrazilPhone, phoneForSubmit } from "@/lib/phone";
import { T } from "@/lib/tables";

interface CheckoutBody {
  customer: { name: string; phone: string; cpf?: string; email?: string };
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

/** Origem pública da requisição (https://dominio) — sem depender de env. */
function resolveBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`.replace(/\/+$/, "");
  }
  return env.siteUrl.replace(/\/+$/, "");
}

export async function POST(req: NextRequest) {
  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const baseUrl = resolveBaseUrl(req);

  const { customer, address, items, shippingMethod, paymentMethod } = body;
  const pickup = isPickup(shippingMethod);
  // E-mail e CPF não são mais pedidos no checkout — ficam opcionais.
  const customerEmail = customer?.email?.trim() || "";
  const customerCpf = customer?.cpf?.trim() || "";
  const customerPhone = phoneForSubmit(customer?.phone);
  if (!customer?.name || !customerPhone) {
    return NextResponse.json(
      { error: "Preencha nome e telefone." },
      { status: 400 }
    );
  }
  if (!isValidBrazilPhone(customerPhone)) {
    return NextResponse.json(
      { error: "Telefone inválido. Digite o WhatsApp com DDD ou só o número." },
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
  const payMethods = await getPaymentMethods();
  const chosenPay =
    payMethods.find((m) => m.key === paymentMethod) ?? payMethods[0];
  const feeCents = feeCentsForPct(
    chosenPay.feePct,
    subtotalCents + shippingCents
  );
  const payLabel = chosenPay.label;

  const totalCents = subtotalCents + shippingCents + feeCents;
  const referenceId = `CF-${Date.now().toString(36).toUpperCase()}`;
  // Entrega em até 24h; retirada no local fica disponível no mesmo dia.
  const eta = new Date();
  eta.setDate(eta.getDate() + 1);

  // ---- Cria o pedido ----
  let orderId = referenceId;

  if (hasSupabase) {
    const sb = getSupabaseAdmin();

    // tenta vincular/criar a conta do cliente (não bloqueia a venda se falhar).
    // Sem e-mail (campo removido do checkout) o pedido segue como avulso.
    let customerId: string | null = null;
    if (customerEmail) {
      try {
        const { data: created } = await sb.auth.admin.createUser({
          email: customerEmail,
          email_confirm: true,
          user_metadata: { name: customer.name },
        });
        customerId = created?.user?.id ?? null;
        if (customerId) {
          await sb.from(T.customers).upsert({
            id: customerId,
            name: customer.name,
            phone: customerPhone,
            cpf: customerCpf,
            email: customerEmail,
          });
          await sb.from(T.addresses).insert({
            customer_id: customerId,
            ...address,
          });
        }
      } catch {
        // usuário já existe ou auth indisponível — segue com snapshot
      }
    }

    // Cliente já cadastrado com esse WhatsApp? Vincula o pedido a ele para
    // aparecer no histórico "Minhas compras" (mesmo sem informar e-mail).
    if (!customerId && customerPhone) {
      const { data: existingCust } = await sb
        .from(T.customers)
        .select("id")
        .eq("phone", customerPhone)
        .maybeSingle();
      if (existingCust?.id) customerId = existingCust.id;
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
        customer_phone: customerPhone,
        customer_cpf: customerCpf,
        customer_email: customerEmail,
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

    // Cliente identificado + entrega: guarda o endereço para pré-preencher o
    // próximo checkout. Evita duplicar se for igual ao último salvo.
    if (customerId && !pickup && address?.cep && address?.street) {
      const { data: last } = await sb
        .from(T.addresses)
        .select("cep, street, number")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const isSame =
        last &&
        last.cep === address.cep &&
        last.street === address.street &&
        last.number === address.number;
      if (!isSame) {
        await sb.from(T.addresses).insert({ customer_id: customerId, ...address });
      }
    }
  }

  // ---- Pagamento ----
  // Itens enviados ao provedor (produtos + frete + taxa), em reais.
  const paymentItems = [
    ...lines.map((l) => ({
      id: l.product.id,
      name: l.product.name,
      quantity: l.qty,
      unitAmount: l.product.price_cents / 100,
    })),
    ...(shippingCents > 0
      ? [
          {
            id: "frete",
            name: `Frete (${shippingLabel})`,
            quantity: 1,
            unitAmount: shippingCents / 100,
          },
        ]
      : []),
    ...(feeCents > 0
      ? [
          {
            id: "taxa",
            name: `Taxa (${payLabel})`,
            quantity: 1,
            unitAmount: feeCents / 100,
          },
        ]
      : []),
  ];

  // 1) Mercado Pago (preferencial quando o Access Token está configurado).
  if (hasMercadoPago) {
    try {
      const preference = await createMercadoPagoPreference({
        referenceId,
        baseUrl,
        payMethod: chosenPay.key,
        payer: {
          name: customer.name,
          email: customerEmail,
          phone: customerPhone,
          document: customerCpf,
        },
        items: paymentItems.map((i) => ({
          id: i.id,
          title: i.name,
          quantity: i.quantity,
          unitAmount: i.unitAmount,
        })),
      });

      if (hasSupabase && preference.preferenceId) {
        await getSupabaseAdmin()
          .from(T.orders)
          .update({
            payment_ref: preference.preferenceId,
            payment_url: preference.paymentUrl,
          })
          .eq("id", orderId);
      }

      return NextResponse.json({
        orderId,
        referenceId,
        preferenceId: preference.preferenceId,
        amount: totalCents / 100,
        publicKey: hasMercadoPagoEmbedded ? env.mpPublicKey : undefined,
        embedded: hasMercadoPagoEmbedded,
        // Fallback: redirect externo quando a chave pública não está configurada.
        paymentUrl: hasMercadoPagoEmbedded ? undefined : preference.paymentUrl,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Falha no pagamento." },
        { status: 502 }
      );
    }
  }

  // 2) Sem provedor configurado: simula o redirect para testar o fluxo.
  if (!hasNupay) {
    return NextResponse.json({
      orderId,
      simulated: true,
      paymentUrl: `${baseUrl}/checkout/sucesso?order=${orderId}&sim=1`,
    });
  }

  // 3) NuPay (fallback).
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const payment = await createNupayPayment({
      orderId,
      referenceId,
      amount: totalCents / 100,
      shopper: {
        name: customer.name,
        document: customerCpf,
        email: customerEmail,
        phone: customerPhone,
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
