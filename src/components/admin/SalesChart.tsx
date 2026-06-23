"use client";

import { BRL } from "@/lib/types";

export interface ChartPoint {
  label: string; // ex: "23/06"
  revenueCents: number;
  orders: number;
}

/**
 * Gráfico de barras de faturamento por dia (últimos dias).
 * SVG puro — sem bibliotecas. Cores da marca (vermelho → dourado).
 */
export function SalesChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  const totalOrders = data.reduce((n, d) => n + d.orders, 0);

  return (
    <div className="glass card-hover rounded-2xl p-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/55">
            Faturamento — últimos {data.length} dias
          </p>
          <p className="font-display mt-1 text-2xl font-semibold gold-text">
            {BRL(data.reduce((n, d) => n + d.revenueCents, 0))}
          </p>
        </div>
        <span className="text-xs text-cream/45">{totalOrders} pedidos pagos</span>
      </div>

      <div className="mt-5 flex h-40 items-end gap-1.5 sm:gap-2">
        {data.map((d, i) => {
          const pct = (d.revenueCents / max) * 100;
          return (
            <div
              key={i}
              className="group flex flex-1 flex-col items-center justify-end gap-1"
              title={`${d.label}: ${BRL(d.revenueCents)} · ${d.orders} pedido(s)`}
            >
              <span className="text-[10px] text-cream/0 transition-colors group-hover:text-gold">
                {d.revenueCents > 0 ? BRL(d.revenueCents) : ""}
              </span>
              <div
                className="w-full origin-bottom rounded-t-md transition-[filter] group-hover:brightness-110"
                style={{
                  height: `${Math.max(pct, d.revenueCents > 0 ? 4 : 1.5)}%`,
                  background:
                    d.revenueCents > 0
                      ? "linear-gradient(180deg, #e7c987 0%, #d98a3d 45%, #cf2b22 100%)"
                      : "rgba(245,236,217,0.08)",
                  animation: `grow-bar 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both`,
                }}
              />
              <span className="text-[9px] text-cream/40">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
