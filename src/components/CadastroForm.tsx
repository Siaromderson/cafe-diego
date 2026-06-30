"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { registerCustomer } from "@/app/cadastro/actions";

const field =
  "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-cream placeholder:text-cream/35 outline-none transition-colors focus:border-gold/60";

export function CadastroForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await registerCustomer(data);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Não foi possível concluir o cadastro.");
    });
  };

  if (done) {
    return (
      <div className="glass rounded-3xl p-8 text-center sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e7c987] to-[#b07c2a]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-coffee-2" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-display mt-6 text-2xl text-cream">
          Cadastro feito!
        </h2>
        <p className="mt-2 text-cream/65">
          Pronto, você está na nossa lista. Em breve a gente manda as novidades e
          ofertas do Café do Feirante.
        </p>
        <Link
          href="/#produtos"
          className="btn-gold mt-7 inline-block rounded-full px-8 py-3 text-sm uppercase tracking-wide"
        >
          Ver os cafés
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass space-y-4 rounded-3xl p-7 sm:p-9">
      <div>
        <label className="text-xs uppercase tracking-widest text-cream/55">
          Nome
        </label>
        <input
          name="name"
          required
          placeholder="Seu nome"
          className={`mt-1.5 ${field}`}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-cream/55">
          WhatsApp
        </label>
        <input
          name="phone"
          inputMode="tel"
          placeholder="(67) 99999-0000"
          className={`mt-1.5 ${field}`}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-cream/55">
          E-mail
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder="voce@email.com"
          className={`mt-1.5 ${field}`}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-wine-bright/30 bg-wine-bright/10 px-4 py-2.5 text-sm text-wine-bright">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="btn-gold w-full rounded-full px-6 py-3.5 text-sm uppercase tracking-wide disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Quero me cadastrar"}
      </button>
      <p className="text-center text-xs text-cream/40">
        Seus dados ficam só com a gente, para avisar de novidades e ofertas.
      </p>
    </form>
  );
}
