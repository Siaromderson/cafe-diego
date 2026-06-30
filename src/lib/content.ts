import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";

/**
 * Textos editáveis do site (hero, história, rodapé, contatos).
 * Ficam na tabela `cafe_diego_settings` com a chave `content_*` e são
 * editados em /admin/conteudo. Os valores abaixo são os padrões usados
 * enquanto nada foi salvo (ou sem Supabase).
 */
export interface SiteContent {
  heroBadge: string;
  heroTitleTop: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  historiaKicker: string;
  historiaTitle: string;
  historiaP1: string;
  historiaP2: string;
  footerTagline: string;
  contactInstagram: string;
  contactAddress: string;
  footerCredit: string;
  whatsapp: string; // só números, com DDD/país
  // Tipografia (presets) do título e subtítulo do topo
  heroTitleSize: string; // "md" | "lg" | "xl"
  heroTitleWeight: string; // "normal" | "semibold" | "bold"
  heroSubtitleSize: string; // "sm" | "md" | "lg"
}

export const CONTENT_DEFAULTS: SiteContent = {
  heroBadge: "100% Arábica · Torra Especial",
  heroTitleTop: "O verdadeiro",
  heroTitleHighlight: "café de feirante",
  heroSubtitle:
    "Selecionado grão a grão e torrado com cuidado artesanal. Em grãos para moer na hora ou tradicional moído. Direto do feirante para a sua xícara, em Campo Grande — MS.",
  heroCtaPrimary: "Peça já o seu",
  heroCtaSecondary: "Entrega grátis em CG",
  historiaKicker: "A história",
  historiaTitle: "Do grão escolhido à sua xícara",
  historiaP1:
    "O Café do Feirante nasceu na lida das feiras de Campo Grande, levando café de verdade para quem entende. Trabalhamos só com 100% Arábica, em torra média que respeita o grão — encorpado, aromático e com aquela doçura natural.",
  historiaP2: "Quem prova, leva. E quem leva, volta.",
  footerTagline:
    "O verdadeiro café de feirante. 100% Arábica, torrado com cuidado artesanal em Campo Grande — MS.",
  contactInstagram: "@cafedofeirantems",
  contactAddress: "Rua Dr. Arthur Jorge 1602 · São Francisco",
  footerCredit: "Diego Ricardo Rodrigues · Campo Grande - MS",
  whatsapp: "5567992220619",
  heroTitleSize: "lg",
  heroTitleWeight: "semibold",
  heroSubtitleSize: "md",
};

/** Presets de tipografia do topo → classes Tailwind (fixas, p/ o Tailwind detectar). */
export const HERO_TITLE_SIZE: Record<string, string> = {
  md: "text-4xl sm:text-6xl",
  lg: "text-5xl sm:text-7xl",
  xl: "text-6xl sm:text-8xl",
};
export const HERO_TITLE_WEIGHT: Record<string, string> = {
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
};
export const HERO_SUBTITLE_SIZE: Record<string, string> = {
  sm: "text-sm sm:text-base",
  md: "text-base sm:text-lg",
  lg: "text-lg sm:text-xl",
};

/** Mapeia chave de settings -> campo do SiteContent. */
const KEYS: Record<string, keyof SiteContent> = {
  content_hero_badge: "heroBadge",
  content_hero_title_top: "heroTitleTop",
  content_hero_title_highlight: "heroTitleHighlight",
  content_hero_subtitle: "heroSubtitle",
  content_hero_cta_primary: "heroCtaPrimary",
  content_hero_cta_secondary: "heroCtaSecondary",
  content_historia_kicker: "historiaKicker",
  content_historia_title: "historiaTitle",
  content_historia_p1: "historiaP1",
  content_historia_p2: "historiaP2",
  content_footer_tagline: "footerTagline",
  content_contact_instagram: "contactInstagram",
  content_contact_address: "contactAddress",
  content_footer_credit: "footerCredit",
  whatsapp: "whatsapp",
  content_hero_title_size: "heroTitleSize",
  content_hero_title_weight: "heroTitleWeight",
  content_hero_subtitle_size: "heroSubtitleSize",
};

/** Lê o conteúdo do site (settings) com fallback nos padrões. */
export async function getContent(): Promise<SiteContent> {
  const content = { ...CONTENT_DEFAULTS };
  if (!hasSupabase) return content;

  const sb = getSupabaseAdmin();
  const { data } = await sb.from(T.settings).select("key, value");
  for (const row of data ?? []) {
    const field = KEYS[row.key];
    if (field && typeof row.value === "string" && row.value.trim() !== "") {
      content[field] = row.value;
    }
  }
  return content;
}

/** wa.me a partir do número (só dígitos). */
export function whatsappLink(num: string): string {
  return `https://wa.me/${num.replace(/\D/g, "")}`;
}

/** "5567992220619" -> "67 99222-0619" (para exibição). */
export function whatsappDisplay(num: string): string {
  const d = num.replace(/\D/g, "").replace(/^55/, "");
  const m = d.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `${m[1]} ${m[2]}-${m[3]}` : num;
}

/** URL do Instagram a partir do @handle. */
export function instagramLink(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "").trim()}`;
}
