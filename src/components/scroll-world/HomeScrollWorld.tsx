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
 * Os títulos/textos vêm do conteúdo editável do site (content-data / admin). No
 * PC, alguns beats ganham detalhes visuais que ecoam recursos reais do site — a
 * classificação sensorial (bolinhas) e a pirâmide do café — para dar acabamento.
 */

const BASE = "/scroll-world";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// --- Detalhes visuais (só desktop) que ecoam recursos reais do site ---------
// Bolinhas = classificação sensorial (mesmo look do componente SensoryMeters);
// pirâmide = mesmo SVG do CoffeePyramid, com "Especial" (o topo) em destaque.

function dotsRow(label: string, n: number) {
  const dots = Array.from({ length: 5 }, (_, i) =>
    `<span style="width:7px;height:7px;border-radius:50%;background:${
      i < n ? "var(--sw-accent)" : "rgba(245,236,217,.16)"
    }"></span>`
  ).join("");
  return `<div style="display:flex;align-items:center;gap:12px;margin-top:8px">
    <span style="min-width:82px;font-size:.7rem;letter-spacing:.12em;text-transform:uppercase;color:var(--sw-ink);opacity:.72">${label}</span>
    <span style="display:flex;gap:5px">${dots}</span></div>`;
}

// Perfil representativo, ancorado na história do site ("encorpado, aromático,
// doçura natural" — torra média que respeita o grão).
const SENSORY_HTML = `<div style="margin-top:24px">
  <div style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--sw-accent)">Classificação sensorial</div>
  ${dotsRow("Corpo", 4)}${dotsRow("Aroma", 5)}${dotsRow("Doçura", 4)}
</div>`;

const PYRAMID_HTML = `<div style="margin-top:24px;display:flex;align-items:center;gap:16px">
  <svg viewBox="0 0 100 80" style="height:68px;width:auto;flex-shrink:0" aria-hidden="true">
    <defs><linearGradient id="sw-pyr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dca5"/><stop offset="1" stop-color="#c9a96a"/></linearGradient></defs>
    <polygon points="50,4 60.5,21.5 39.5,21.5" fill="url(#sw-pyr)" stroke="#f3dca5" stroke-width="1" stroke-linejoin="round"/>
    <polygon points="39.5,21.5 60.5,21.5 71,39 29,39" fill="rgba(245,236,217,.05)" stroke="rgba(231,201,135,.28)" stroke-width=".7" stroke-linejoin="round"/>
    <polygon points="29,39 71,39 81.5,56.5 18.5,56.5" fill="rgba(245,236,217,.05)" stroke="rgba(231,201,135,.28)" stroke-width=".7" stroke-linejoin="round"/>
    <polygon points="18.5,56.5 81.5,56.5 92,74 8,74" fill="rgba(245,236,217,.05)" stroke="rgba(231,201,135,.28)" stroke-width=".7" stroke-linejoin="round"/>
  </svg>
  <div>
    <div style="font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;color:var(--sw-accent)">Pirâmide do café</div>
    <div style="margin-top:7px;font-size:1rem;color:var(--sw-ink)"><strong>Especial</strong> — o topo da pirâmide</div>
    <div style="margin-top:4px;font-size:.78rem;color:var(--sw-ink-soft)">Especial › Gourmet › Superior › Tradicional</div>
  </div>
</div>`;

