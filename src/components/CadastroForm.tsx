"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerCustomer } from "@/app/cadastro/actions";
import { PhoneInput } from "@/components/PhoneInput";
import { supabaseBrowser } from "@/lib/supabase/client";

const field =
  "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-cream placeholder:text-cream/35 outline-none transition-colors focus:border-gold/60";

export function CadastroForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    start(async () => {
      const res = await registerCustomer(data);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível concluir o cadastro.");
        return;
      }
      // Já entra na conta e leva o cliente para "Minhas compras".
      try {
        const sb = supabaseBrowser();
        const { error: signInErr } = await sb.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signInErr) {
          setDone(true);
          return;
        }
        router.push("/conta");
        router.refresh();
      } catch {
        setDone(true);
      }
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
          Sua conta está pronta. Entre para acompanhar suas compras.
        </p>
        <Link
          href="/login"
          className="btn-gold mt-7 inline-block rounded-full px-8 py-3 text-sm uppercase tracking-wide"
        >
          Fazer login
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`mt-1.5 ${field}`}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-cream/55">
          WhatsApp
        </label>
        <PhoneInput
          value={phone}
          onChange={setPhone}
          className={`mt-1.5 ${field}`}
        />
        <input type="hidden" name="phone" value={phone} />
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`mt-1.5 ${field}`}
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-widest text-cream/55">
          Senha
        </label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
        {pending ? "Criando conta…" : "Criar minha conta"}
      </button>
      <p className="text-center text-xs text-cream/45">
        Já tem conta?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Entrar
        </Link>
      </p>
      <p className="text-center text-xs text-cream/40">
        Com a conta você acompanha seus pedidos e recebe novidades e ofertas.
      </p>
    </form>
  );
}
