export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24 sm:pt-48">
      {/* vapor / glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-wine/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Café do Feirante MS"
          className="animate-float-up mx-auto mb-4 h-44 w-auto drop-shadow-[0_10px_40px_rgba(160,30,30,0.35)] sm:h-60"
        />
        <p className="animate-float-up mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-gold backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          100% Arábica · Torra Especial
        </p>

        <h1
          className="animate-float-up font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          O verdadeiro
          <br />
          <span className="gold-text">café de feirante</span>
        </h1>

        <p
          className="animate-float-up mx-auto mt-6 max-w-xl text-base text-cream/70 sm:text-lg"
          style={{ animationDelay: "160ms" }}
        >
          Selecionado grão a grão e torrado com cuidado artesanal. Em grãos para
          moer na hora ou tradicional moído. Direto do feirante para a sua xícara,
          em Campo Grande — MS.
        </p>

        <div
          className="animate-float-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="#produtos"
            className="btn-gold rounded-full px-8 py-3.5 text-sm uppercase tracking-wide"
          >
            Peça já o seu
          </a>
          <a
            href="#entrega"
            className="btn-ghost rounded-full px-8 py-3.5 text-sm uppercase tracking-wide"
          >
            Entrega grátis em CG
          </a>
        </div>

        <div
          className="animate-float-up mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4"
          style={{ animationDelay: "320ms" }}
        >
          {[
            { k: "100%", v: "Arábica" },
            { k: "Grão ou", v: "Moído" },
            { k: "2 dias", v: "Entrega CG" },
          ].map((s) => (
            <div key={s.v} className="glass rounded-2xl px-3 py-5">
              <div className="font-display text-2xl font-semibold gold-text">
                {s.k}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-cream/60">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
