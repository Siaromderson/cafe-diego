import { env, hasSupabase, hasWhatsAppNotify } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { BRL } from "./types";
import { formatPhone } from "./phone";

export interface OrderNotifyInput {
  referenceId: string;
  customerName: string;
  customerPhone: string;
  items: { name: string; qty: number; unitPriceCents: number }[];
  shippingLabel: string;
  shippingCents: number;
  payLabel: string;
  feeCents: number;
  totalCents: number;
  isPickup: boolean;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    district?: string;
    city?: string;
    cep?: string;
    reference?: string;
  };
  statusLabel?: string;
}

/** Número que recebe o aviso (settings `whatsapp` ou env). */
export async function getWhatsAppNotifyPhone(): Promise<string | null> {
  if (env.whatsappNotifyTo) {
    return env.whatsappNotifyTo.replace(/\D/g, "");
  }

  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from(T.settings)
      .select("value")
      .eq("key", "whatsapp")
      .maybeSingle();
    if (data?.value) return String(data.value).replace(/\D/g, "");
  }

  return null;
}

/** Monta a mensagem personalizada do pedido. */
export function formatOrderWhatsAppMessage(input: OrderNotifyInput): string {
  const lines: string[] = [
    "🛒 *Novo pedido na loja!*",
    "",
    `👤 *Cliente:* ${input.customerName}`,
    `📱 *WhatsApp:* ${formatPhone(input.customerPhone)}`,
    "",
    "📦 *Itens:*",
    ...input.items.map(
      (it) =>
        `• ${it.qty}x ${it.name} — ${BRL(it.unitPriceCents * it.qty)}`
    ),
  ];

  if (input.shippingCents > 0) {
    lines.push(`• Frete (${input.shippingLabel}) — ${BRL(input.shippingCents)}`);
  }
  if (input.feeCents > 0) {
    lines.push(`• Taxa (${input.payLabel}) — ${BRL(input.feeCents)}`);
  }

  lines.push(
    "",
    `🚚 *Recebimento:* ${input.isPickup ? "Retirada no local" : input.shippingLabel}`,
    `💳 *Pagamento:* ${input.payLabel}`,
    `💰 *Total:* ${BRL(input.totalCents)}`,
    `📋 *Status:* ${input.statusLabel ?? "Aguardando pagamento"}`,
    `🔖 *Ref.:* ${input.referenceId}`
  );

  if (!input.isPickup && input.address) {
    const a = input.address;
    const addr = [
      a.street,
      a.number,
      a.complement,
      a.district,
      a.city,
      a.cep ? `CEP ${a.cep}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    if (addr) {
      lines.push("", `📍 *Endereço:* ${addr}`);
    }
    if (a.reference) {
      lines.push(`📌 *Referência:* ${a.reference}`);
    }
  }

  return lines.join("\n");
}

/** Envia texto via WhatsApp Cloud API ou webhook genérico. */
async function sendWhatsAppText(to: string, text: string): Promise<void> {
  const phone = to.replace(/\D/g, "");

  if (env.whatsappWebhookUrl) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (env.whatsappWebhookToken) {
      headers.Authorization = `Bearer ${env.whatsappWebhookToken}`;
    }
    const res = await fetch(env.whatsappWebhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ to: phone, message: text, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Webhook WhatsApp ${res.status}: ${body.slice(0, 200)}`);
    }
    return;
  }

  if (env.whatsappCloudToken && env.whatsappPhoneNumberId) {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${env.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.whatsappCloudToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: { body: text },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        `WhatsApp Cloud API ${res.status}: ${JSON.stringify(body).slice(0, 300)}`
      );
    }
  }
}

/** Dispara aviso de novo pedido (não bloqueia o checkout se falhar). */
export async function notifyNewOrder(input: OrderNotifyInput): Promise<void> {
  if (!hasWhatsAppNotify) return;

  const to = await getWhatsAppNotifyPhone();
  if (!to) {
    console.warn("[whatsapp] Nenhum número de aviso configurado.");
    return;
  }

  const text = formatOrderWhatsAppMessage(input);
  await sendWhatsAppText(to, text);
}
