import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getCurrentUser, getIsAdmin } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { RealtimeRefresh } from "@/components/admin/RealtimeRefresh";
import { AdminNav } from "@/components/admin/AdminNav";

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <RealtimeRefresh />
      <header className="glass-strong sticky top-3 z-30 flex flex-col items-start justify-between gap-4 rounded-3xl px-5 py-4 sm:flex-row sm:items-center sm:px-6">
        <BrandMark />
        <AdminNav />
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
