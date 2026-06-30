import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; sim?: string }>;
}) {
  const { order, sim } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <BrandMark />
      <div className="glass mt-10 w-full rounded-3xl p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e7c987] to-[#b07c2a]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-coffee-2" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="font-display mt-6 text-3xl font-semibold text-cream">
          Pedido confirmado!
        </h1>
        <p className="mt-3 text-cream/70">
          Recebemos seu pedido{order ? ` #${order.slice(0, 8)}` : ""}. Vamos
          preparar tudo e entregar em Campo Grande em até 24h. Você recebe
          novidades pelo WhatsApp.
        </p>
        {sim && (
          <p className="mt-4 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2 text-xs text-gold">
            Modo demonstração — pagamento simulado (chaves do Mercado Pago
            ainda não configuradas).
          </p>
        )}
        <Link
          href="/"
          className="btn-gold mt-7 inline-block rounded-full px-8 py-3 text-sm uppercase tracking-wide"
        >
          Voltar à loja
        </Link>
      </div>
    </main>
  );
}
