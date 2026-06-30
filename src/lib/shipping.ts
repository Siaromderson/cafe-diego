import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { parsePct, PAY_METHODS, type PayMethod } from "./payments";

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

/** Uma forma de pagamento está ativa? (settings `pay_<key>_on`; padrão = ligada) */
export function isPayEnabled(value: string | undefined): boolean {
  return String(value ?? "on").toLowerCase() !== "off";
}

/**
 * Lê as formas de pagamento, taxas e o liga/desliga a partir das settings.
 * Retorna só as formas ativas (e nunca uma lista vazia: se tudo estiver
 * desligado, devolve todas como salvaguarda para a loja não travar).
 */
export async function getPaymentMethods(): Promise<PayMethod[]> {
  let map = new Map<string, string>();
  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(T.settings).select("key, value");
    map = new Map((data ?? []).map((s) => [s.key, s.value]));
  }

  // O Mercado Pago não informa a taxa dele aqui — o valor cobrado do cliente
  // segue o percentual definido em Configurações (0 = sem taxa).
  const all: PayMethod[] = PAY_METHODS.map((m) => {
    // "saldo" reaproveita a taxa que antes era do "débito", se existir.
    const pct =
      m.key === "saldo"
        ? parsePct(map.get("fee_saldo_pct") ?? map.get("fee_debit_pct"))
        : parsePct(map.get(m.feeKey));
    return {
      key: m.key,
      label: m.label,
      feePct: pct,
      hint: pct > 0 ? undefined : "Sem taxa",
    };
  });

  const enabled = all.filter((m) => {
    const def = PAY_METHODS.find((p) => p.key === m.key)!;
    return isPayEnabled(map.get(def.onKey));
  });
  return enabled.length ? enabled : all;
}
