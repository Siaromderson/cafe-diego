"use client";

import type { ViewsChartMeta } from "@/lib/views-chart";

/**
 * Gráfico de barras de visitas ao site.
 * Segue o filtro de data do painel (hora para hoje/ontem, dia para os demais).
 */
export function ViewsChart({ meta }: { meta: ViewsChartMeta }) {
  const { points, total, granularity, subtitle } = meta;
  const max = Math.max(1, ...points.map((d) => d.views));

  return (
    <div className="glass card-hover rounded-2xl p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/55">
            Visitas ao site — {subtitle}
          </p>
          <p className="font-display mt-1 text-2xl font-semibold gold-text">
            {total.toLocaleString("pt-BR")}
          </p>
        </div>
        <span className="text-right text-xs text-cream/45">
          {granularity === "hour"
            ? "cada barra = 1 hora (horário de Cuiabá)"
            : "cada barra = 1 dia (horário de Cuiabá)"}
        </span>
      </div>

      <div
        className={`mt-5 flex items-stretch gap-1 overflow-hidden sm:gap-1.5 ${
          granularity === "hour" ? "h-40" : "h-44"
        }`}
      >
        {points.map((d, i) => {
          const pct = (d.views / max) * 100;
          return (
            <div
              key={`${d.label}-${i}`}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${d.views.toLocaleString("pt-BR")} visita(s)`}
            >
              <span className="h-3.5 truncate text-[10px] leading-none text-cream/0 transition-colors group-hover:text-gold">
                {d.views > 0 ? d.views.toLocaleString("pt-BR") : ""}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full origin-bottom rounded-t-md transition-[filter] group-hover:brightness-110"
                  style={{
                    height: `${Math.max(pct, d.views > 0 ? 4 : 1.5)}%`,
                    background:
                      d.views > 0
                        ? "linear-gradient(180deg, #c8e6ff 0%, #7eb8e8 50%, #4a7fc4 100%)"
                        : "rgba(245,236,217,0.08)",
                    animation: `grow-bar 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.03}s both`,
                  }}
                />
              </div>
              <span
                className={`w-full truncate text-center text-cream/40 ${
                  granularity === "hour" ? "text-[8px]" : "text-[9px]"
                }`}
              >
                {granularity === "hour" && i % 2 === 1 ? "" : d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
