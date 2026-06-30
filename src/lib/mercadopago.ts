import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

/**
 * Integração com o Mercado Pago — Checkout Pro.
 * Cria uma "preference" e devolve a URL (`init_point`) para a qual o cliente
 * é redirecionado; o cliente escolhe Pix / cartão na tela do Mercado Pago.
 * Doc: POST /checkout/preferences  ·  GET /v1/payments/{id}
 *
 * O padrão é o mesmo do NuPay: criar pagamento → redirecionar → receber
 * o status pelo webhook (`/api/webhooks/mercadopago`).
 */

export interface MpItem {
  id: string;
  title: string;
  quantity: number;
  unitAmount: number; // em reais (decimal)
}

export interface MpPayer {
  name: string;
  email?: string;
  phone: string;
  document?: string; // CPF (opcional — não é mais pedido no checkout)
}

export interface CreatePreferenceInput {
  /** Referência interna do pedido (CF-xxxx) usada para reconciliar no webhook. */
  referenceId: string;
  payer: MpPayer;
  items: MpItem[];
  /** "pix" | "debit" | "credit" — restringe os meios na tela do Mercado Pago. */
  payMethod?: string;
}

export interface CreatePreferenceResult {
  preferenceId?: string;
  paymentUrl?: string;
  raw: unknown;
}

const headers = (idempotencyKey?: string): Record<string, string> => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${env.mpAccessToken}`,
  ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
});

/**
 * Restringe os meios de pagamento na tela do Mercado Pago de acordo com a
 * forma escolhida na loja — assim a taxa cobrada bate com o que o cliente paga.
 */
function paymentMethodsFor(payMethod?: string) {
  const exclude = (types: string[]) => ({
    excluded_payment_types: types.map((id) => ({ id })),
    installments: 1,
  });
  switch (payMethod) {
    case "pix":
      return exclude(["credit_card", "debit_card", "ticket", "prepaid_card"]);
    case "debit":
      return exclude(["credit_card", "ticket", "bank_transfer"]);
    case "credit":
      // crédito permite parcelar; deixamos o limite no padrão da conta
      return { excluded_payment_types: [{ id: "debit_card" }, { id: "ticket" }] };
    default:
      return {};
  }
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<CreatePreferenceResult> {
  const [firstName, ...rest] = input.payer.name.split(" ");
  const doc = input.payer.document?.replace(/\D/g, "") || "";
  const body = {
    external_reference: input.referenceId,
    items: input.items.map((i) => ({
      id: i.id,
      title: i.title,
      quantity: i.quantity,
      currency_id: "BRL",
      unit_price: Number(i.unitAmount.toFixed(2)),
    })),
    payer: {
      name: firstName,
      surname: rest.join(" ") || "-",
      phone: { number: input.payer.phone.replace(/\D/g, "") },
      // E-mail e CPF só vão quando existirem (não são pedidos no checkout).
      ...(input.payer.email ? { email: input.payer.email } : {}),
      ...(doc ? { identification: { type: "CPF", number: doc } } : {}),
    },
    payment_methods: paymentMethodsFor(input.payMethod),
    back_urls: {
      success: `${env.siteUrl}/checkout/sucesso?order=${input.referenceId}`,
      pending: `${env.siteUrl}/checkout/sucesso?order=${input.referenceId}`,
      failure: `${env.siteUrl}/checkout/cancelado?order=${input.referenceId}`,
    },
    auto_return: "approved",
    notification_url: `${env.siteUrl}/api/webhooks/mercadopago`,
    statement_descriptor: "CAFEDOFEIRANTE",
  };

  const res = await fetch(`${env.mpBase}/checkout/preferences`, {
    method: "POST",
    headers: headers(input.referenceId),
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `Mercado Pago ${res.status}: ${JSON.stringify(raw).slice(0, 400)}`
    );
  }

  return {
    preferenceId: raw.id,
    paymentUrl: raw.init_point ?? raw.sandbox_init_point,
    raw,
  };
}

/** Consulta um pagamento pelo id (usado no webhook para ler o status real). */
export async function getMercadoPagoPayment(paymentId: string) {
  const res = await fetch(`${env.mpBase}/v1/payments/${paymentId}`, {
    headers: headers(),
  });
  return res.json().catch(() => ({}));
}

/** Mapeia o status do Mercado Pago para o status interno do pedido. */
export function mapMercadoPagoStatus(
  s: string
): "pending" | "paid" | "canceled" {
  const v = (s || "").toLowerCase();
  if (v === "approved" || v === "authorized") return "paid";
  if (
    ["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(
      v
    )
  )
    return "canceled";
  return "pending"; // pending, in_process
}

/**
 * Valida a assinatura `x-signature` do webhook (HMAC-SHA256).
 * Doc: manifest = "id:{data.id};request-id:{x-request-id};ts:{ts};".
 * Só é exigida quando `MERCADOPAGO_WEBHOOK_SECRET` está configurada.
 */
export function isValidSignature(opts: {
  signature: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  if (!env.mpWebhookSecret) return true; // validação desligada
  const { signature, requestId, dataId } = opts;
  if (!signature || !dataId) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((kv) => {
      const [k, val] = kv.split("=");
      return [k?.trim(), val?.trim()];
    })
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", env.mpWebhookSecret)
    .update(manifest)
    .digest("hex");

  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
