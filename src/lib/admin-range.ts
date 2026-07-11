/** Intervalos de data para o painel (dashboard, relatórios). */

import {
  addDaysInTz,
  endOfDayInTz,
  formatDateBR,
  parseDateInputInTz,
  startOfDayInTz,
} from "@/lib/timezone";

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
      return {
        key,
        from: startOfDayInTz(now),
        to: endOfDayInTz(now),
        label: "Hoje",
      };
    case "yesterday": {
      const y = addDaysInTz(now, -1);
      return {
        key,
        from: startOfDayInTz(y),
        to: endOfDayInTz(y),
        label: "Ontem",
      };
    }
    case "week": {
      const f = addDaysInTz(now, -6);
      return {
        key,
        from: startOfDayInTz(f),
        to: endOfDayInTz(now),
        label: "Últimos 7 dias",
      };
    }
    case "month": {
      const f = addDaysInTz(now, -29);
      return {
        key,
        from: startOfDayInTz(f),
        to: endOfDayInTz(now),
        label: "Últimos 30 dias",
      };
    }
    case "all":
      return { key, from: null, to: null, label: "Todo o período" };
    case "custom": {
      const from = params.from ? parseDateInputInTz(params.from) : null;
      const to = params.to
        ? endOfDayInTz(parseDateInputInTz(params.to))
        : null;
      const fmt = (d: Date) => formatDateBR(d);
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
