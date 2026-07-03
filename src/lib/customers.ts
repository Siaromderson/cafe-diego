import { getSupabaseServer } from "./supabase/server";
import { T } from "./tables";
import { normalizePhone } from "./phone";

export interface CustomerOrder {
  id: string;
  date: string;
  total_cents: number;
  status: string;
  items: string;
  address: string;
}

export interface CustomerView {
  id: string;
  email: string;
  name: string;
  phone: string;
  orderCount: number;
  paidCount: number;
  totalCents: number;
  firstOrder: string | null;
  lastOrder: string | null;
  avgIntervalDays: number | null;
  nextPurchase: string | null;
  daysUntilNext: number | null; // negativo = atrasado
  addresses: string[];
  history: CustomerOrder[];
}

interface RawOrder {
  id: string;
  created_at: string;
  paid_at?: string | null;
  status: string;
  total_cents?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  address_json?: {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    cep?: string;
  };
  order_items?: { qty: number; name: string }[];
}

function fmtAddress(a?: RawOrder["address_json"]): string {
  if (!a) return "";
  const parts = [
    [a.street, a.number].filter(Boolean).join(", "),
    a.district,
    a.city,
    a.cep ? `CEP ${a.cep}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

const DAY = 86_400_000;

/** Monta a visão de clientes a partir dos cadastros + histórico de pedidos. */
export async function getCustomers(): Promise<CustomerView[]> {
  const sb = await getSupabaseServer();
  const [{ data: customers }, { data: orders }] = await Promise.all([
    sb.from(T.customers).select("*"),
    sb
      .from(T.orders)
      .select("*, order_items:cafe_diego_order_items(qty,name)")
      .order("created_at", { ascending: true })
      .limit(2000),
  ]);

  const map = new Map<string, CustomerView>();

  // Chave do cliente: telefone (normalizado) tem prioridade; senão, e-mail.
  // Assim quem compra sem se cadastrar (só nome + WhatsApp) já vira cliente.
  const keyOf = (phone?: string, email?: string): string | null => {
    const p = normalizePhone(phone);
    if (p) return `tel:${p}`;
    const e = String(email || "").toLowerCase();
    if (e) return `mail:${e}`;
    return null;
  };

  // semeia com os cadastros (mesmo sem pedidos)
  for (const c of customers ?? []) {
    const key = keyOf(c.phone, c.email);
    if (!key) continue;
    map.set(key, {
      id: key,
      email: c.email || "",
      name: c.name || "",
      phone: c.phone || "",
      orderCount: 0,
      paidCount: 0,
      totalCents: 0,
      firstOrder: null,
      lastOrder: null,
      avgIntervalDays: null,
      nextPurchase: null,
      daysUntilNext: null,
      addresses: [],
      history: [],
    });
  }

  for (const o of (orders ?? []) as RawOrder[]) {
    const key = keyOf(o.customer_phone, o.customer_email);
    if (!key) continue;
    let v = map.get(key);
    if (!v) {
      v = {
        id: key,
        email: o.customer_email || "",
        name: o.customer_name || "",
        phone: o.customer_phone || "",
        orderCount: 0,
        paidCount: 0,
        totalCents: 0,
        firstOrder: null,
        lastOrder: null,
        avgIntervalDays: null,
        nextPurchase: null,
        daysUntilNext: null,
        addresses: [],
        history: [],
      };
      map.set(key, v);
    }
    if (!v.name && o.customer_name) v.name = o.customer_name;
    if (!v.phone && o.customer_phone) v.phone = o.customer_phone;
    if (!v.email && o.customer_email) v.email = o.customer_email;

    v.orderCount++;
    const isPaid = o.status === "paid" || o.status === "delivered";
    if (isPaid) {
      v.paidCount++;
      v.totalCents += o.total_cents ?? 0;
    }
    const addr = fmtAddress(o.address_json);
    if (addr && !v.addresses.includes(addr)) v.addresses.push(addr);

    v.history.push({
      id: o.id,
      date: o.created_at,
      total_cents: o.total_cents ?? 0,
      status: o.status,
      items: (o.order_items ?? []).map((it) => `${it.qty}x ${it.name}`).join(", "),
      address: addr,
    });
  }

  const now = Date.now();
  const result = [...map.values()].map((v) => {
    // datas de compras efetivas (pagas/entregues) para a previsão
    const paidDates = v.history
      .filter((h) => h.status === "paid" || h.status === "delivered")
      .map((h) => new Date(h.date).getTime())
      .sort((a, b) => a - b);

    if (paidDates.length) {
      v.firstOrder = new Date(paidDates[0]).toISOString();
      v.lastOrder = new Date(paidDates[paidDates.length - 1]).toISOString();
    }

    // Inteligência: frequência média entre compras → próxima compra
    if (paidDates.length >= 2) {
      const span = paidDates[paidDates.length - 1] - paidDates[0];
      const avg = span / (paidDates.length - 1);
      v.avgIntervalDays = Math.round(avg / DAY);
      const next = paidDates[paidDates.length - 1] + avg;
      v.nextPurchase = new Date(next).toISOString();
      v.daysUntilNext = Math.round((next - now) / DAY);
    }

    // histórico mais recente primeiro
    v.history.reverse();
    return v;
  });

  // ordena por total gasto desc, depois por nome
  return result.sort(
    (a, b) => b.totalCents - a.totalCents || a.name.localeCompare(b.name)
  );
}
