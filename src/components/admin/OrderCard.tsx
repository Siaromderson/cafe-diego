import { BRL } from "@/lib/types";
import { OrderStatus } from "./OrderStatus";

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
  return (
    <div className="glass card-hover rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-xs text-cream/50">
              #{o.id.slice(0, 8)}
            </span>
            <span className="text-xs text-cream/40">
              {new Date(o.created_at).toLocaleString("pt-BR")}
            </span>
          </div>
          <p className="font-display mt-1 text-lg text-cream">
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
    </div>
  );
}
