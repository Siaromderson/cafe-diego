import { BRL } from "@/lib/types";
import { OrderStatus } from "./OrderStatus";
import { ConfirmButton } from "./ConfirmButton";
import { cancelOrder, deleteOrder } from "@/app/admin/actions";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: {
    label: "Aguardando",
    cls: "bg-amber/15 text-amber border-amber/30",
  },
  paid: { label: "Pago", cls: "bg-gold/15 text-gold border-gold/30" },
  delivered: {
    label: "Entregue",
    cls: "bg-emerald-400/12 text-emerald-300 border-emerald-400/30",
  },
  canceled: {
    label: "Cancelado",
    cls: "bg-wine-bright/15 text-wine-bright border-wine-bright/30",
  },
};

const ACCENT: Record<string, string> = {
  pending: "before:bg-amber/60",
  paid: "before:bg-gold/60",
  delivered: "before:bg-emerald-400/60",
  canceled: "before:bg-wine-bright/60",
};

interface Address {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  reference?: string;
}

export interface OrderRow {
  id: string;
  created_at: string;
  delivery_eta?: string | null;
  status: string;
  total_cents?: number;
  shipping_cents?: number;
  shipping_method?: string | null;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address_json?: Address;
  order_items?: { id: string; qty: number; name: string }[];
}

export function OrderCard({ o }: { o: OrderRow }) {
  const addr = (o.address_json ?? {}) as Address;
  const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.pending;
  const accent = ACCENT[o.status] ?? ACCENT.pending;
  return (
    <div
      className={`glass card-hover relative overflow-hidden rounded-2xl p-5 pl-6 before:absolute before:inset-y-0 before:left-0 before:w-1.5 ${accent}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.cls}`}
            >
              {badge.label}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-xs text-cream/50">
              #{o.id.slice(0, 8)}
            </span>
            <span className="text-xs text-cream/40">
              {new Date(o.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="font-display mt-1.5 text-lg text-cream">
            {o.customer_name || "Cliente"}
          </p>
          <p className="text-sm text-cream/60">
            {o.customer_phone} · {o.customer_email}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="font-display text-xl font-semibold gold-text">
            {BRL(o.total_cents ?? 0)}
          </span>
          <OrderStatus id={o.id} status={o.status} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/45">Itens</p>
          <ul className="mt-1 text-sm text-cream/80">
            {(o.order_items ?? []).map((it) => (
              <li key={it.id}>
                {it.qty}× {it.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-cream/45">
            Entrega{" "}
            {o.delivery_eta &&
              `· até ${new Date(o.delivery_eta).toLocaleDateString("pt-BR")}`}
          </p>
          <p className="mt-1 text-sm text-cream/80">
            {addr.street}, {addr.number}
            {addr.complement ? ` — ${addr.complement}` : ""}
            <br />
            {addr.district}, {addr.city} · CEP {addr.cep}
            {addr.reference && (
              <>
                <br />
                <span className="text-cream/55">Ref: {addr.reference}</span>
              </>
            )}
            <br />
            <span className="text-cream/55">
              Frete:{" "}
              {o.shipping_cents
                ? `${BRL(o.shipping_cents)} (${o.shipping_method ?? "-"})`
                : "Grátis"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-white/10 pt-3">
        {o.status !== "canceled" && (
          <ConfirmButton
            label="Cancelar pedido"
            className="rounded-full px-4 py-2 text-sm text-cream/70 transition-colors hover:bg-white/5 hover:text-cream"
            title="Cancelar este pedido?"
            message={
              <>
                O pedido de <strong>{o.customer_name || "cliente"}</strong> sai
                da lista de ativos, mas continua no histórico. Dá pra reverter
                mudando o status depois.
              </>
            }
            confirmLabel="Cancelar pedido"
            action={cancelOrder.bind(null, o.id)}
          />
        )}
        <ConfirmButton
          label="Excluir"
          className="rounded-full border border-wine-bright/30 px-4 py-2 text-sm text-wine-bright transition-colors hover:bg-wine-bright/10"
          title="Excluir este pedido?"
          message={
            <>
              Isso apaga o pedido de{" "}
              <strong>{o.customer_name || "cliente"}</strong> em definitivo, com
              todos os itens. <strong>Não dá pra desfazer.</strong>
            </>
          }
          confirmLabel="Excluir de vez"
          danger
          action={deleteOrder.bind(null, o.id)}
        />
      </div>
    </div>
  );
}
