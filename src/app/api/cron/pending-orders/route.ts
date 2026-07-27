import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { sweepPendingUnpaid } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Varredura automática de pedidos NÃO pagos (abandonados).
 * GET /api/cron/pending-orders
 *
 * Agendado no `vercel.json`. A Vercel envia `Authorization: Bearer <CRON_SECRET>`
 * nas execuções agendadas; exigimos esse segredo para o endpoint não ficar
 * aberto. Avisa a LOJA (nunca o cliente) sobre cada pedido que ficou "pending"
 * há mais de `PENDING_NOTIFY_MINUTES` (padrão 30), uma única vez por pedido.
 */
export async function GET(req: NextRequest) {
  // Sem segredo configurado, não expõe o gatilho.
  if (!env.cronSecret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET não configurado" },
      { status: 503 }
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ ok: false, error: "não autorizado" }, {
      status: 401,
    });
  }

  const result = await sweepPendingUnpaid({
    olderThanMinutes: env.pendingNotifyMinutes,
  });

  return NextResponse.json(result);
}
