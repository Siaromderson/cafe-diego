import { env, hasUazapi } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { getContent } from "./content";
import { isPickup } from "./shipping";
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
 * Avisa a loja no WhatsApp que um pedido foi pago. Busca os itens do pedido
 * para compor a mensagem. Retorna o resultado do envio (nunca lança).
 */
export async function notifyStoreOrderPaid(
  order: PaidOrderInfo
): Promise<WhatsappResult> {
  if (!hasUazapi) return { ok: false, error: "UAZAPI não configurada" };

  const storeNumber = await resolveStoreNumber();
  if (!storeNumber) return { ok: false, error: "sem número da loja" };

  // Itens do pedido (para listar na mensagem). Falha aqui não impede o aviso.
  let itemsLine = "";
  if (order.id) {
    try {
      const sb = getSupabaseAdmin();
      const { data } = await sb
        .from(T.orderItems)
        .select("name, qty")
        .eq("order_id", order.id);
      if (data?.length) {
        itemsLine =
          "\n\n*Itens:*\n" +
          data.map((i) => `• ${i.qty}x ${i.name}`).join("\n");
      }
    } catch {
      // sem itens: segue com o resumo do pedido
    }
  }

  const entrega = isPickup(order.shipping_method)
    ? "Retirada no local"
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
