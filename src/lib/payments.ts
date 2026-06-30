/**
 * Formas de pagamento e a taxa repassada ao cliente (helpers puros).
 * Os percentuais e o liga/desliga de cada forma são definidos no painel
 * (Configurações) e lidos no servidor por `getPaymentMethods` em
 * `@/lib/shipping`.
 *
 * Este arquivo NÃO importa módulos de servidor — pode ser usado no client.
 */
export type PayKey = "pix" | "saldo" | "credit";

export interface PayMethod {
  key: PayKey;
  label: string;
  /** Taxa em % aplicada sobre (subtotal + frete). */
  feePct: number;
  hint?: string;
}

/** Catálogo base das formas de pagamento (ordem exibida no checkout). */
export const PAY_METHODS: { key: PayKey; label: string; feeKey: string; onKey: string }[] = [
  { key: "pix", label: "Pix", feeKey: "fee_pix_pct", onKey: "pay_pix_on" },
  {
    key: "saldo",
    label: "Saldo do Mercado Pago",
    feeKey: "fee_saldo_pct",
    onKey: "pay_saldo_on",
  },
  { key: "credit", label: "Crédito", feeKey: "fee_credit_pct", onKey: "pay_credit_on" },
];

/** Converte "4,5" / "4.5" / "4,5%" em número (percentual). */
export function parsePct(v: string | undefined | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Taxa em centavos para um percentual sobre uma base (subtotal + frete). */
export function feeCentsForPct(feePct: number, baseCents: number): number {
  if (!feePct || feePct <= 0) return 0;
  return Math.round((baseCents * feePct) / 100);
}
