"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { useCart } from "@/store/cart";
import { hasSupabase } from "@/lib/env";
import { supabaseBrowser } from "@/lib/supabase/client";

const LINKS = [
  { href: "/#produtos", label: "Produtos" },
  { href: "/#moagem", label: "Moagem" },
  { href: "/#historia", label: "A História" },
  { href: "/#entrega", label: "Entrega" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const count = useCart((s) => s.count());
  const setOpen = useCart((s) => s.setOpen);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!hasSupabase) {
      setLoggedIn(false);
      return;
    }
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => setLoggedIn(Boolean(data.session)));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) =>
      setLoggedIn(Boolean(session))
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        className={[
          "mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 sm:px-6",
          scrolled
            ? "glass-strong shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
            : "border border-transparent bg-transparent",
        ].join(" ")}
      >
        <Link href="/" className="shrink-0">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium tracking-wide text-cream/75 transition-colors hover:text-gold"
            >
              {l.label}
            </a>
          ))}
          {loggedIn ? (
            <Link
              href="/conta"
              className="text-sm font-medium tracking-wide text-gold transition-colors hover:text-amber"
            >
              Minhas compras
            </Link>
          ) : (
            <Link
              href="/cadastro"
              className="text-sm font-medium tracking-wide text-gold transition-colors hover:text-amber"
            >
              Cadastre-se
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={loggedIn ? "/conta" : "/login"}
            aria-label={loggedIn ? "Minhas compras" : "Entrar"}
            className="flex items-center gap-2 rounded-full border border-cream/15 px-3 py-2 text-sm font-medium text-cream/80 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 5v1h14v-1c0-3-3-5-7-5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">
              {loggedIn ? "Minhas compras" : "Entrar"}
            </span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="group relative flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
              <path
                d="M6 6h15l-1.5 9h-12L6 6Zm0 0-.7-3H3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="20" r="1.4" fill="currentColor" />
              <circle cx="18" cy="20" r="1.4" fill="currentColor" />
            </svg>
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-wine-bright px-1 text-[0.65rem] font-bold text-white">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
