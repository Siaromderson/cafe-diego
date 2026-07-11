"use client";

import { useState, useTransition } from "react";

type Result = { ok: boolean; message: string };

/**
 * Botão "Enviar teste" do WhatsApp. Chama a server action e mostra o
 * resultado (sucesso/erro) logo abaixo, sem recarregar a página.
 */
export function TestWhatsappButton({
  action,
}: {
  action: () => Promise<Result>;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  const run = () =>
    start(async () => {
      setResult(null);
      try {
        setResult(await action());
      } catch {
        setResult({
          ok: false,
          message: "Erro inesperado ao enviar. Tente de novo.",
        });
      }
    });

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn-gold rounded-full px-6 py-2.5 text-sm disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar teste"}
      </button>
      {result && (
        <p
          className={`text-right text-sm ${
            result.ok ? "text-gold" : "text-wine-bright"
          }`}
        >
          {result.ok ? "✅ " : "⚠ "}
          {result.message}
        </p>
      )}
    </div>
  );
}
