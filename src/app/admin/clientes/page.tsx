import { BRL } from "@/lib/types";
import { getCustomers } from "@/lib/customers";
import { HelpButton } from "@/components/admin/HelpButton";
import { CustomerCard } from "@/components/admin/CustomerCard";

export const dynamic = "force-dynamic";

export default async function AdminCustomers() {
  const customers = await getCustomers();

  const totalSpent = customers.reduce((n, c) => n + c.totalCents, 0);
  const recurring = customers.filter((c) => c.paidCount >= 2).length;
  const dueSoon = customers.filter(
    (c) => c.daysUntilNext != null && c.daysUntilNext <= 7
  ).length;

  const cards = [
    { label: "Clientes", value: String(customers.length), icon: "👥" },
    { label: "Recorrentes", value: String(recurring), icon: "🔁" },
    { label: "Compra prevista (7d)", value: String(dueSoon), icon: "🔮" },
    { label: "Receita total", value: BRL(totalSpent), icon: "💰" },
  ];

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        <h1 className="font-display text-3xl font-semibold text-cream">
          Clientes
        </h1>
        <HelpButton title="Como funciona a aba de clientes">
          <p>
            Lista <strong>todo mundo que comprou ou se cadastrou</strong>. Clique
            em um cliente para ver os endereços e o histórico completo de pedidos.
          </p>
          <p>
            <strong>🔮 Previsão de próxima compra:</strong> o sistema calcula a
            frequência média entre as compras pagas do cliente e estima quando
            ele deve comprar de novo. Quanto mais ele compra, mais precisa fica a
            previsão (precisa de pelo menos 2 compras).
          </p>
          <p>
            A etiqueta fica <span className="text-gold">dourada</span> quando a
            compra está chegando e <span className="text-cream">vermelha</span>{" "}
            quando já passou da data prevista — boa hora pra chamar no WhatsApp!
          </p>
        </HelpButton>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="glass card-hover rounded-2xl p-5">
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

      <div className="mt-6 space-y-4">
        {customers.length === 0 ? (
          <p className="glass rounded-2xl p-8 text-center text-cream/60">
            Nenhum cliente ainda. Assim que alguém comprar, aparece aqui com todo
            o histórico.
          </p>
        ) : (
          customers.map((c) => <CustomerCard key={c.email} c={c} />)
        )}
      </div>
    </div>
  );
}
