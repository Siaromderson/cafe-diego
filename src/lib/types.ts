export type ProductType = "grao" | "moido";

/** Nível na "Pirâmide do Café" (topo = melhor). */
export type CoffeeTier = "especial" | "gourmet" | "superior" | "tradicional";

export interface Product {
  id: string;
  slug: string;
  name: string;
  line: string; // ex: "100% Arábica"
  type: ProductType;
  weight_g: number;
  price_cents: number;
  description: string;
  // ---- Classificação sensorial (0 a 5, exibida em bolinhas) ----
  body: number; // Corpo
  sweetness: number; // Doçura
  bitterness: number; // Amargor
  acidity: number; // Acidez
  aroma: number; // Aroma
  aftertaste: number; // Retrogosto
  intensity?: number; // legado — não é mais exibido
  tier: CoffeeTier; // nível na Pirâmide do Café
  // Quando false, é um item que não é café (ex.: caneca, filtro, brinde):
  // esconde o tipo grão/moído, a classificação sensorial e a Pirâmide do Café.
  // Ausente/undefined = café (comportamento padrão dos produtos já cadastrados).
  is_coffee?: boolean;
  image_url: string;
  images?: string[]; // galeria — fotos extras do produto
  accent: "wine" | "gold";
  stock?: number;
  sort?: number;
  active: boolean;
}

/** Um item é tratado como café a menos que marcado explicitamente como não-café. */
export const isCoffee = (p: Product): boolean => p.is_coffee !== false;

export interface CartLine {
  product: Product;
  qty: number;
}

/** Atributos sensoriais na ordem em que aparecem na embalagem. */
export const SENSORY_ATTRS = [
  { key: "body", label: "Corpo" },
  { key: "sweetness", label: "Doçura" },
  { key: "bitterness", label: "Amargor" },
  { key: "acidity", label: "Acidez" },
  { key: "aroma", label: "Aroma" },
  { key: "aftertaste", label: "Retrogosto" },
] as const satisfies ReadonlyArray<{
  key: keyof Product;
  label: string;
}>;

/** Níveis da Pirâmide do Café, do topo (melhor) para a base. */
export const COFFEE_TIERS = [
  { key: "especial", label: "Especial" },
  { key: "gourmet", label: "Gourmet" },
  { key: "superior", label: "Superior" },
  { key: "tradicional", label: "Tradicional / Extra forte" },
] as const satisfies ReadonlyArray<{ key: CoffeeTier; label: string }>;

export const tierLabel = (tier: CoffeeTier): string =>
  COFFEE_TIERS.find((t) => t.key === tier)?.label ?? "Especial";

/** Lista de fotos do produto (galeria), com fallback para a imagem principal. */
export const productImages = (p: Product): string[] => {
  const extras = (p.images ?? []).filter(Boolean);
  const all = [p.image_url, ...extras].filter(Boolean);
  // remove duplicadas mantendo a ordem
  return Array.from(new Set(all));
};

export const BRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