function buildSections(c: SiteContent, withDetails: boolean) {
  return [
    {
      id: "origem",
      label: "O café",
      accent: "#d98a3d",
      still: `${BASE}/origem.jpg`,
      clip: `${BASE}/origem.mp4`,
      clipMobile: `${BASE}/origem-m.mp4`,
      stillMobile: `${BASE}/origem-m.jpg`,
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
      stillMobile: `${BASE}/grao-m.jpg`,
      scroll: 2.0,
      linger: 0.35,
      eyebrow: c.historiaKicker,
      title: c.historiaTitle,
      extraHtml: withDetails ? SENSORY_HTML : undefined,
    },
    {
      id: "preparo",
      label: "A xícara",
      accent: "#cf2b22",
      still: `${BASE}/preparo.jpg`,
      clip: `${BASE}/preparo.mp4`,
      clipMobile: `${BASE}/preparo-m.mp4`,
      stillMobile: `${BASE}/preparo-m.jpg`,
      scroll: 2.0,
      linger: 0.4,
      title: c.historiaP2,
      extraHtml: withDetails ? PYRAMID_HTML : undefined,
    },
    {
      id: "produto",
      label: "Peça já",
      accent: "#e7c987",
      still: `${BASE}/produto.jpg`,
      clip: `${BASE}/produto.mp4`,
      clipMobile: `${BASE}/produto-m.mp4`,
      stillMobile: `${BASE}/produto-m.jpg`,
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

    // Detalhes visuais (bolinhas/pirâmide) só no PC — no celular a copy fica
    // ancorada embaixo e o espaço é curto.
    const isPhone =
      window.matchMedia("(max-width: 860px)").matches ||
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;

    const DIVE = 2.0;
    const sections = buildSections(content, !isPhone);
    mountScrollWorld(container, {
      brand: null, // usamos a Navbar do site
      nav: false, // idem — sem nav duplicada
      atmosphere: false, // sem partículas/gradiente extra = menos repaint (mais fluido)
      hint: "role para voar",
      crossfade: 0.18, // seams mais suaves (mais fluido)
      diveScroll: DIVE,
      sections,
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

    // ---- Snap pro texto -----------------------------------------------------
    // Se a pessoa PARAR de rolar num "vão" (nenhuma copy legível — como entre dois
    // beats), desliza suavemente até o ponto de texto mais próximo. Só age depois
    // que a rolagem parou (debounce), nunca durante; cancela a qualquer interação
    // (roda/toque/tecla). Desligado no celular (toque) e em reduced-motion, para
    // não brigar com o scroll do usuário.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    ).matches;
    if (!reduce && !coarse) {
      const W = sections.map((s) => s.scroll || DIVE); // vh de scroll por seção
      const total = W.reduce((a, b) => a + b, 0);
      const smooth = (x: number) => {
        x = clamp(x);
        return x * x * (3 - 2 * x);
      };
      const bands = (vh: number) => {
        let a = 0;
        return W.map((w) => {
          const b = { s: a * vh, e: (a + w) * vh };
          a += w;
          return b;
        });
      };
      // Maior opacidade de copy no y atual (mesma lógica do motor).
      const maxCopy = (y: number, vh: number) => {
        const b = bands(vh);
        const N = b.length;
        let m = 0;
        for (let i = 0; i < N; i++) {
          const { s, e } = b[i];
          const pr = clamp((y - s) / (e - s));
          const before = y < s;
          const after = y > e;
          let c: number;
          if (i === 0) c = after ? 0 : smooth(1 - pr / 0.62);
          else if (i === N - 1) c = before ? 0 : smooth(pr / 0.4);
          else c = before || after ? 0 : smooth(1 - Math.abs(pr - 0.5) / 0.5);
          if (c > m) m = c;
        }
        return m;
      };
      // y onde a copy de cada seção fica no auge.
      const spots = (vh: number) => {
        const b = bands(vh);
        const N = b.length;
        return b.map((seg, i) => {
          const pr = i === 0 ? 0.08 : i === N - 1 ? 0.45 : 0.5;
          return seg.s + pr * (seg.e - seg.s);
        });
      };

      let raf = 0;
      let snapping = false;
      const cancelSnap = () => {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        snapping = false;
      };
      const snapTo = (ty: number) => {
        const sy = window.scrollY;
        const d = ty - sy;
        if (Math.abs(d) < 2) return;
        snapping = true;
        let t0: number | null = null;
        const step = (ts: number) => {
          if (t0 == null) t0 = ts;
          const p = Math.min(1, (ts - t0) / 420);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
          window.scrollTo(0, Math.round(sy + d * e));
          if (p < 1) raf = requestAnimationFrame(step);
          else {
            raf = 0;
            snapping = false;
          }
        };
        raf = requestAnimationFrame(step);
      };
      (["wheel", "touchstart", "keydown", "pointerdown"] as const).forEach(
        (ev) => window.addEventListener(ev, cancelSnap, { passive: true })
      );

      let timer = 0;
      const scheduleSnap = () => {
        if (snapping) return; // ignora a nossa própria animação
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          const vh = window.innerHeight;
          const y = window.scrollY;
          if (y < 0.25 * vh || y > total * vh - 0.25 * vh) return; // hero/dissolve livres
          if (maxCopy(y, vh) >= 0.5) return; // já tem texto legível → não mexe
          const sp = spots(vh);
          let best = sp[0];
          for (const s of sp)
            if (Math.abs(s - y) < Math.abs(best - y)) best = s;
          const dist = Math.abs(best - y);
          // Limite superior cobre o vão mais largo (~1,5vh até o texto mais
          // próximo) sem deixar ponto morto; inferior evita micro-ajustes.
          if (dist > 0.04 * vh && dist < 2.0 * vh) snapTo(best);
        }, 170);
      };
      window.addEventListener("scroll", scheduleSnap, { passive: true });
    }
    // Sem teardown: o motor registra listeners próprios sem API de remoção e o
    // guard `mounted` evita duplicar no StrictMode (dev). Monta uma única vez —
    // `content` é lido no mount e não muda durante a vida da página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} id="sw-world" aria-label="A jornada do café" />;
}
