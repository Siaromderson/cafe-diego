import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";

export const FREE_CITY_DEFAULT = "Campo Grande";

/** Opções de frete configuráveis no painel (estilo da loja Ramita). */
export const SHIP_METHODS = [
  { key: "ship_sedex", label: "SEDEX", defaultReais: "25,00" },
  { key: "ship_pac", label: "PAC", defaultReais: "24,00" },
  { key: "ship_motoboy", label: "Motoboy", defaultReais: "15,00" },
] as const;

export interface ShipOption {
  key: string;
  label: string;
  cents: number;
}

export interface ShippingConfig {
  freeCity: string;
  options: ShipOption[];
}

/** Converte "25,00" / "25.00" / "R$ 25" em centavos. */
export function reaisToCents(v: string | undefined | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Lê a configuração de frete a partir das settings (ou usa padrões). */
export async function getShippingConfig(): Promise<ShippingConfig> {
  let map = new Map<string, string>();
  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(T.settings).select("key, value");
    map = new Map((data ?? []).map((s) => [s.key, s.value]));
  }
  const freeCity = map.get("free_shipping_city") || FREE_CITY_DEFAULT;
  const options = SHIP_METHODS.map((m) => ({
    key: m.key,
    label: m.label,
    cents: reaisToCents(map.get(m.key) ?? m.defaultReais),
  })).filter((o) => o.cents > 0);
  return { freeCity, options };
}

export const isFreeCity = (city: string, freeCity: string) =>
  city.trim().toLowerCase() === freeCity.trim().toLowerCase();
