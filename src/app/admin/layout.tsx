import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getCurrentUser, getIsAdmin } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { RealtimeRefresh } from "@/components/admin/RealtimeRefresh";

const NAV = [
  { href: "/admin", label: "Pedidos" },
  { href: "/admin/entregues", label: "Entregues" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/conteudo", label: "Conteúdo" },
  { href: "/admin/config", label: "Configurações" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabase) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <p className="font-display mt-8 text-2xl text-cream">
          Painel indisponível
        </p>
        <p className="mt-2 text-cream/60">
          Configure o Supabase (variáveis de ambiente) para ativar o painel
          administrativo.
        </p>
      </main>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const admin = await getIsAdmin();
  if (!admin) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <BrandMark />
        <p className="font-display mt-8 text-2xl text-cream">Acesso restrito</p>
        <p className="mt-2 text-cream/60">
          Sua conta ({user.email}) não tem permissão de administrador.
        </p>
        <Link href="/" className="btn-ghost mt-6 rounded-full px-6 py-2 text-sm">
          Voltar à loja
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <RealtimeRefresh />
      <header className="glass-strong flex flex-col items-start justify-between gap-4 rounded-2xl px-6 py-4 sm:flex-row sm:items-center">
        <BrandMark />
        <nav className="flex flex-wrap gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-full px-4 py-2 text-sm text-cream/75 transition-colors hover:bg-white/8 hover:text-gold"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm text-cream/50 hover:text-gold"
          >
            Ver loja ↗
          </Link>
        </nav>
      </header>
      <div className="mt-6">{children}</div>
    </div>
  );
}
