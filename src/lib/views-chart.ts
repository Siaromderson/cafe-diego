import type { Range } from "@/lib/admin-range";
import {
  addDaysInTz,
  endOfDayInTz,
  formatDateKeyInTz,
  getZonedParts,
  startOfDayInTz,
} from "@/lib/timezone";

export interface ViewsChartPoint {
  label: string;
  views: number;
}

export interface ViewsChartMeta {
  points: ViewsChartPoint[];
  total: number;
  granularity: "hour" | "day";
  subtitle: string;
}

interface Bucket {
  label: string;
  views: number;
  key: string;
}

const DAY_MS = 86_400_000;

function isSingleDayRange(range: Range): boolean {
  return range.key === "today" || range.key === "yesterday";
}

/** Intervalo efetivo do gráfico (respeita o filtro; "Tudo" usa últimos 30 dias). */
export function viewsChartWindow(range: Range): { from: Date; to: Date } {
  const now = new Date();

  if (range.from && range.to) {
    return { from: range.from, to: range.to };
  }
  if (range.from) {
    return { from: range.from, to: endOfDayInTz(now) };
  }
  if (range.to) {
    return {
      from: startOfDayInTz(addDaysInTz(range.to, -29)),
      to: range.to,
    };
  }

  return {
    from: startOfDayInTz(addDaysInTz(now, -29)),
    to: endOfDayInTz(now),
  };
}

function buildHourlyBuckets(dayStart: Date): Bucket[] {
  const dayKey = formatDateKeyInTz(dayStart);
  return Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}h`,
    views: 0,
    key: `${dayKey}-${hour}`,
  }));
}

function buildDailyBuckets(from: Date, to: Date): Bucket[] {
  const start = startOfDayInTz(from);
  const end = startOfDayInTz(to);
  let span = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  let effectiveStart = start;
  if (span > 31) {
    effectiveStart = new Date(end.getTime() - 30 * DAY_MS);
    span = 31;
  }
  const buckets: Bucket[] = [];

  for (let i = 0; i < span; i++) {
    const d = new Date(effectiveStart.getTime() + i * DAY_MS);
    const { day, month } = getZonedParts(d);
    buckets.push({
      label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
      views: 0,
      key: formatDateKeyInTz(d),
    });
  }

  return buckets;
}

function bucketKeyForView(
  createdAt: string,
  granularity: "hour" | "day"
): string {
  const d = new Date(createdAt);
  if (granularity === "hour") {
    const { hour } = getZonedParts(d);
    return `${formatDateKeyInTz(d)}-${hour}`;
  }
  return formatDateKeyInTz(d);
}

/**
 * Agrupa visitas (`created_at`) em buckets do gráfico conforme o filtro ativo.
 * Hoje/ontem → por hora; semana/mês/personalizado → por dia.
 */
export function buildViewsChart(
  range: Range,
  rows: { created_at: string }[]
): ViewsChartMeta {
  const { from, to } = viewsChartWindow(range);
  const granularity: "hour" | "day" = isSingleDayRange(range) ? "hour" : "day";

  const buckets =
    granularity === "hour"
      ? buildHourlyBuckets(from)
      : buildDailyBuckets(from, to);

  const index = new Map(buckets.map((b, i) => [b.key, i]));

  let total = 0;
  for (const row of rows) {
    if (!row.created_at) continue;
    const ts = new Date(row.created_at);
    if (ts < from || ts > to) continue;

    const idx = index.get(bucketKeyForView(row.created_at, granularity));
    if (idx === undefined) continue;

    buckets[idx].views += 1;
    total += 1;
  }

  const points = buckets.map(({ label, views }) => ({ label, views }));

  const subtitle =
    granularity === "hour"
      ? `por hora · ${range.label}`
      : `${points.length} dia(s) · ${range.label}`;

  return { points, total, granularity, subtitle };
}
