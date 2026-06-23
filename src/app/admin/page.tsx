import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { BRL } from "@/lib/types";
import { HelpButton } from "@/components/admin/HelpButton";
import { SalesChart, type ChartPoint } from "@/components/admin/SalesChart";
import { DateRangeFilter } from "@/components/admin/DateRangeFilter";
import { ExportButton, type ReportRow } from "@/components/admin/ExportButton";
import { OrderCard, type OrderRow } from "@/components/admin/OrderCard";
import { resolveRange, inRange } from "@/lib/admin-range";

export const dynamic = "force-dynamic";

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = resolveRange(sp);

  const sb = await getSupabaseServer();
  const { data: orders } = await sb
    .from(T.orders)
    .select("*, order_items:cafe_diego_order_items(*)")
    .order("created_at", { ascending: false })
    .limit(500);

  const all = (orders ?? []) as (OrderRow & {
    paid_at?: string;
    address_json?: { city?: string };
  })[];

  // Filtra pelo período selecionado
  const inWindow = all.filter((o) => inRange(o.created_at, range));

  // "Entregue" e "Cancelado" saem da lista de pedidos ativos
  const active = inWindow.filter(
    (o) => o.status !== "delivered" && o.status !== "canceled"
  );
  const paid = inWindow.filter(
    (o) => o.status === "paid" || o.status === "delivered"
  );
  const revenue = paid.reduce((n, o) => n + (o.total_cents ?? 0), 0);
  const pendingCount = inWindow.filter((o) => o.status === "pending").length;
  const ticket = paid.length ? Math.round(revenue / paid.length) : 0;

  // ---- Série diária para o gráfico (dentro do período; máx ~30 barras) ----
  const today = new Date();
  let start = range.from ? new Date(range.from) : null;
  const end = range.to ? new Date(range.to) : today;
  if (!start) {
    start = new Date(end);
    start.setDate(end.getDate() - 13);
  }
  const dayMs = 86_400_000;
  let span = Math.floor((end.getTime() - start.getTime()) / dayMs) + 1;
  if (span < 1) span = 1;
  if (span > 31) {
    start = new Date(end);
    start.setDate(end.getDate() - 30);
    span = 31;
  }
  const series: ChartPoint[] = [];
  for (let i = 0; i < span; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const dayOrders = paid.filter(
      (o) => (o.paid_at || o.created_at || "").slice(0, 10) === key
    );
    series.push({
      label: `${String(d.getDate()).padStart(2, "0")}/${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`,
      revenueCents: dayOrders.reduce((n, o) => n + (o.total_cents ?? 0), 0),
      orders: dayOrders.length,
    });
  }

  // ---- Linhas para exportar (relatório do período) ----
  const reportRows: ReportRow[] = inWindow.map((o) => ({
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

  const cards = [
    { label: "Pedidos", value: String(inWindow.length), icon: "🧾", accent: "from-gold/20" },
    { label: "Faturamento", value: BRL(revenue), icon: "💰", accent: "from-amber/20" },
    { label: "Ticket médio", value: BRL(ticket), icon: "📈", accent: "from-wine-bright/20" },
    { label: "Aguardando", value: String(pendingCount), icon: "⏳", accent: "from-cream/15" },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="font-display text-3xl font-semibold text-cream">
          Visão geral
        </h1>
        <HelpButton title="O que é esta tela?">
          <p>
            Seu <strong>resumo do negócio</strong>. Os cards e o gráfico mostram
            os números do período escolhido no filtro acima.
          </p>
          <p>
            <strong>Filtro de data:</strong> escolha Hoje, Ontem, Semana, Mês ou
            um período Personalizado — tudo na tela se ajusta.
          </p>
          <p>
            <strong>Exportar relatório:</strong> baixa uma planilha (.csv) com
            todos os pedidos do período, pronta pro Excel.
          </p>
        </HelpButton>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeFilter />
        <div className="flex items-center gap-2">
          <span className="text-xs text-cream/45">{range.label}</span>
          <ExportButton rows={reportRows} filename={`pedidos-${range.key}`} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`glass card-hover relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.accent} to-transparent p-5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-cream/55">
                {c.label}
              </span>
              <span className="text-lg opacity-80">{c.icon}</span>
            </div>
            <div className="font-display mt-2 text-2xl font-semibold gold-text">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <SalesChart data={series} />
      </div>

      <div className="mt-8 mb-4 flex items-center gap-2">
        <h2 className="font-display text-2xl text-cream">
          Pedidos ativos
          <span className="ml-2 text-base text-cream/45">{active.length}</span>
        </h2>
        <HelpButton title="Como gerenciar pedidos">
          <p>
            Aqui ficam os pedidos <strong>em andamento</strong>. Use o seletor de
            status à direita de cada um:
          </p>
          <ul className="ml-4 list-disc space-y-0.5">
            <li><strong>Aguardando</strong> — cliente ainda não pagou</li>
            <li><strong>Pago</strong> — confirmado (baixa o estoque sozinho)</li>
            <li><strong>Entregue</strong> — sai daqui e vai pra aba “Entregues”</li>
            <li><strong>Cancelado</strong> — remove o pedido da lista</li>
          </ul>
        </HelpButton>
      </div>

      {active.length === 0 ? (
        <p className="glass rounded-2xl p-8 text-center text-cream/60">
          Nenhum pedido ativo neste período.
        </p>
      ) : (
        <div className="space-y-4">
          {active.map((o) => (
            <OrderCard key={o.id} o={o} />
          ))}
        </div>
      )}
    </div>
  );
}
