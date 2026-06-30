"use client";

import { useState } from "react";
import {
  instagramLink,
  whatsappDisplay,
  type SiteContent,
} from "@/lib/content-data";

/** Tamanhos proporcionais à miniatura (não os do site real). */
const T_SIZE: Record<string, string> = {
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};
const T_WEIGHT: Record<string, string> = {
  normal: "font-normal",
  semibold: "font-semibold",
  bold: "font-bold",
};
const S_SIZE: Record<string, string> = {
  sm: "text-[9px]",
  md: "text-[10px]",
  lg: "text-[11px]",
};

/**
 * Miniatura ao vivo do site, refletindo o conteúdo em edição no painel.
 * Não é interativa — é só uma prévia visual de como vai ficar.
 */
export function SitePreview({ content }: { content: SiteContent }) {
  // No celular começa recolhida (barra no rodapé); no desktop o `lg:block`
  // do corpo força a prévia sempre visível no painel lateral.
  const [open, setOpen] = useState(false);
  const titleSize = T_SIZE[content.heroTitleSize] ?? T_SIZE.lg;
  const titleWeight = T_WEIGHT[content.heroTitleWeight] ?? T_WEIGHT.semibold;
  const subSize = S_SIZE[content.heroSubtitleSize] ?? S_SIZE.md;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/12 bg-black/40 shadow-[0_14px_40px_rgba(0,0,0,0.55)] backdrop-blur-sm">
      {/* barra do "navegador" */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 border-b border-white/10 bg-white/5 px-3 py-2 text-left"
      >
        <span className="h-2 w-2 rounded-full bg-wine-bright/80" />
        <span className="h-2 w-2 rounded-full bg-amber/70" />
        <span className="h-2 w-2 rounded-full bg-gold/60" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-cream/40">
          Prévia da loja
        </span>
        <span className="ml-auto text-xs text-cream/50 lg:hidden">
          {open ? "ocultar ▾" : "ver ▴"}
        </span>
      </button>

      {/* página em miniatura */}
      <div
        className={`${
          open ? "block" : "hidden"
        } max-h-[44vh] overflow-y-auto px-4 py-5 text-center lg:block lg:max-h-[calc(100vh-9rem)]`}
        style={{
          background:
            "radial-gradient(420px 220px at 80% -10%, rgba(217,138,61,0.16), transparent 60%), linear-gradient(180deg, #20130a 0%, #2c1a10 45%, #1c1008 100%)",
        }}
      >
        {/* Hero */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-transparent.png"
          alt="logo"
          className="mx-auto mb-2 h-14 w-auto"
        />
        <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-gold/25 bg-white/5 px-2 py-0.5 text-[8px] uppercase tracking-[0.2em] text-gold">
          <span className="h-1 w-1 rounded-full bg-gold" />
          {content.heroBadge}
        </span>
        <h1
          className={`font-display leading-tight tracking-tight ${titleSize} ${titleWeight}`}
        >
          {content.heroTitleTop}
          <br />
          <span className="gold-text">{content.heroTitleHighlight}</span>
        </h1>
        <p className={`mx-auto mt-2 max-w-[34ch] text-cream/70 ${subSize}`}>
          {content.heroSubtitle}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="btn-gold rounded-full px-3 py-1 text-[9px] uppercase tracking-wide">
            {content.heroCtaPrimary}
          </span>
          <span className="btn-ghost rounded-full px-3 py-1 text-[9px] uppercase tracking-wide">
            {content.heroCtaSecondary}
          </span>
        </div>

        {/* História */}
        <div className="glass mt-6 rounded-xl p-3 text-left">
          <p className="text-[8px] uppercase tracking-[0.3em] text-gold/80">
            {content.historiaKicker}
          </p>
          <h2 className="font-display mt-1 text-sm text-cream">
            {content.historiaTitle}
          </h2>
          <p className="mt-1 line-clamp-3 whitespace-pre-line text-[10px] text-cream/65">
            {content.historiaP1}
          </p>
        </div>

        {/* Rodapé */}
        <div className="mt-6 border-t border-white/10 pt-3 text-left">
          <p className="text-[10px] text-cream/60">{content.footerTagline}</p>
          <ul className="mt-2 space-y-0.5 text-[10px] text-cream/70">
            <li className="text-gold/90">
              WhatsApp · {whatsappDisplay(content.whatsapp)}
            </li>
            <li className="truncate">
              {content.contactInstagram}
              <span className="text-cream/35">
                {" "}
                · {instagramLink(content.contactInstagram).replace("https://", "")}
              </span>
            </li>
            <li className="text-cream/60">{content.contactAddress}</li>
          </ul>
          <p className="mt-2 text-[9px] text-cream/40">
            © {new Date().getFullYear()} Café do Feirante MS ·{" "}
            {content.footerCredit}
          </p>
        </div>
      </div>
    </div>
  );
}
