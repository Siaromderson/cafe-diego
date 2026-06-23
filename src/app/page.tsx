import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { getProducts } from "@/lib/products-repo";

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="relative">
      <Navbar />
      <CartDrawer />
      <Hero />

      {/* Produtos */}
      <section id="produtos" className="mx-auto max-w-6xl px-6 py-20">
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
            Nossa seleção
          </p>
          <h2 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">
            Escolha o seu <span className="gold-text">café</span>
          </h2>
          <div className="gold-hairline mx-auto mt-5 w-40" />
        </header>
        <div className="grid gap-7 sm:grid-cols-2">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* História */}
      <section id="historia" className="mx-auto max-w-5xl px-6 py-20">
        <div className="glass rounded-3xl p-8 sm:p-14">
          <div className="grid items-center gap-10 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
                A história
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
                Do grão escolhido à sua xícara
              </h2>
              <p className="mt-4 text-cream/70">
                O Café do Feirante nasceu na lida das feiras de Campo Grande,
                levando café de verdade para quem entende. Trabalhamos só com
                100% Arábica, em torra média que respeita o grão — encorpado,
                aromático e com aquela doçura natural.
              </p>
              <p className="mt-3 text-cream/70">
                Quem prova, leva. E quem leva, volta.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { k: "Seleção", v: "grão a grão" },
                { k: "Torra", v: "média artesanal" },
                { k: "Moagem", v: "na hora certa" },
                { k: "Origem", v: "Oeste Paulista" },
              ].map((c) => (
                <div
                  key={c.k}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="font-display text-xl gold-text">{c.k}</div>
                  <div className="mt-1 text-sm text-cream/60">{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Entrega */}
      <section id="entrega" className="mx-auto max-w-6xl px-6 py-20">
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
            Como funciona
          </p>
          <h2 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">
            Peça e <span className="gold-text">receba em casa</span>
          </h2>
        </header>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Escolha seu café",
              d: "Em grãos ou moído. Adicione ao carrinho e finalize em segundos.",
            },
            {
              n: "02",
              t: "Pague com segurança",
              d: "Pix, débito ou crédito no checkout. Você cadastra o endereço na hora.",
            },
            {
              n: "03",
              t: "Receba em até 2 dias",
              d: "Entrega grátis em Campo Grande. A gente leva até a sua porta.",
            },
          ].map((s) => (
            <div key={s.n} className="glass rounded-3xl p-7">
              <div className="font-display text-5xl font-semibold text-gold/30">
                {s.n}
              </div>
              <h3 className="font-display mt-3 text-2xl text-cream">{s.t}</h3>
              <p className="mt-2 text-sm text-cream/65">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
