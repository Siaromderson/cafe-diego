/** Intervalos de data para o painel (dashboard, relatórios). */

export type RangeKey =
  | "today"
  | "yesterday"
  | "week"
  | "month"
  | "all"
  | "custom";

export interface Range {
  key: RangeKey;
  from: Date | null;
  to: Date | null;
  label: string;
}

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
  { key: "all", label: "Tudo" },
  { key: "custom", label: "Personalizado" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Resolve a faixa de datas a partir dos search params. */
export function resolveRange(params: {
  range?: string;
  from?: string;
  to?: string;
}): Range {
  const now = new Date();
  const key = (params.range as RangeKey) || "month";

  switch (key) {
    case "today":
      return { key, from: startOfDay(now), to: endOfDay(now), label: "Hoje" };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      return {
        key,
        from: startOfDay(y),
        to: endOfDay(y),
        label: "Ontem",
      };
    }
    case "week": {
      const f = new Date(now);
      f.setDate(now.getDate() - 6);
      return {
        key,
        from: startOfDay(f),
        to: endOfDay(now),
        label: "Últimos 7 dias",
      };
    }
    case "month": {
      const f = new Date(now);
      f.setDate(now.getDate() - 29);
      return {
        key,
        from: startOfDay(f),
        to: endOfDay(now),
        label: "Últimos 30 dias",
      };
    }
    case "all":
      return { key, from: null, to: null, label: "Todo o período" };
    case "custom": {
      const from = params.from ? startOfDay(new Date(params.from)) : null;
      const to = params.to ? endOfDay(new Date(params.to)) : null;
      const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
      const label =
        from && to
          ? `${fmt(from)} – ${fmt(to)}`
          : from
            ? `desde ${fmt(from)}`
            : to
              ? `até ${fmt(to)}`
              : "Personalizado";
      return { key, from, to, label };
    }
    default:
      return { key: "month", from: null, to: null, label: "Últimos 30 dias" };
  }
}

/** A data (string ISO ou Date) está dentro da faixa? */
export function inRange(dateLike: string | Date | null, r: Range): boolean {
  if (!dateLike) return false;
  const d = new Date(dateLike);
  if (r.from && d < r.from) return false;
  if (r.to && d > r.to) return false;
  return true;
}
