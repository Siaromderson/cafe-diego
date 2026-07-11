import { COFFEE_TIERS, type CoffeeTier } from "@/lib/types";

// Bandas da pirâmide (topo -> base), no viewBox 0 0 100 80.
const BANDS: Record<CoffeeTier, string> = {
  especial: "50,4 60.5,21.5 39.5,21.5",
  gourmet: "39.5,21.5 60.5,21.5 71,39 29,39",
  superior: "29,39 71,39 81.5,56.5 18.5,56.5",
  tradicional: "18.5,56.5 81.5,56.5 92,74 8,74",
};

export function CoffeePyramid({ tier }: { tier: CoffeeTier }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-gold/80">
        Pirâmide do Café
      </p>
      <div className="mt-3 flex items-center gap-4">
        <svg
          viewBox="0 0 100 80"
          className="h-24 w-28 shrink-0"
          role="img"
          aria-label={`Nível ${tier} na pirâmide do café`}
        >
          <defs>
            <linearGradient id="pyr-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3dca5" />
              <stop offset="1" stopColor="#c9a96a" />
            </linearGradient>
          </defs>
          {COFFEE_TIERS.map(({ key }) => {
            const on = key === tier;
            return (
              <polygon
                key={key}
                points={BANDS[key]}
                fill={on ? "url(#pyr-gold)" : "rgba(245,236,217,0.05)"}
                stroke={on ? "#f3dca5" : "rgba(231,201,135,0.28)"}
                strokeWidth={on ? 1 : 0.7}
                strokeLinejoin="round"
              />
            );
          })}
        </svg>

        <ul className="flex-1 space-y-1.5">
          {COFFEE_TIERS.map(({ key, label }) => {
            const on = key === tier;
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    on ? "bg-gold" : "bg-white/15"
                  }`}
                />
                <span
                  className={
                    on
                      ? "font-semibold text-cream"
                      : "text-cream/45"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
