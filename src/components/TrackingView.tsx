"use client";

import { useState } from "react";

interface TrackingEvent {
  description: string;
  at: string | null;
  location: string | null;
}

interface TrackingResult {
  code: string;
  delivered: boolean;
  events: TrackingEvent[];
}

function formatWhen(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Botão "Rastrear" que busca os eventos dos Correios para um código e os
 * exibe numa linha do tempo. Usado na área do cliente e no painel admin.
 */
export function TrackingView({ code }: { code: string }) {
  const [events, setEvents] = useState<TrackingEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function load() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (events) return; // já carregado
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/rastreio?code=${encodeURIComponent(code)}`);
      const d = await r.json();
      if (!r.ok) {
        setError(d?.error || "Não foi possível rastrear agora.");
        return;
      }
      setEvents((d as TrackingResult).events ?? []);
    } catch {
      setError("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-sm">
      <button
        type="button"
        onClick={load}
        className="inline-flex items-center gap-1.5 text-gold hover:underline"
      >
        📦 Rastrear{" "}
        <span className="font-mono text-xs text-cream/60">{code}</span>
        <span className="text-cream/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-2">
          {loading && <p className="text-xs text-cream/55">carregando…</p>}
          {error && <p className="text-xs text-wine-bright">{error}</p>}
          {events && events.length === 0 && (
            <p className="text-xs text-cream/55">
              Ainda sem movimentações registradas.
            </p>
          )}
          {events && events.length > 0 && (
            <ol className="mt-1 space-y-2 border-l border-white/10 pl-4">
              {events.map((ev, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[1.30rem] top-1 h-2 w-2 rounded-full ${
                      i === 0 ? "bg-gold" : "bg-white/25"
                    }`}
                  />
                  <p className="text-cream/85">{ev.description}</p>
                  <p className="text-xs text-cream/45">
                    {[formatWhen(ev.at), ev.location]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
