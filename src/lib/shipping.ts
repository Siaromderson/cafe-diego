import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { parsePct, PAY_METHODS, type PayMethod } from "./payments";
import {
  PICKUP_KEY,
  DELIVERY_KEY,
  DELIVERY_QUOTE_KEY,
  QUOTE_LABEL,
  isCampoGrande,
} from "./shipping-city";

// Reexporta as chaves/helpers puros para quem importa de "@/lib/shipping".
export {
  PICKUP_KEY,
  DELIVERY_KEY,
  DELIVERY_QUOTE_KEY,
  QUOTE_LABEL,
  isCampoGrande,
} from "./shipping-city";

/** Chave de setting do frete cobrado FORA de Campo Grande. */
export const OUT_FEE_KEY = "ship_out_fee";

export interface ShipOption {
  key: string;
  label: string;
  cents: number;
  /** Texto curto de prazo mostrado no checkout. */
  eta: string;
}

export interface ShippingConfig {
  /** Entrega dentro de Campo Grande em centavos (hoje sempre 0 = grátis). */
  cgDeliveryCents: number;
  /**
   * Frete FORA de Campo Grande em centavos, ou `null` quando não há valor
   * definido no painel — nesse caso o frete fica "A combinar".
   */
  outDeliveryCents: number | null;
  options: ShipOption[];
}

/** Frete já resolvido para uma cidade específica. */
export interface ResolvedShipping {
  /** Método que fica gravado no pedido: pickup / delivery / delivery_quote. */
  method: string;
  /** Valor cobrado agora (0 quando grátis ou "a combinar"). */
  cents: number;
  /** true quando o frete é "A combinar" (sem valor fixo, acertado depois). */
  quote: boolean;
  /** Rótulo curto para exibição. */
  label: string;
}

/** Converte "25,00" / "25.00" / "R$ 25" em centavos. */
export function reaisToCents(v: string | undefined | null): number {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^0-9.,]/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/**
 * Lê o frete de fora de Campo Grande do painel.
 * Vazio / sem dígitos ("a combinar") → `null`. Com número → centavos.
 */
export function parseOutFee(v: string | undefined | null): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (s === "" || !/\d/.test(s)) return null;
  return reaisToCents(s);
}

/** Lê a configuração de entrega a partir das settings (ou usa padrões). */
export async function getShippingConfig(): Promise<ShippingConfig> {
  let map = new Map<string, string>();
  if (hasSupabase) {
    const sb = getSupabaseAdmin();
    const { data } = await sb.from(T.settings).select("key, value");
    map = new Map((data ?? []).map((s) => [s.key, s.value]));
  }
  const cgDeliveryCents = 0; // Campo Grande: entrega sempre grátis.
  const outDeliveryCents = parseOutFee(map.get(OUT_FEE_KEY));

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
      cents: cgDeliveryCents,
      eta: "Grátis em Campo Grande · receba em até 24h",
    },
  ];

  return { cgDeliveryCents, outDeliveryCents, options };
}

/**
 * Resolve o frete para uma cidade: Campo Grande é grátis; fora usa o valor do
 * painel, ou "A combinar" quando não há valor definido. Retirada é sempre 0.
 * Usado no servidor (checkout, autoritativo) e espelhado no cliente.
 */
export function resolveShipping(
  cfg: ShippingConfig,
  method: string | undefined | null,
  city: string | undefined | null
): ResolvedShipping {
  if (isPickup(method)) {
    return { method: PICKUP_KEY, cents: 0, quote: false, label: "Retirada no local" };
  }
  if (isCampoGrande(city)) {
    return {
      method: DELIVERY_KEY,
      cents: cfg.cgDeliveryCents,
      quote: false,
      label: "Entrega em Campo Grande",
    };
  }
  if (cfg.outDeliveryCents == null) {
    return {
      method: DELIVERY_QUOTE_KEY,
      cents: 0,
      quote: true,
      label: `Entrega (frete ${QUOTE_LABEL.toLowerCase()})`,
    };
  }
  return {
    method: DELIVERY_KEY,
    cents: cfg.outDeliveryCents,
    quote: false,
    label: "Entrega fora de Campo Grande",
  };
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
