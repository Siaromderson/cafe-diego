/**
 * Formas de pagamento e a taxa repassada ao cliente (helpers puros).
 * Os percentuais de crédito e débito são definidos no painel
 * (Configurações) e lidos no servidor por `getPaymentMethods` em
 * `@/lib/shipping`. Pix fica sem taxa.
 *
 * Este arquivo NÃO importa módulos de servidor — pode ser usado no client.
 */
export interface PayMethod {
  key: "pix" | "debit" | "credit";
  label: string;
  /** Taxa em % aplicada sobre (subtotal + frete). */
  feePct: number;
  hint?: string;
}

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
