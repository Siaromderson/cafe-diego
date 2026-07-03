import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";

/**
 * Integração com o Mercado Pago — Checkout Bricks (pagamento na própria loja).
 * Cria uma "preference" no servidor e o cliente paga via Payment Brick no site.
 * Doc: POST /checkout/preferences  ·  POST /v1/payments  ·  GET /v1/payments/{id}
 *
 * O status final continua sendo reconciliado pelo webhook (`/api/webhooks/mercadopago`).
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
  /**
   * URL pública da loja (ex.: https://cafe-diego.vercel.app), usada nas
   * back_urls e no webhook. Calculada a partir da requisição para não
   * depender de variável de ambiente. Cai no `env.siteUrl` se ausente.
   */
  baseUrl?: string;
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
  // Tipos do Mercado Pago. IMPORTANTE: `account_money` (saldo MP) NÃO pode ser
  // excluído — o MP rejeita com "account_money cannot be excluded". Por isso o
  // saldo sempre fica disponível na tela, independente da forma escolhida.
  const EXCLUDABLE = [
    "credit_card",
    "debit_card",
    "ticket",
    "bank_transfer",
    "prepaid_card",
    "atm",
  ];
  /** Mantém os tipos informados (e o saldo) e exclui o resto. */
  const only = (keep: string[], installments?: number) => ({
    excluded_payment_types: EXCLUDABLE.filter((id) => !keep.includes(id)).map(
      (id) => ({ id })
    ),
    ...(installments ? { installments } : {}),
  });
  switch (payMethod) {
    case "pix":
      return only(["bank_transfer"], 1);
    case "saldo":
      // Só saldo em conta (todos os outros excluídos; account_money permanece).
      return only([], 1);
    case "credit":
      // Crédito permite parcelar; deixamos o limite no padrão da conta.
      return only(["credit_card"]);
    default:
      return {};
  }
}

export async function createMercadoPagoPreference(
  input: CreatePreferenceInput
): Promise<CreatePreferenceResult> {
  const [firstName, ...rest] = input.payer.name.split(" ");
  const doc = input.payer.document?.replace(/\D/g, "") || "";

  // URL pública da loja (sem barra final). O Mercado Pago exige uma
  // back_urls.success válida e pública para aceitar o `auto_return`.
  const base = (input.baseUrl || env.siteUrl).replace(/\/+$/, "");
  const isPublicHttps = /^https:\/\//.test(base);

  const body: Record<string, unknown> = {
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
      success: `${base}/checkout/sucesso?order=${input.referenceId}`,
      pending: `${base}/checkout/sucesso?order=${input.referenceId}`,
      failure: `${base}/checkout/cancelado?order=${input.referenceId}`,
    },
    notification_url: `${base}/api/webhooks/mercadopago`,
    statement_descriptor: "CAFEDOFEIRANTE",
  };

  // `auto_return` só é aceito com back_urls públicas (https). Em localhost/http
  // (testes locais), enviá-lo causaria erro 400 "back_url.success must be
  // defined" — então só ativamos quando a URL é pública.
  if (isPublicHttps) body.auto_return = "approved";

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

/** Processa o pagamento enviado pelo Payment Brick (Pix, cartão, saldo). */
export async function processMercadoPagoPayment(opts: {
  formData: Record<string, unknown>;
  referenceId: string;
  baseUrl?: string;
}) {
  const base = (opts.baseUrl || env.siteUrl).replace(/\/+$/, "");
  const body = {
    ...opts.formData,
    external_reference: opts.referenceId,
    notification_url: `${base}/api/webhooks/mercadopago`,
    statement_descriptor: "CAFEDOFEIRANTE",
  };

  const res = await fetch(`${env.mpBase}/v1/payments`, {
    method: "POST",
    headers: headers(opts.referenceId),
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof raw === "object" &&
      raw !== null &&
      "message" in raw &&
      typeof (raw as { message: unknown }).message === "string"
        ? (raw as { message: string }).message
        : JSON.stringify(raw).slice(0, 300);
    throw new Error(`Mercado Pago ${res.status}: ${msg}`);
  }

  return raw as { id?: string | number; status?: string };
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
