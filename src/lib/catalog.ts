import type { Product } from "./types";

/**
 * Catálogo inicial. Os preços abaixo são provisórios — o Diego ajusta tudo
 * pelo painel admin (que grava no Supabase). Enquanto o banco não está ligado,
 * a loja usa este fallback estático.
 */
export const CATALOG: Product[] = [
  {
    id: "vermelho-1kg",
    slug: "100-arabica-graos-1kg",
    name: "100% Arábica · Em Grãos",
    line: "Oeste Paulista",
    type: "grao",
    weight_g: 1000,
    price_cents: 5990,
    description:
      "Café espresso torrado em grãos, torra média. Encorpado, doçura de caramelo e final prolongado — ideal para quem moe na hora.",
    body: 4,
    sweetness: 4,
    bitterness: 1,
    acidity: 1,
    aroma: 4,
    aftertaste: 4,
    tier: "especial",
    image_url: "/produtos/vermelho.jpg",
    images: ["/produtos/vermelho-real.jpg", "/produtos/dourado-real.jpg"],
    accent: "wine",
    active: true,
  },
  {
    id: "dourado-500g",
    slug: "100-arabica-tradicional-moido-500g",
    name: "100% Arábica · Tradicional",
    line: "Torrado e Moído",
    type: "moido",
    weight_g: 500,
    price_cents: 3490,
    description:
      "Café torrado e moído na medida certa para o dia a dia. Aroma intenso, corpo aveludado e aquele sabor de café de feirante de verdade.",
    body: 4,
    sweetness: 3,
    bitterness: 2,
    acidity: 1,
    aroma: 4,
    aftertaste: 3,
    tier: "superior",
    image_url: "/produtos/dourado.jpg",
    images: ["/produtos/dourado-real.jpg", "/produtos/vermelho-real.jpg"],
    accent: "gold",
    active: true,
  },
];
