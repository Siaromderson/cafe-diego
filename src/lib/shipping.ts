import { hasSupabase, hasCorreios } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { parsePct, PAY_METHODS, type PayMethod } from "./payments";
import { quoteShipping } from "./correios";

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

/** Prefixo das chaves de frete calculado pelos Correios (ex.: "correios_sedex"). */
export const CORREIOS_PREFIX = "correios_";

/** Texto curto de prazo a partir do número de dias úteis dos Correios. */
function etaLabel(days: number): string {
  if (days <= 0) return "Prazo estimado pelos Correios";
  return `Chega em ~${days} ${days === 1 ? "dia útil" : "dias úteis"}`;
}

/**
 * Opções de entrega para um destino + peso. Quando os Correios estão
 * configurados e respondem, devolve retirada + SEDEX/PAC calculados; senão cai
 * nas opções fixas (`getShippingConfig`). Nunca lança — o checkout não pode
 * quebrar por causa de uma indisponibilidade dos Correios.
 */
export async function getShippingQuote(
  cep: string,
  weightGrams: number
): Promise<ShipOption[]> {
  const base = await getShippingConfig();
  if (!hasCorreios) return base.options;

  const quotes = await quoteShipping(cep, weightGrams);
  if (!quotes || !quotes.length) return base.options;

  const pickup =
    base.options.find((o) => o.key === PICKUP_KEY) ?? {
      key: PICKUP_KEY,
      label: "Retirar no local",
      cents: 0,
      eta: "Retire quando quiser, sem custo",
    };

  const shipped: ShipOption[] = quotes.map((q) => ({
    key: `${CORREIOS_PREFIX}${q.service}`,
    label: q.label,
    cents: q.cents,
    eta: etaLabel(q.etaDays),
  }));

  return [pickup, ...shipped];
}

/**
 * Resolve o frete do método escolhido no servidor (fonte da verdade). Recalcula
 * junto aos Correios quando aplicável — o preço nunca vem do cliente.
 */
export async function resolveShipping(
  method: string | undefined | null,
  cep: string,
  weightGrams: number
): Promise<{ cents: number; label: string; method: string }> {
  if (isPickup(method)) {
    return { cents: 0, label: "Retirar no local", method: PICKUP_KEY };
  }
  const options = await getShippingQuote(cep, weightGrams);
  const chosen =
    options.find((o) => o.key === method) ??
    options.find((o) => o.key === DELIVERY_KEY) ??
    options.find((o) => o.key !== PICKUP_KEY) ??
    options[0];
  return { cents: chosen.cents, label: chosen.label, method: chosen.key };
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
