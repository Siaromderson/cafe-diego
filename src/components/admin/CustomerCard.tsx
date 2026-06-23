"use client";

import { useState } from "react";
import { BRL } from "@/lib/types";
import type { CustomerView } from "@/lib/customers";

const STATUS: Record<string, string> = {
  pending: "Aguardando",
  paid: "Pago",
  delivered: "Entregue",
  canceled: "Cancelado",
};

function nextLabel(c: CustomerView) {
  if (c.nextPurchase == null || c.daysUntilNext == null) return null;
  const date = new Date(c.nextPurchase).toLocaleDateString("pt-BR");
  if (c.daysUntilNext < 0)
    return { text: `Atrasado ${Math.abs(c.daysUntilNext)}d (previsto ${date})`, tone: "red" };
  if (c.daysUntilNext <= 7)
    return { text: `Em ~${c.daysUntilNext}d (${date})`, tone: "gold" };
  return { text: `~${date}`, tone: "cream" };
}

export function CustomerCard({ c }: { c: CustomerView }) {
  const [open, setOpen] = useState(false);
  const next = nextLabel(c);

  return (
    <div className="glass card-hover rounded-2xl p-5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <p className="font-display text-lg text-cream">
            {c.name || "Cliente"}
          </p>
          <p className="text-sm text-cream/55">
            {c.email}
            {c.phone ? ` · ${c.phone}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/6 px-2.5 py-1 text-cream/75">
              {c.paidCount} compra{c.paidCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-white/6 px-2.5 py-1 text-cream/75">
              Total {BRL(c.totalCents)}
            </span>
            {c.avgIntervalDays != null && (
              <span className="rounded-full bg-white/6 px-2.5 py-1 text-cream/75">
                Compra a cada ~{c.avgIntervalDays}d
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {next ? (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                next.tone === "red"
                  ? "bg-wine-bright/25 text-cream"
                  : next.tone === "gold"
                    ? "bg-gold/20 text-gold"
                    : "bg-white/8 text-cream/75"
              }`}
              title="Previsão da próxima compra com base na frequência"
            >
              🔮 {next.text}
            </span>
          ) : (
            <span className="rounded-full bg-white/6 px-3 py-1 text-xs text-cream/45">
              sem previsão ainda
            </span>
          )}
          <span className="text-xs text-cream/40">
            {open ? "▲ ocultar" : "▼ histórico"}
          </span>
        </div>
      </button>

      {open && (
        <div className="animate-pop-in mt-4 border-t border-white/10 pt-4">
          {c.addresses.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase tracking-widest text-cream/45">
                Endereços
              </p>
              <ul className="mt-1 space-y-0.5 text-sm text-cream/75">
                {c.addresses.map((a, i) => (
                  <li key={i}>📍 {a}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs uppercase tracking-widest text-cream/45">
            Histórico de pedidos
          </p>
          {c.history.length === 0 ? (
            <p className="mt-1 text-sm text-cream/50">Nenhum pedido ainda.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {c.history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/4 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-cream/80">
                      {new Date(h.date).toLocaleDateString("pt-BR")}
                    </span>
                    <span className="ml-2 text-cream/55">{h.items}</span>
                  </div>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-xs text-cream/45">
                      {STATUS[h.status] ?? h.status}
                    </span>
                    <span className="text-gold">{BRL(h.total_cents)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
