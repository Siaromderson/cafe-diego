import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { parsePct, type PayMethod } from "./payments";

/** Taxa de entrega padrão (em reais), ajustável no painel. */
export const DELIVERY_FEE_DEFAULT = "15,00";

/** Chaves de entrega usadas em todo o app. */
export const DELIVERY_KEY = "delivery";
export const PICKUP_KEY = "pickup";

export interface ShipOption {
  key: string;
  label: string;
  cents: number;
  /** Texto curto de prazo mostrado no checkout. */
  eta: string;
}

export interface ShippingConfig {
  /** Valor da entrega (frete fixo) em centavos. */
  deliveryCents: number;
  options: ShipOption[];
}

/** Converte "25,00" / "25.00" / "R$ 25" em centavos. */
export function reaisToCents(v: string | undefined | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Lê a configuração de entrega a partir das settings (ou usa padrões). */
export async function getShippingConfig(): Promise<ShippingConfig> {
  let map = new Map<string, string>();
  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(T.settings).select("key, value");
    map = new Map((data ?? []).map((s) => [s.key, s.value]));
  }
  const deliveryCents = reaisToCents(
    map.get("delivery_fee") ?? DELIVERY_FEE_DEFAULT
  );

  const options: ShipOption[] = [
    {
      key: PICKUP_KEY,
      label: "Retirar no local",
      cents: 0,
      eta: "Retire quando quiser, sem custo",
    },
    {
      key: DELIVERY_KEY,
      label: "Entrega",
      cents: deliveryCents,
      eta: "Receba em até 24h",
    },
  ];

  return { deliveryCents, options };
}

/** A chave de entrega escolhida é retirada no local? */
export const isPickup = (method: string | undefined | null) =>
  method === PICKUP_KEY;

/** Lê as formas de pagamento e suas taxas a partir das settings. */
export async function getPaymentMethods(): Promise<PayMethod[]> {
  let map = new Map<string, string>();
  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(T.settings).select("key, value");
    map = new Map((data ?? []).map((s) => [s.key, s.value]));
  }
  return [
    { key: "pix", label: "Pix", feePct: 0, hint: "Sem taxa" },
    { key: "debit", label: "Débito", feePct: parsePct(map.get("fee_debit_pct")) },
    { key: "credit", label: "Crédito", feePct: parsePct(map.get("fee_credit_pct")) },
  ];
}
