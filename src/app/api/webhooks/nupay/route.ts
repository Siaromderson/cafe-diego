import { NextRequest, NextResponse } from "next/server";
import { hasSupabase } from "@/lib/env";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { mapNupayStatus } from "@/lib/nupay";
import { T } from "@/lib/tables";

/**
 * Webhook de status da NuPay.
 * Doc: POST {callbackUrl} com { pspReferenceId, referenceId, status, ... }
 */
export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));

  const referenceId: string | undefined =
    payload.referenceId ?? payload.merchantOrderReference;
  const pspReferenceId: string | undefined = payload.pspReferenceId;
  const status = mapNupayStatus(
    payload.status ?? payload.paymentStatus ?? payload.state
  );

  if (!hasSupabase) {
    // sem banco: apenas reconhece o recebimento
    return NextResponse.json({ ok: true, note: "no-db" });
  }

  const sb = getSupabaseAdmin();
  const match = referenceId
    ? { reference_id: referenceId }
    : pspReferenceId
    ? { payment_ref: pspReferenceId }
    : null;

  if (!match) {
    return NextResponse.json({ ok: false, error: "sem referência" }, {
      status: 400,
    });
  }

  const update: Record<string, unknown> = {
    status,
    payment_method: payload.paymentMethodType ?? "nupay",
  };
  if (pspReferenceId) update.payment_ref = pspReferenceId;
  if (status === "paid") update.paid_at = new Date().toISOString();

  // idempotente: só atualiza se ainda não estiver no estado final
  await sb.from(T.orders).update(update).match(match).neq("status", "paid");

  return NextResponse.json({ ok: true });
}
