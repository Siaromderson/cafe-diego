"use client";

import { useTransition } from "react";
import { setOrderStatus } from "@/app/admin/actions";

const OPTIONS = [
  { value: "pending", label: "Aguardando" },
  { value: "paid", label: "Pago" },
  { value: "delivered", label: "Entregue" },
];

export function OrderStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => setOrderStatus(id, e.target.value))}
      className="rounded-lg border border-white/15 bg-coffee-2 px-3 py-1.5 text-sm text-cream outline-none focus:border-gold/60"
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
