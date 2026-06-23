import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function CanceledPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
      <BrandMark />
      <div className="glass mt-10 w-full rounded-3xl p-10">
        <h1 className="font-display text-3xl font-semibold text-cream">
          Pagamento não concluído
        </h1>
        <p className="mt-3 text-cream/70">
          Tudo bem! Seu carrinho continua salvo. Você pode tentar novamente
          quando quiser.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/checkout"
            className="btn-gold rounded-full px-8 py-3 text-sm uppercase tracking-wide"
          >
            Tentar de novo
          </Link>
          <a
            href="https://wa.me/5567992220619"
            className="btn-ghost rounded-full px-8 py-3 text-sm uppercase tracking-wide"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
