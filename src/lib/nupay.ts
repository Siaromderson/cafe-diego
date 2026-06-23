import { env } from "./env";

export interface NupayItem {
  reference: string;
  name: string;
  quantity: number;
  unitAmount: number; // em reais (decimal)
}

export interface NupayShopper {
  name: string;
  document: string; // CPF
  email: string;
  phone: string;
  ip?: string;
}

export interface CreatePaymentInput {
  orderId: string;
  referenceId: string;
  amount: number; // total em reais (decimal)
  shopper: NupayShopper;
  items: NupayItem[];
}

export interface CreatePaymentResult {
  pspReferenceId?: string;
  paymentUrl?: string;
  raw: unknown;
}

const headers = () => ({
  "Content-Type": "application/json",
  "X-Merchant-Key": env.nupayKey,
  "X-Merchant-Token": env.nupayToken,
});

/**
 * Cria um pagamento NuPay. Retorna o paymentUrl para redirecionar o cliente.
 * Doc: POST /v1/checkouts/payments
 */
export async function createNupayPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const body = {
    merchantOrderReference: input.orderId,
    referenceId: input.referenceId,
    amount: { value: input.amount, currency: "BRL" },
    shopper: {
      firstName: input.shopper.name.split(" ")[0],
      lastName: input.shopper.name.split(" ").slice(1).join(" ") || "-",
      name: input.shopper.name,
      document: input.shopper.document.replace(/\D/g, ""),
      documentType: "CPF",
      email: input.shopper.email,
      phone: input.shopper.phone.replace(/\D/g, ""),
      ipAddress: input.shopper.ip ?? "0.0.0.0",
    },
    items: input.items.map((i) => ({
      reference: i.reference,
      name: i.name,
      quantity: i.quantity,
      unitAmount: { value: i.unitAmount, currency: "BRL" },
    })),
    paymentMethod: { type: "nupay" },
    paymentFlow: {
      returnUrl: `${env.siteUrl}/checkout/sucesso?order=${input.orderId}`,
      cancelUrl: `${env.siteUrl}/checkout/cancelado?order=${input.orderId}`,
    },
    callbackUrl: `${env.siteUrl}/api/webhooks/nupay`,
    delayToAutoCancel: 30,
  };

  const res = await fetch(`${env.nupayBase}/v1/checkouts/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const raw = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `NuPay ${res.status}: ${JSON.stringify(raw).slice(0, 400)}`
    );
  }

  return {
    pspReferenceId: raw.pspReferenceId ?? raw.id,
    paymentUrl: raw.paymentUrl ?? raw.paymentFlow?.paymentUrl,
    raw,
  };
}

/** Consulta status — fallback de reconciliação. GET /v1/checkouts/payments/{ref}/status */
export async function getNupayStatus(pspReferenceId: string) {
  const res = await fetch(
    `${env.nupayBase}/v1/checkouts/payments/${pspReferenceId}/status`,
    { headers: headers() }
  );
  return res.json().catch(() => ({}));
}

/** Mapeia status da NuPay para o status interno do pedido. */
export function mapNupayStatus(s: string): "pending" | "paid" | "canceled" {
  const v = (s || "").toUpperCase();
  if (["CONFIRMED", "PAID", "APPROVED", "SETTLED", "SUCCESS"].includes(v))
    return "paid";
  if (["CANCELLED", "CANCELED", "FAILED", "DECLINED", "EXPIRED"].includes(v))
    return "canceled";
  return "pending";
}
