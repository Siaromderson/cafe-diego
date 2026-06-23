/**
 * Formas de pagamento e a taxa repassada ao cliente.
 *
 * ⚠️ AJUSTE AQUI os percentuais de crédito e débito conforme a maquininha/PSP.
 * Pix fica sem taxa. O valor é somado ao total na hora de pagar.
 */
export interface PayMethod {
  key: "pix" | "debit" | "credit";
  label: string;
  /** Taxa em % aplicada sobre (subtotal + frete). */
  feePct: number;
  hint?: string;
}

export const PAY_METHODS: PayMethod[] = [
  { key: "pix", label: "Pix", feePct: 0, hint: "Sem taxa" },
  { key: "debit", label: "Débito", feePct: 0, hint: "" },
  { key: "credit", label: "Crédito", feePct: 0, hint: "" },
];

export const PAY_BY_KEY = new Map(PAY_METHODS.map((m) => [m.key, m]));

/** Taxa em centavos para um método sobre uma base (subtotal + frete). */
export function feeCentsFor(method: string | undefined, baseCents: number): number {
  const m = method ? PAY_BY_KEY.get(method as PayMethod["key"]) : undefined;
  if (!m || m.feePct <= 0) return 0;
  return Math.round((baseCents * m.feePct) / 100);
}
