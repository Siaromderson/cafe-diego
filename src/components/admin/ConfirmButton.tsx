"use client";

import { useState, useTransition } from "react";

/**
 * Botão de ação com tela de confirmação (modal).
 * Reutilizável para qualquer ação destrutiva: cancelar/excluir pedido,
 * limpar pedidos, excluir produto, etc.
 */
export function ConfirmButton({
  label,
  className = "",
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  action,
  onDone,
}: {
  label: React.ReactNode;
  className?: string;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  action: () => Promise<unknown> | unknown;
  onDone?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const confirm = () =>
    start(async () => {
      await action();
      setOpen(false);
      onDone?.();
    });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => !pending && setOpen(false)}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <div className="glass-strong animate-pop-in relative w-full max-w-sm rounded-3xl p-6 text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                danger
                  ? "bg-wine-bright/15 text-wine-bright"
                  : "bg-gold/15 text-gold"
              }`}
            >
              {danger ? "⚠" : "?"}
            </div>
            <h3 className="font-display mt-4 text-xl text-cream">{title}</h3>
            <div className="mt-2 text-sm text-cream/65">{message}</div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="btn-ghost flex-1 rounded-full px-4 py-2.5 text-sm disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={pending}
                className={`flex-1 rounded-full px-4 py-2.5 text-sm disabled:opacity-60 ${
                  danger ? "btn-red" : "btn-gold"
                }`}
              >
                {pending ? "…" : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
