import type { ReactNode } from "react";

type Method = {
  key: string;
  name: string;
  sub?: string;
  grind: string;
  coarse: 1 | 2 | 3 | 4 | 5; // 1 = mais grossa ... 5 = mais fina
  icon: ReactNode;
};

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Ícones minimalistas (24x24) para cada método de preparo.
const IconPrensa = (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M8 8h8v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V8Z" {...S} />
    <path d="M7 8h10M12 8V4m0 0h-2m2 0h2M8 12h8" {...S} />
  </svg>
);
const IconCoadorPapel = (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M5 5h14l-5 8v5h-4v-5L5 5Z" {...S} />
    <path d="M8 5h8" {...S} />
  </svg>
);
const IconCoador = (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M6 6h12l-2 5H8L6 6Z" {...S} />
    <path d="M9 11v3a3 3 0 0 0 6 0v-3" {...S} />
    <path d="M8 20h8" {...S} />
  </svg>
);
const IconMoka = (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <path d="M9 4h6l-1 5h-4L9 4Z" {...S} />
    <path d="M7 9h10l-1 9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1L7 9Z" {...S} />
    <path d="M17 11h2.5a1 1 0 0 1 1 1v2" {...S} />
  </svg>
);
const IconEspresso = (
  <svg viewBox="0 0 24 24" className="h-6 w-6">
    <circle cx="10" cy="9" r="5" {...S} />
    <path d="M14 12l7 4M10 14v4m-3 0h6" {...S} />
  </svg>
);

const METHODS: Method[] = [
  { key: "prensa", name: "Prensa Francesa", grind: "Grossa", coarse: 1, icon: IconPrensa },
  { key: "papel", name: "Coador de papel", sub: "V60 / Chemex", grind: "Média", coarse: 2, icon: IconCoadorPapel },
  { key: "coador", name: "Coador / Melitta", grind: "Média-fina", coarse: 3, icon: IconCoador },
  { key: "moka", name: "Moka / Italiana", grind: "Fina", coarse: 4, icon: IconMoka },
  { key: "espresso", name: "Espresso", grind: "Extrafina", coarse: 5, icon: IconEspresso },
];

// Grade de "grãos moídos": quanto mais fina a moagem, menores e mais densos os pontos.
const GRID = {
  1: { cell: 13, r: 3.4 },
  2: { cell: 10, r: 2.6 },
  3: { cell: 8, r: 2.0 },
  4: { cell: 6, r: 1.5 },
  5: { cell: 4.2, r: 1.05 },
} as const;

function GrindSwatch({ coarse }: { coarse: Method["coarse"] }) {
  const W = 64;
  const H = 40;
  const pad = 7;
  const { cell, r } = GRID[coarse];
  const cols = Math.max(1, Math.floor((W - 2 * pad) / cell));
  const rows = Math.max(1, Math.floor((H - 2 * pad) / cell));
  const offX = (W - cols * cell) / 2 + cell / 2;
  const offY = (H - rows * cell) / 2 + cell / 2;
  const dots: { cx: number; cy: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      dots.push({ cx: offX + x * cell, cy: offY + y * cell });
    }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-9 w-full" aria-hidden="true">
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={r} fill="rgba(231,201,135,0.75)" />
      ))}
    </svg>
  );
}

export function GrindGuide() {
  return (
    <section id="moagem" className="mx-auto max-w-6xl px-6 py-20">
      <header className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-gold/80">
          Do grão à xícara
        </p>
        <h2 className="font-display mt-2 text-4xl font-semibold sm:text-5xl">
          Moagem <span className="gold-text">ideal</span> por método
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cream/60">
          A granulometria certa faz toda a diferença na extração. Da moagem mais
          grossa à mais fina, segundo o seu preparo.
        </p>
        <div className="gold-hairline mx-auto mt-5 w-40" />
      </header>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {METHODS.map((m) => (
          <div
            key={m.key}
            className="glass card-hover flex flex-col items-center rounded-2xl p-5 text-center"
          >
            <span className="text-gold">{m.icon}</span>
            <h3 className="font-display mt-3 text-lg text-cream">{m.name}</h3>
            {m.sub && (
              <p className="text-xs uppercase tracking-widest text-cream/45">
                {m.sub}
              </p>
            )}
            <div className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <GrindSwatch coarse={m.coarse} />
            </div>
            <span className="mt-3 rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
              {m.grind}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
