"use client";

import { useState, useTransition } from "react";
import { deleteCustomer } from "@/app/admin/actions";

/**
 * Exclusão de cliente com dupla confirmação:
 * 1) abre o aviso e a pessoa clica em "Sim, quero excluir";
 * 2) digita uma palavra de confirmação (o nome do cliente, "APAGAR" ou
 *    "DELETAR") para liberar o botão de excluir de verdade.
 */
export function DeleteCustomerButton({
  name,
  phone,
  email,
}: {
  name: string;
  phone?: string;
  email?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  const accepted = [name, "APAGAR", "DELETAR", "EXCLUIR"]
    .filter(Boolean)
    .map((w) => w.trim().toLowerCase());
  const canDelete = accepted.includes(text.trim().toLowerCase());

  function close() {
    if (pending) return;
    setOpen(false);
    setStep(1);
    setText("");
  }

  function confirm() {
    if (!canDelete) return;
    start(async () => {
      await deleteCustomer({ phone, email });
      close();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-wine-bright/90 underline underline-offset-2 hover:text-wine-bright"
      >
        Excluir cliente
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fechar"
            onClick={close}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />
          <div className="glass-strong animate-pop-in relative w-full max-w-sm rounded-3xl p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-wine-bright/15 text-2xl text-wine-bright">
              ⚠
            </div>
            <h3 className="font-display mt-4 text-xl text-cream">
              Excluir {name || "cliente"}?
            </h3>

            {step === 1 ? (
              <>
                <div className="mt-2 text-sm text-cream/65">
                  Isso apaga <strong>o cliente, os pedidos e o histórico</strong>{" "}
                  dele em definitivo. <strong>Não dá pra desfazer.</strong>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    className="btn-ghost flex-1 rounded-full px-4 py-2.5 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="btn-red flex-1 rounded-full px-4 py-2.5 text-sm"
                  >
                    Sim, quero excluir
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 text-sm text-cream/65">
                  Para confirmar, digite{" "}
                  <strong className="text-cream">APAGAR</strong> (ou o nome do
                  cliente) abaixo.
                </div>
                <input
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && confirm()}
                  placeholder="APAGAR"
                  className="mt-4 w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-center text-sm text-cream outline-none focus:border-wine-bright/60"
                />
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={close}
                    disabled={pending}
                    className="btn-ghost flex-1 rounded-full px-4 py-2.5 text-sm disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={!canDelete || pending}
                    className="btn-red flex-1 rounded-full px-4 py-2.5 text-sm disabled:opacity-40"
                  >
                    {pending ? "Excluindo…" : "Excluir definitivamente"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
