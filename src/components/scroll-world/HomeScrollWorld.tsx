"use client";

import { useEffect, useRef } from "react";
import { mountScrollWorld } from "./scrubEngine";
import { CONTENT_DEFAULTS, type SiteContent } from "@/lib/content-data";

/**
 * Entrada cinematográfica da home: o scroll comanda uma câmera que voa do pé de
 * café à xícara ao produto (um único take do Higgsfield, cortado em 4 batimentos).
 * Ao final, o mundo do vídeo DISSOLVE no marrom do site (fade de saída), levando
 * naturalmente ao Hero ("O verdadeiro Café do Feirante") que vem logo abaixo.
 *
 * Toda a copy vem do conteúdo editável do site (content-data / admin) — nada de
 * texto novo é inventado aqui.
 */

const BASE = "/scroll-world";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function buildSections(c: SiteContent) {
  return [
    {
      id: "origem",
      label: "O café",
      accent: "#d98a3d",
      still: `${BASE}/origem.jpg`,
      clip: `${BASE}/origem.mp4`,
      clipMobile: `${BASE}/origem-m.mp4`,
      scroll: 2.2,
      linger: 0.4,
      eyebrow: c.heroBadge,
      title: `${c.heroTitleTop} ${c.heroTitleHighlight}`,
    },
    {
      id: "grao",
      label: "A história",
      accent: "#c9a96a",
      still: `${BASE}/grao.jpg`,
      clip: `${BASE}/grao.mp4`,
      clipMobile: `${BASE}/grao-m.mp4`,
      scroll: 2.0,
      linger: 0.35,
      eyebrow: c.historiaKicker,
      title: c.historiaTitle,
    },
    {
      id: "preparo",
      label: "A xícara",
      accent: "#cf2b22",
      still: `${BASE}/preparo.jpg`,
      clip: `${BASE}/preparo.mp4`,
      clipMobile: `${BASE}/preparo-m.mp4`,
      scroll: 2.0,
      linger: 0.4,
      title: c.historiaP2,
    },
    {
      id: "produto",
      label: "Peça já",
      accent: "#e7c987",
      still: `${BASE}/produto.jpg`,
      clip: `${BASE}/produto.mp4`,
      clipMobile: `${BASE}/produto-m.mp4`,
      scroll: 2.3,
      linger: 0.4,
      eyebrow: c.entregaKicker,
      title: `${c.entregaTitleTop} ${c.entregaTitleHighlight}`,
    },
  ];
}

export function HomeScrollWorld({
  content = CONTENT_DEFAULTS,
}: {
  content?: SiteContent;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    const container = ref.current;
    if (!container || mounted.current) return;
    mounted.current = true;

    mountScrollWorld(container, {
      brand: null, // usamos a Navbar do site
      nav: false, // idem — sem nav duplicada
      atmosphere: false, // sem partículas/gradiente extra = menos repaint (mais fluido)
      hint: "role para voar",
      crossfade: 0.18, // seams mais suaves (mais fluido)
      diveScroll: 2.0,
      sections: buildSections(content),
      connectors: [], // take contínuo: sem conectores, os cortes já emendam
    });

    // Fade de saída: em vez de um corte seco, o mundo do vídeo dissolve no marrom
    // do site na última rolagem, exatamente quando o Hero (também marrom) sobe por
    // baixo — a transição fica natural. Reaparece ao rolar de volta.
    const onScroll = () => {
      const vh = window.innerHeight;
      const bottom = container.getBoundingClientRect().bottom;
      // h: 0 = mundo cheio; 1 = totalmente dissolvido. Começa a sumir ~1,4vh antes
      // do fim (com o produto ainda em cena) e completa ~0,4vh antes, dando ao Hero
      // um respiro para assentar.
      const h = clamp((1.4 * vh - bottom) / vh);
      container.style.setProperty("--sw-exit", String(1 - h));
      container.classList.toggle("sw-done", h >= 1);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Sem teardown: o motor registra listeners próprios sem API de remoção e o
    // guard `mounted` evita duplicar no StrictMode (dev). Monta uma única vez —
    // `content` é lido no mount e não muda durante a vida da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} id="sw-world" aria-label="A jornada do café" />;
}
