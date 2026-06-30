import { NextRequest, NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  getMercadoPagoPayment,
  mapMercadoPagoStatus,
  isValidSignature,
} from "@/lib/mercadopago";
import { T } from "@/lib/tables";

/**
 * Webhook de notificações do Mercado Pago.
 * Recebe `?type=payment&data.id=...` (ou o mesmo no corpo). Buscamos o
 * pagamento na API para ler o status real e reconciliamos o pedido pelo
 * `external_reference` (a nossa referência interna CF-xxxx).
 */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const body = await req.json().catch(() => ({} as Record<string, unknown>));

  const type =
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    (body.type as string | undefined) ??
    (body.action as string | undefined);

  const dataId =
    url.searchParams.get("data.id") ??
    url.searchParams.get("id") ??
    ((body.data as { id?: string } | undefined)?.id ??
      (body as { id?: string }).id) ??
    null;

  // Valida a assinatura (quando o segredo está configurado).
  if (
    !isValidSignature({
      signature: req.headers.get("x-signature"),
      requestId: req.headers.get("x-request-id"),
      dataId: dataId ? String(dataId) : null,
    })
  ) {
    return NextResponse.json({ ok: false, error: "assinatura inválida" }, {
      status: 401,
    });
  }

  // Só tratamos eventos de pagamento; o resto reconhecemos com 200.
  if (!type || !String(type).includes("payment") || !dataId) {
    return NextResponse.json({ ok: true, note: "ignorado" });
  }

  const payment = await getMercadoPagoPayment(String(dataId));
  const referenceId: string | undefined = payment.external_reference;
  const status = mapMercadoPagoStatus(payment.status);

  if (!hasSupabase) {
    return NextResponse.json({ ok: true, note: "no-db" });
  }
  if (!referenceId) {
    return NextResponse.json({ ok: true, note: "sem referência" });
  }

  const sb = getSupabaseAdmin();
  const update: Record<string, unknown> = {
    status,
    payment_method: payment.payment_type_id ?? "mercadopago",
    payment_ref: String(dataId),
  };
  if (status === "paid") update.paid_at = new Date().toISOString();

  // idempotente: não rebaixa um pedido já pago
  await sb
    .from(T.orders)
    .update(update)
    .match({ reference_id: referenceId })
    .neq("status", "paid");

  return NextResponse.json({ ok: true });
}
