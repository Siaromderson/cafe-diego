export type ProductType = "grao" | "moido";

export interface Product {
  id: string;
  slug: string;
  name: string;
  line: string; // ex: "100% Arábica"
  type: ProductType;
  weight_g: number;
  price_cents: number;
  description: string;
  intensity: number; // 1-5
  acidity: number; // 1-5
  body: number; // 1-5
  image_url: string;
  images?: string[]; // galeria — fotos extras do produto
  accent: "wine" | "gold";
  stock?: number;
  sort?: number;
  active: boolean;
}

export interface CartLine {
  product: Product;
  qty: number;
}

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
