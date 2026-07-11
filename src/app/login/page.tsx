"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/env";
import { BrandMark } from "@/components/BrandMark";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setError(null);
    if (!email || !password) return setError("Informe e-mail e senha.");
    if (!hasSupabase) {
      setError("Login disponível após configurar o Supabase.");
      return;
    }
    setLoading(true);
    try {
      const sb = supabaseBrowser();
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setLoading(false);
        console.error("[login] erro do supabase:", error);
        setError(
          error.message === "Invalid login credentials"
            ? "E-mail ou senha inválidos."
            : String(error.message || "Falha no login.")
        );
        return;
      }
      // Admin vai para o painel; cliente vai para "Minhas compras".
      const { data: adminRow } = await sb
        .from("cafe_diego_admins")
        .select("email")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      setLoading(false);
      router.push(adminRow ? "/admin" : "/conta");
      router.refresh();
    } catch (err) {
      setLoading(false);
      console.error("[login] exceção:", err);
      setError(
        err instanceof Error ? err.message : "Não foi possível conectar."
      );
    }
  }

  const input =
    "w-full rounded-xl border border-white/12 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-cream/35 outline-none focus:border-gold/60";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <Link href="/">
        <BrandMark />
      </Link>
      <div className="glass mt-10 w-full rounded-3xl p-8">
        <h1 className="font-display text-3xl font-semibold text-cream">
          Entrar
        </h1>
        <p className="mt-1 text-sm text-cream/60">
          Acesse sua conta para ver suas compras.
        </p>

        <input
          className={`${input} mt-6`}
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        <input
          className={`${input} mt-3`}
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        {error && <p className="mt-3 text-sm text-wine-bright">{error}</p>}
        <button
          onClick={login}
          disabled={loading}
          className="btn-gold mt-4 w-full rounded-full py-3 text-sm uppercase tracking-wide disabled:opacity-60"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>

        <p className="mt-5 text-center text-xs text-cream/55">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-gold hover:underline">
            Cadastre-se
          </Link>
        </p>
        <Link
          href="/"
          className="mt-3 block text-center text-xs text-cream/50 hover:text-gold"
        >
          ← voltar à loja
        </Link>
      </div>
    </main>
  );
}
