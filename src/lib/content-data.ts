/**
 * Dados "puros" do conteúdo do site — SEM imports de servidor.
 * Pode ser usado tanto no servidor quanto no cliente (preview do admin).
 * A leitura no banco fica em `content.ts` (servidor).
 */

export interface SiteContent {
  heroBadge: string;
  heroTitleTop: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  // Três caixas de números do topo
  heroStat1Top: string;
  heroStat1Bottom: string;
  heroStat2Top: string;
  heroStat2Bottom: string;
  heroStat3Top: string;
  heroStat3Bottom: string;
  historiaKicker: string;
  historiaTitle: string;
  historiaP1: string;
  historiaP2: string;
  // Seção "Entrega"
  entregaKicker: string;
  entregaTitleTop: string;
  entregaTitleHighlight: string;
  entregaStep1Title: string;
  entregaStep1Desc: string;
  entregaStep2Title: string;
  entregaStep2Desc: string;
  entregaStep3Title: string;
  entregaStep3Desc: string;
  footerTagline: string;
  footerDelivery: string; // frase de entrega no rodapé
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
  heroCtaSecondary: "Como funciona a entrega",
  heroStat1Top: "100%",
  heroStat1Bottom: "Arábica",
  heroStat2Top: "Grão ou Moído",
  heroStat2Bottom: "como preferir",
  heroStat3Top: "24h",
  heroStat3Bottom: "Entrega CG",
  historiaKicker: "A história",
  historiaTitle: "Do grão escolhido à sua xícara",
  historiaP1:
    "O Café do Feirante nasceu na lida das feiras de Campo Grande, levando café de verdade para quem entende. Trabalhamos só com 100% Arábica, em torra média que respeita o grão — encorpado, aromático e com aquela doçura natural.",
  historiaP2: "Quem prova, leva. E quem leva, volta.",
  entregaKicker: "Como funciona",
  entregaTitleTop: "Peça e",
  entregaTitleHighlight: "receba em casa",
  entregaStep1Title: "Escolha seu café",
  entregaStep1Desc:
    "Em grãos ou moído. Adicione ao carrinho e finalize em segundos.",
  entregaStep2Title: "Pague com segurança",
  entregaStep2Desc:
    "Pix, débito ou crédito no checkout. Você cadastra o endereço na hora.",
  entregaStep3Title: "Receba em até 24h",
  entregaStep3Desc:
    "Entrega em Campo Grande por R$ 15 — ou retire no local sem custo. A gente leva até a sua porta.",
  footerTagline:
    "O verdadeiro café de feirante. 100% Arábica, torrado com cuidado artesanal em Campo Grande — MS.",
  footerDelivery:
    "Entrega em Campo Grande por R$ 15 (em até 24h) ou retire no local sem custo. Pague no Pix, débito ou crédito.",
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
export const KEYS: Record<string, keyof SiteContent> = {
  content_hero_badge: "heroBadge",
  content_hero_title_top: "heroTitleTop",
  content_hero_title_highlight: "heroTitleHighlight",
  content_hero_subtitle: "heroSubtitle",
  content_hero_cta_primary: "heroCtaPrimary",
  content_hero_cta_secondary: "heroCtaSecondary",
  content_hero_stat1_top: "heroStat1Top",
  content_hero_stat1_bottom: "heroStat1Bottom",
  content_hero_stat2_top: "heroStat2Top",
  content_hero_stat2_bottom: "heroStat2Bottom",
  content_hero_stat3_top: "heroStat3Top",
  content_hero_stat3_bottom: "heroStat3Bottom",
  content_historia_kicker: "historiaKicker",
  content_historia_title: "historiaTitle",
  content_historia_p1: "historiaP1",
  content_historia_p2: "historiaP2",
  content_entrega_kicker: "entregaKicker",
  content_entrega_title_top: "entregaTitleTop",
  content_entrega_title_highlight: "entregaTitleHighlight",
  content_entrega_step1_title: "entregaStep1Title",
  content_entrega_step1_desc: "entregaStep1Desc",
  content_entrega_step2_title: "entregaStep2Title",
  content_entrega_step2_desc: "entregaStep2Desc",
  content_entrega_step3_title: "entregaStep3Title",
  content_entrega_step3_desc: "entregaStep3Desc",
  content_footer_tagline: "footerTagline",
  content_footer_delivery: "footerDelivery",
  content_contact_instagram: "contactInstagram",
  content_contact_address: "contactAddress",
  content_footer_credit: "footerCredit",
  whatsapp: "whatsapp",
  content_hero_title_size: "heroTitleSize",
  content_hero_title_weight: "heroTitleWeight",
  content_hero_subtitle_size: "heroSubtitleSize",
};

/** Monta um SiteContent a partir de um mapa de settings (chave -> valor). */
export function contentFromValues(
  values: Record<string, string>
): SiteContent {
  const content = { ...CONTENT_DEFAULTS };
  for (const [key, field] of Object.entries(KEYS)) {
    const v = values[key];
    if (typeof v === "string" && v.trim() !== "") content[field] = v;
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

// ---------------------------------------------------------------------------
// Definição dos campos editáveis (usada pelo formulário do admin /conteudo).
// ---------------------------------------------------------------------------
export interface ContentFieldDef {
  key: string;
  label: string;
  hint?: string;
  kind?: "text" | "multiline" | "select";
  options?: { value: string; label: string }[];
}
export interface ContentGroupDef {
  title: string;
  fields: ContentFieldDef[];
}

export const CONTENT_GROUPS: ContentGroupDef[] = [
  {
    title: "Topo da página",
    fields: [
      { key: "content_hero_badge", label: "Selo (linha pequena)" },
      { key: "content_hero_title_top", label: "Título — 1ª linha" },
      {
        key: "content_hero_title_highlight",
        label: "Título — destaque dourado",
      },
      { key: "content_hero_cta_primary", label: "Botão principal" },
      { key: "content_hero_cta_secondary", label: "Botão secundário" },
      {
        key: "content_hero_subtitle",
        label: "Subtítulo do topo",
        kind: "multiline",
      },
      {
        key: "content_hero_stat1_top",
        label: "Caixa 1 — número",
        hint: "Ex: 100%",
      },
      { key: "content_hero_stat1_bottom", label: "Caixa 1 — texto" },
      {
        key: "content_hero_stat2_top",
        label: "Caixa 2 — número",
        hint: "Ex: Grão ou",
      },
      { key: "content_hero_stat2_bottom", label: "Caixa 2 — texto" },
      {
        key: "content_hero_stat3_top",
        label: "Caixa 3 — número",
        hint: "Ex: 24h",
      },
      { key: "content_hero_stat3_bottom", label: "Caixa 3 — texto" },
      {
        key: "content_hero_title_size",
        label: "Tamanho do título",
        kind: "select",
        options: [
          { value: "md", label: "Médio" },
          { value: "lg", label: "Grande (padrão)" },
          { value: "xl", label: "Maior" },
        ],
      },
      {
        key: "content_hero_title_weight",
        label: "Peso do título",
        kind: "select",
        options: [
          { value: "normal", label: "Normal" },
          { value: "semibold", label: "Seminegrito (padrão)" },
          { value: "bold", label: "Negrito" },
        ],
      },
      {
        key: "content_hero_subtitle_size",
        label: "Tamanho do subtítulo",
        kind: "select",
        options: [
          { value: "sm", label: "Pequeno" },
          { value: "md", label: "Médio (padrão)" },
          { value: "lg", label: "Grande" },
        ],
      },
    ],
  },
  {
    title: "Seção “A História”",
    fields: [
      { key: "content_historia_kicker", label: "Etiqueta (linha pequena)" },
      { key: "content_historia_title", label: "Título da história" },
      { key: "content_historia_p1", label: "Parágrafo 1", kind: "multiline" },
      { key: "content_historia_p2", label: "Parágrafo 2", kind: "multiline" },
    ],
  },
  {
    title: "Seção “Entrega”",
    fields: [
      { key: "content_entrega_kicker", label: "Etiqueta (linha pequena)" },
      { key: "content_entrega_title_top", label: "Título — 1ª parte" },
      {
        key: "content_entrega_title_highlight",
        label: "Título — destaque dourado",
      },
      { key: "content_entrega_step1_title", label: "Passo 1 — título" },
      {
        key: "content_entrega_step1_desc",
        label: "Passo 1 — descrição",
        kind: "multiline",
      },
      { key: "content_entrega_step2_title", label: "Passo 2 — título" },
      {
        key: "content_entrega_step2_desc",
        label: "Passo 2 — descrição",
        kind: "multiline",
      },
      { key: "content_entrega_step3_title", label: "Passo 3 — título" },
      {
        key: "content_entrega_step3_desc",
        label: "Passo 3 — descrição",
        kind: "multiline",
      },
    ],
  },
  {
    title: "Rodapé e contatos",
    fields: [
      {
        key: "content_footer_tagline",
        label: "Frase do rodapé",
        kind: "multiline",
      },
      {
        key: "content_footer_delivery",
        label: "Frase de entrega (rodapé)",
        kind: "multiline",
      },
      {
        key: "whatsapp",
        label: "WhatsApp (só números, com DDD)",
        hint: "Ex: 5567992220619 — usado no rodapé e no checkout",
      },
      { key: "content_contact_instagram", label: "Instagram (@usuário)" },
      { key: "content_contact_address", label: "Endereço / ponto de venda" },
      { key: "content_footer_credit", label: "Crédito (rodapé, embaixo)" },
    ],
  },
];

/** Todas as chaves de settings ligadas a conteúdo (para montar o estado inicial). */
export const CONTENT_KEYS = Object.keys(KEYS);
