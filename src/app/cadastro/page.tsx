import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CadastroForm } from "@/components/CadastroForm";

export const metadata: Metadata = {
  title: "Cadastre-se · Café do Feirante MS",
  description:
    "Faça seu cadastro e receba as novidades e ofertas do Café do Feirante MS, direto em Campo Grande.",
};

export default function CadastroPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <div className="text-center">
        <Link href="/" className="inline-block">
          <BrandMark />
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.4em] text-gold/80">
          Faça parte
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
          Entre para a <span className="gold-text">lista do café</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-cream/70">
          Cadastre-se para receber novidades, ofertas e o melhor café de feirante
          de Campo Grande — direto no seu WhatsApp.
        </p>
      </div>

      <div className="mt-9">
        <CadastroForm />
      </div>

      <p className="mt-6 text-center text-sm text-cream/50">
        <Link href="/#produtos" className="hover:text-gold">
          ← Voltar para a loja
        </Link>
      </p>
    </main>
  );
}
