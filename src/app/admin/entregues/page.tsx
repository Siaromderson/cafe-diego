import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { BRL } from "@/lib/types";
import { HelpButton } from "@/components/admin/HelpButton";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { ExportButton, type ReportRow } from "@/components/admin/ExportButton";
import { OrderCard, type OrderRow } from "@/components/admin/OrderCard";
import { resolveRange, inRange } from "@/lib/admin-range";

export const dynamic = "force-dynamic";

export default async function AdminDelivered({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  // padrão "tudo" aqui — o histórico de entregas costuma ser consultado inteiro
  const range = resolveRange({ range: sp.range ?? "all", from: sp.from, to: sp.to });

  const sb = await getSupabaseServer();
  const { data } = await sb
    .from(T.orders)
    .select("*, order_items:cafe_diego_order_items(*)")
    .eq("status", "delivered")
    .order("created_at", { ascending: false })
    .limit(500);

  const all = (data ?? []) as (OrderRow & {
    address_json?: { city?: string };
  })[];
  const list = all.filter((o) => inRange(o.created_at, range));
  const revenue = list.reduce((n, o) => n + (o.total_cents ?? 0), 0);

  const reportRows: ReportRow[] = list.map((o) => ({
    id: o.id,
    created_at: o.created_at,
    customer_name: o.customer_name ?? "",
    customer_phone: o.customer_phone ?? "",
    customer_email: o.customer_email ?? "",
    status: o.status,
    total_cents: o.total_cents ?? 0,
    shipping_cents: o.shipping_cents ?? 0,
    shipping_method: o.shipping_method ?? "",
    city: o.address_json?.city ?? "",
    items: (o.order_items ?? []).map((it) => `${it.qty}x ${it.name}`).join(", "),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="font-display text-3xl font-semibold text-cream">
          Entregues
        </h1>
        <HelpButton title="Pedidos entregues">
          <p>
            Quando você marca um pedido como <strong>Entregue</strong> na tela de
            pedidos, ele sai de lá e aparece aqui — seu histórico de entregas.
          </p>
          <p>Filtre por data e exporte o relatório quando precisar.</p>
        </HelpButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter />
        <div className="flex items-center gap-3">
          <span className="font-display text-lg gold-text">
            {BRL(revenue)} · {list.length} entregas
          </span>
          <ExportButton rows={reportRows} filename={`entregues-${range.key}`} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {list.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center text-cream/60">
            Nenhum pedido entregue neste período.
          </p>
        ) : (
          list.map((o) => <OrderCard key={o.id} o={o} />)
        )}
      </div>
    </div>
  );
}
