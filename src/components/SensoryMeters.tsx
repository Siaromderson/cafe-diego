import { SENSORY_ATTRS, type Product } from "@/lib/types";

/** Uma linha de bolinhas (0 a 5) para um atributo sensorial. */
export function Meter({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(5, value || 0));
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="uppercase tracking-widest text-cream/55">{label}</span>
      <span className="flex gap-1" aria-label={`${label}: ${v} de 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${
              i < v ? "bg-gold" : "bg-white/12"
            }`}
          />
        ))}
      </span>
    </div>
  );
}

/** As 6 classificações da embalagem: Corpo, Doçura, Amargor, Acidez, Aroma, Retrogosto. */
export function SensoryMeters({ product }: { product: Product }) {
  return (
    <div className="space-y-2">
      {SENSORY_ATTRS.map(({ key, label }) => (
        <Meter key={key} label={label} value={product[key] as number} />
      ))}
    </div>
  );
}
