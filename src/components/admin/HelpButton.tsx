"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Botão de dúvida "?" que abre um balão explicando como aquela
 * parte do painel funciona. Use ao lado de cada título de seção.
 */
export function HelpButton({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Ajuda: ${title}`}
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
          open
            ? "border-gold/70 bg-gold/20 text-gold"
            : "border-gold/30 text-gold/70 hover:border-gold/60 hover:text-gold"
        }`}
      >
        ?
      </button>

      {open && (
        <div className="animate-pop-in glass-strong absolute left-0 top-8 z-30 w-72 rounded-2xl border border-gold/25 p-4 text-left shadow-2xl sm:w-80">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-base">💡</span>
            <p className="font-display text-sm text-gold">{title}</p>
          </div>
          <div className="space-y-2 text-xs leading-relaxed text-cream/75">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
