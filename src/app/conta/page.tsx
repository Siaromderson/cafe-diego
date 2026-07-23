import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { BRL } from "@/lib/types";
import { BrandMark } from "@/components/BrandMark";
import { LogoutButton } from "@/components/LogoutButton";
import { TrackingView } from "@/components/TrackingView";
import { formatDateBR, formatPlainDateBR } from "@/lib/timezone";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Aguardando pagamento", cls: "text-gold" },
  paid: { label: "Pago — preparando", cls: "text-cream" },
  delivered: { label: "Entregue", cls: "text-emerald-300" },
  canceled: { label: "Cancelado", cls: "text-wine-bright" },
};

export default async function AccountPage() {
  if (!hasSupabase) redirect("/");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sb = await getSupabaseServer();
  const { data: orders } = await sb
    .from(T.orders)
    .select("*, order_items:cafe_diego_order_items(*)")
    .order("created_at", { ascending: false });

  const list = orders ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <Link href="/">
          <BrandMark />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-cream/60 hover:text-gold">
            Loja ↗
          </Link>
          <LogoutButton />
        </div>
      </div>

      <h1 className="font-display mt-10 text-3xl font-semibold text-cream">
        Minhas compras
      </h1>
      <p className="mt-1 text-sm text-cream/55">{user.email}</p>

      {list.length === 0 ? (
        <p className="glass mt-6 rounded-2xl p-8 text-center text-cream/60">
          Você ainda não fez pedidos.{" "}
          <Link href="/#produtos" className="text-gold hover:underline">
            Ver produtos
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((o) => {
            const st = STATUS[o.status] ?? STATUS.pending;
            return (
              <div key={o.id} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cream/50">
                    #{o.id.slice(0, 8)} · {formatDateBR(o.created_at)}
                  </span>
                  <span className={`text-sm font-medium ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-cream/80">
                  {(o.order_items ?? []).map(
                    (it: { id: string; qty: number; name: string }) => (
                      <li key={it.id}>
                        {it.qty}× {it.name}
                      </li>
                    )
                  )}
                </ul>
                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  {o.delivery_eta && o.status !== "delivered" && (
                    <span className="text-xs text-cream/55">
                      Entrega até {formatPlainDateBR(o.delivery_eta)}
                    </span>
                  )}
                  <span className="ml-auto font-display text-lg font-semibold gold-text">
                    {BRL(o.total_cents ?? 0)}
                  </span>
                </div>
                {o.tracking_code && (
                  <div className="mt-2 border-t border-white/10 pt-2">
                    <TrackingView code={o.tracking_code} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
