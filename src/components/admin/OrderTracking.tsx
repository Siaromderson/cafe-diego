"use client";

import { useState, useTransition } from "react";
import { setOrderTracking } from "@/app/admin/actions";
import { TrackingView } from "@/components/TrackingView";

/**
 * Campo do painel para colar/editar o código de rastreio dos Correios de um
 * pedido. Ao salvar, o cliente passa a ver o rastreio em "Minhas compras".
 */
export function OrderTracking({
  id,
  code,
}: {
  id: string;
  code?: string | null;
}) {
  const [value, setValue] = useState(code ?? "");
  const [pending, start] = useTransition();
  const saved = (code ?? "").trim();

  function save() {
    start(() => setOrderTracking(id, value));
  }

  return (
    <div className="mt-3 border-t border-white/10 pt-3">
      <p className="text-xs uppercase tracking-widest text-cream/45">
        Rastreio (Correios)
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Ex: AA123456789BR"
          className="w-44 rounded-lg border border-white/15 bg-coffee-2 px-3 py-1.5 font-mono text-sm text-cream outline-none focus:border-gold/60"
        />
        <button
          type="button"
          onClick={save}
          disabled={pending || value.trim() === saved}
          className="btn-gold rounded-full px-4 py-1.5 text-xs uppercase tracking-wide disabled:opacity-50"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </div>
      {saved && (
        <div className="mt-2">
          <TrackingView code={saved} />
        </div>
      )}
    </div>
  );
}
