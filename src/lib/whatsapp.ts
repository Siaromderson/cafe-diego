import { env, hasUazapi, hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { getContent } from "./content";
import { isPickup } from "./shipping";
import { DELIVERY_QUOTE_KEY } from "./shipping-city";
import { T } from "./tables";

/**
 * Envio de WhatsApp via UAZAPI.
 *
 * Configuração (env):
 *  - UAZAPI_URL           host da sua instância (ex.: https://sua.uazapi.com)
 *  - UAZAPI_TOKEN         token da instância
 *  - UAZAPI_NOTIFY_NUMBER (opcional) número que recebe o aviso de venda;
 *                         se vazio, usa o WhatsApp da loja do admin.
 *
 * Nada aqui lança exceção: em falha retornamos { ok: false } para que o
 * webhook de pagamento nunca quebre por causa da mensagem.
 */

export interface WhatsappResult {
  ok: boolean;
  status?: number;
  error?: string;
  raw?: unknown;
}

/** Só dígitos, garantindo o DDI 55 (Brasil) quando ausente. */
function normalizeNumber(num: string): string {
  const d = (num || "").replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("55") ? d : `55${d}`;
}

/** Envia uma mensagem de texto simples. Não lança. */
export async function sendWhatsappText(
  to: string,
  text: string
): Promise<WhatsappResult> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };
  const number = normalizeNumber(to);
  if (!number) return { ok: false, error: "número de destino vazio" };

  try {
    const res = await fetch(`${env.uazapiUrl}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: env.uazapiToken,
      },
      body: JSON.stringify({ number, text }),
    });
    const raw = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, raw };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "falha no envio",
    };
  }
}

/** "4500" (centavos) -> "R$ 45,00". */
function formatBRL(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** Número da loja que recebe o aviso: env dedicada ou WhatsApp do admin. */
async function resolveStoreNumber(): Promise<string> {
  if (env.uazapiNotify.trim()) return env.uazapiNotify.trim();
  try {
    const content = await getContent();
    return content.whatsapp;
  } catch {
    return "";
  }
}

/** Campos do pedido usados no aviso. */
export interface PaidOrderInfo {
  id?: string;
  reference_id: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  total_cents?: number | null;
  shipping_method?: string | null;
}

/**
 * Lista de itens do pedido, formatada para a mensagem (ou string vazia).
 * Falha na consulta não impede o aviso.
 */
async function orderItemsLine(orderId?: string): Promise<string> {
  if (!orderId) return "";
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from(T.orderItems)
      .select("name, qty")
      .eq("order_id", orderId);
    if (data?.length) {
      return (
        "\n\n*Itens:*\n" + data.map((i) => `• ${i.qty}x ${i.name}`).join("\n")
      );
    }
  } catch {
    // sem itens: segue com o resumo do pedido
  }
  return "";
}

/**
 * Avisa a loja no WhatsApp que um pedido foi pago. Busca os itens do pedido
 * para compor a mensagem. Retorna o resultado do envio (nunca lança).
 */
export async function notifyStoreOrderPaid(
  order: PaidOrderInfo
): Promise<WhatsappResult> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };

  const storeNumber = await resolveStoreNumber();
  if (!storeNumber) return { ok: false, error: "sem número da loja" };

  const itemsLine = await orderItemsLine(order.id);
  const entrega = isPickup(order.shipping_method)
    ? "Retirada no local"
    : order.shipping_method === DELIVERY_QUOTE_KEY
      ? "Entrega · frete A COMBINAR (fora de Campo Grande)"
      : "Entrega";
  const cliente = order.customer_name?.trim() || "—";
  const fone = order.customer_phone?.trim();

  const text =
    `🛎️ *Novo pedido pago!*\n\n` +
    `*Pedido:* ${order.reference_id}\n` +
    `*Cliente:* ${cliente}${fone ? ` (${fone})` : ""}\n` +
    `*Total:* ${formatBRL(order.total_cents ?? 0)}\n` +
    `*Entrega:* ${entrega}` +
    itemsLine;

  return sendWhatsappText(storeNumber, text);
}

/** Por que o pedido não foi pago: tentativa recusada/expirada ou abandonado. */
export type UnpaidReason = "canceled" | "pending";

/**
 * Avisa a LOJA (nunca o cliente) que um pedido NÃO foi pago — para o vendedor
 * entrar em contato e tentar concluir a venda. `reason` distingue um pagamento
 * não concluído (recusado/expirado) de um pedido em aberto (abandonado).
 * Retorna o resultado do envio (nunca lança).
 */
export async function notifyStoreOrderUnpaid(
  order: PaidOrderInfo,
  reason: UnpaidReason = "pending"
): Promise<WhatsappResult> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };

  const storeNumber = await resolveStoreNumber();
  if (!storeNumber) return { ok: false, error: "sem número da loja" };

  const itemsLine = await orderItemsLine(order.id);
  const entrega = isPickup(order.shipping_method)
    ? "Retirada no local"
    : "Entrega";
  const cliente = order.customer_name?.trim() || "—";
  const fone = order.customer_phone?.trim();
  const situacao =
    reason === "canceled"
      ? "Pagamento não concluído"
      : "Aguardando pagamento (pedido em aberto)";

  const text =
    `⚠️ *Pedido não pago*\n\n` +
    `*Pedido:* ${order.reference_id}\n` +
    `*Cliente:* ${cliente}${fone ? ` (${fone})` : ""}\n` +
    `*Total:* ${formatBRL(order.total_cents ?? 0)}\n` +
    `*Entrega:* ${entrega}\n` +
    `*Situação:* ${situacao}\n\n` +
    `👉 Fale com o cliente pelo WhatsApp para concluir a venda.` +
    itemsLine;

  return sendWhatsappText(storeNumber, text);
}

/**
 * Avisa a loja de um pedido não pago APENAS UMA VEZ. Marca `unpaid_notified_at`
 * de forma atômica (só quando ainda está nulo), o que torna o aviso idempotente
 * entre reentregas do webhook e a varredura do cron. Se a coluna ainda não
 * existe (migration não rodada) ou o pedido já foi avisado, não envia.
 */
export async function notifyStoreUnpaidOnce(
  order: PaidOrderInfo,
  reason: UnpaidReason = "canceled"
): Promise<WhatsappResult> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };
  if (!order.id) return notifyStoreOrderUnpaid(order, reason);
  try {
    const sb = getSupabaseAdmin();
    const { data: marked, error } = await sb
      .from(T.orders)
      .update({ unpaid_notified_at: new Date().toISOString() })
      .eq("id", order.id)
      .is("unpaid_notified_at", null)
      .select("id");
    if (error) return { ok: false, error: error.message };
    if (!marked?.length) return { ok: false, error: "pedido já avisado" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "marcador indisponível",
    };
  }
  return notifyStoreOrderUnpaid(order, reason);
}

/** Resultado da varredura de pedidos não pagos. */
export interface PendingSweepResult {
  ok: boolean;
  total: number; // pedidos "pending" considerados
  notified: number; // avisos efetivamente enviados
  to?: string; // número da loja que recebeu
  error?: string;
}

/**
 * Varre os pedidos ainda `pending` (não pagos) e avisa a LOJA (nunca o
 * cliente) para o vendedor entrar em contato.
 *
 *  - `olderThanMinutes`: só considera pedidos abandonados há mais de X min
 *    (usado pela varredura automática do cron).
 *  - `force`: envia mesmo que o pedido já tenha sido avisado (usado pelo
 *    botão de teste do admin). Sem `force`, o aviso é idempotente — cada
 *    pedido é avisado uma única vez.
 *
 * Nunca lança.
 */
export async function sweepPendingUnpaid(
  opts: { olderThanMinutes?: number; force?: boolean } = {}
): Promise<PendingSweepResult> {
  const { olderThanMinutes = 0, force = false } = opts;
  if (!hasUazapi)
    return { ok: false, total: 0, notified: 0, error: "UAZAPI não configurada" };
  if (!hasSupabase)
    return { ok: false, total: 0, notified: 0, error: "Supabase não configurado" };

  const to = await resolveStoreNumber();
  if (!to)
    return { ok: false, total: 0, notified: 0, error: "sem número da loja" };

  const sb = getSupabaseAdmin();
  let q = sb
    .from(T.orders)
    .select(
      "id, reference_id, customer_name, customer_phone, total_cents, shipping_method"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (olderThanMinutes > 0) {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000).toISOString();
    q = q.lt("created_at", cutoff);
  }

  const { data, error } = await q;
  if (error) return { ok: false, total: 0, notified: 0, to, error: error.message };
  const orders = data ?? [];

  let notified = 0;
  for (const o of orders) {
    const r = force
      ? await notifyStoreOrderUnpaid(o, "pending")
      : await notifyStoreUnpaidOnce(o, "pending");
    if (!r.ok) continue;
    notified++;
    if (force) {
      // Marca (best-effort) para a varredura automática não repetir depois do teste.
      try {
        await sb
          .from(T.orders)
          .update({ unpaid_notified_at: new Date().toISOString() })
          .eq("id", o.id);
      } catch {
        // coluna ausente/erro: o envio já ocorreu, seguimos
      }
    }
  }

  return { ok: true, total: orders.length, notified, to };
}

/**
 * Envia uma mensagem de teste para o número da loja — usado pelo botão
 * "Enviar teste" no admin. Devolve também o destino resolvido, para a UI
 * mostrar para onde foi. Não lança.
 */
export async function sendTestToStore(): Promise<
  WhatsappResult & { to?: string }
> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };
  const to = await resolveStoreNumber();
  if (!to) return { ok: false, error: "sem número da loja configurado" };
  const r = await sendWhatsappText(
    to,
    "✅ *Café do Feirante* — teste de integração.\n\n" +
      "Se você recebeu esta mensagem, os avisos de venda no WhatsApp estão " +
      "funcionando! 🎉☕"
  );
  return { ...r, to };
}
