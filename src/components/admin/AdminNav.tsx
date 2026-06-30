"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/entregues", label: "Entregues" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/conteudo", label: "Conteúdo" },
  { href: "/admin/config", label: "Configurações" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {NAV.map((n) => {
        const active =
          n.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            className={
              active
                ? "btn-gold rounded-full px-4 py-2 text-sm"
                : "rounded-full px-4 py-2 text-sm text-cream/70 transition-colors hover:bg-white/8 hover:text-gold"
            }
          >
            {n.label}
          </Link>
        );
      })}
      <Link
        href="/"
        className="ml-1 rounded-full px-4 py-2 text-sm text-cream/45 transition-colors hover:text-gold"
      >
        Ver loja ↗
      </Link>
    </nav>
  );
}
