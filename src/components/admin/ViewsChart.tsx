"use client";

import type { ViewsChartMeta } from "@/lib/views-chart";

const W = 800;
const H = 220;
const PAD = { top: 24, right: 20, bottom: 36, left: 20 };

/**
 * Gráfico de linhas de visitas ao site (SVG).
 * Segue o filtro de data do painel (hora para hoje/ontem, dia para os demais).
 */
export function ViewsChart({ meta }: { meta: ViewsChartMeta }) {
  const { points, total, granularity, subtitle } = meta;
  const max = Math.max(1, ...points.map((d) => d.views));
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const baseY = PAD.top + chartH;

  const coords = points.map((p, i) => ({
    ...p,
    x:
      PAD.left +
      (points.length <= 1 ? chartW / 2 : (i / (points.length - 1)) * chartW),
    y: PAD.top + chartH - (p.views / max) * chartH,
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${baseY} L ${coords[0].x.toFixed(1)} ${baseY} Z`
      : "";

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
            ? "linha por hora (horário de Cuiabá)"
            : "linha por dia (horário de Cuiabá)"}
        </span>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-52 w-full min-w-[280px]"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`Gráfico de visitas: ${total} no período`}
        >
          {/* grade horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD.top + chartH * (1 - t);
            const val = Math.round(max * t);
            return (
              <g key={t}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={W - PAD.right}
                  y2={y}
                  stroke="rgba(245,236,217,0.08)"
                  strokeWidth={1}
                />
                {t > 0 && (
                  <text
                    x={PAD.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-cream/35 text-[10px]"
                  >
                    {val}
                  </text>
                )}
              </g>
            );
          })}

          {/* linha base */}
          <line
            x1={PAD.left}
            y1={baseY}
            x2={W - PAD.right}
            y2={baseY}
            stroke="rgba(245,236,217,0.2)"
            strokeWidth={1}
          />

          {/* área sob a linha */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#views-area-gradient)"
              opacity={0.35}
            />
          )}

          {/* linha */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#views-line-gradient)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* pontos */}
          {coords.map((c, i) => (
            <g key={`${c.label}-${i}`}>
              <circle
                cx={c.x}
                cy={c.y}
                r={c.views > 0 ? 4 : 2.5}
                fill={c.views > 0 ? "#7eb8e8" : "rgba(245,236,217,0.15)"}
                stroke={c.views > 0 ? "#c8e6ff" : "transparent"}
                strokeWidth={1.5}
              >
                <title>
                  {c.label}: {c.views.toLocaleString("pt-BR")} visita(s)
                </title>
              </circle>
              {(granularity === "day" ||
                (granularity === "hour" && i % 2 === 0)) && (
                <text
                  x={c.x}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-cream/45 text-[10px]"
                >
                  {c.label}
                </text>
              )}
            </g>
          ))}

          <defs>
            <linearGradient id="views-line-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7eb8e8" />
              <stop offset="100%" stopColor="#4a7fc4" />
            </linearGradient>
            <linearGradient id="views-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7eb8e8" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
