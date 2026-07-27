/**
 * Integração com os Correios (CWS — api.correios.com.br).
 *
 * Faz duas coisas:
 *  - **Frete**: cálculo de preço (`/preco`) e prazo (`/prazo`) para SEDEX e PAC.
 *  - **Rastreio**: eventos de um objeto (`/srorastro`).
 *
 * Exige contrato + cartão de postagem (veja `hasCorreios` em `./env`). Quando as
 * credenciais não estão presentes, os helpers retornam `null`/`[]` e o app cai
 * no comportamento antigo (frete fixo). Nenhuma falha da API dos Correios pode
 * derrubar o checkout — por isso tudo é embrulhado em try/catch defensivo.
 *
 * Só use este módulo no servidor (usa credenciais).
 */
import { env, hasCorreios } from "./env";

export type CorreiosService = "sedex" | "pac";

export interface CorreiosQuote {
  /** Chave interna do serviço. */
  service: CorreiosService;
  /** Código de serviço dos Correios usado no cálculo (ex.: "03220"). */
  code: string;
  label: string;
  /** Preço final em centavos. */
  cents: number;
  /** Prazo de entrega em dias úteis (0 = desconhecido). */
  etaDays: number;
}

export interface TrackingEvent {
  /** Descrição do evento (ex.: "Objeto entregue ao destinatário"). */
  description: string;
  /** Data/hora ISO do evento, quando disponível. */
  at: string | null;
  /** Local do evento (ex.: "CAMPO GRANDE / MS"), quando disponível. */
  location: string | null;
}

export interface TrackingResult {
  code: string;
  delivered: boolean;
  events: TrackingEvent[];
}

/** Serviços oferecidos (a ordem define como aparecem no checkout). */
function services(): { service: CorreiosService; code: string; label: string }[] {
  return [
    { service: "sedex", code: env.correiosSedexCode, label: "SEDEX" },
    { service: "pac", code: env.correiosPacCode, label: "PAC" },
  ];
}

/** Dimensões padrão da caixa de envio (cm) — respeitam o mínimo dos Correios. */
const BOX = { comprimento: 20, largura: 15, altura: 10 } as const;
/** Peso mínimo cobrado pelos Correios em pacote (g). */
const MIN_WEIGHT_G = 300;
/** Tara da embalagem somada ao peso dos produtos (g). */
const PACKAGING_TARE_G = 100;

/** Peso total do carrinho em gramas (produtos + embalagem, com piso mínimo). */
export function cartWeightGrams(
  lines: { weight_g?: number | null; qty: number }[]
): number {
  const produtos = lines.reduce(
    (n, l) => n + Math.max(0, l.weight_g ?? 0) * Math.max(1, l.qty),
    0
  );
  return Math.max(MIN_WEIGHT_G, produtos + PACKAGING_TARE_G);
}

/** Converte "24,50" / "R$ 24,50" / "24.50" em centavos. */
function precoToCents(v: unknown): number {
  if (v == null) return 0;
  const n = Number(
    String(v).replace(/[^0-9.,]/g, "").replace(/\./g, "").replace(",", ".")
  );
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

// ---- Autenticação (token em cache no processo) -----------------------------

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  if (!hasCorreios) return null;
  // Reaproveita o token enquanto faltarem >60s para expirar.
  if (cachedToken && cachedToken.expiresAt - 60_000 > Date.now()) {
    return cachedToken.token;
  }

  const basic = Buffer.from(
    `${env.correiosUser}:${env.correiosAccessCode}`
  ).toString("base64");

  const res = await fetch(`${env.correiosBase}/token/v1/autentica/cartaopostagem`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${basic}`,
    },
    body: JSON.stringify({ numero: env.correiosCartaoPostagem }),
  });

  const raw = (await res.json().catch(() => ({}))) as {
    token?: string;
    expiraEm?: string;
  };
  if (!res.ok || !raw.token) {
    throw new Error(
      `Correios auth ${res.status}: ${JSON.stringify(raw).slice(0, 300)}`
    );
  }

  const expiresAt = raw.expiraEm
    ? new Date(raw.expiraEm).getTime()
    : Date.now() + 20 * 60_000; // fallback: ~20 min
  cachedToken = { token: raw.token, expiresAt };
  return raw.token;
}

// ---- Frete (preço + prazo) -------------------------------------------------

async function precoServico(
  token: string,
  code: string,
  cepDestino: string,
  weightGrams: number
): Promise<number> {
  const qs = new URLSearchParams({
    cepOrigem: env.correiosCepOrigem,
    cepDestino,
    psObjeto: String(weightGrams),
    tpObjeto: "2", // 2 = pacote
    comprimento: String(BOX.comprimento),
    largura: String(BOX.largura),
    altura: String(BOX.altura),
  });
  const res = await fetch(
    `${env.correiosBase}/preco/v1/nacional/${code}?${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const raw = (await res.json().catch(() => ({}))) as {
    pcFinal?: string;
    txErro?: string;
  };
  if (!res.ok || raw.txErro || raw.pcFinal == null) return 0;
  return precoToCents(raw.pcFinal);
}

async function prazoServico(
  token: string,
  code: string,
  cepDestino: string
): Promise<number> {
  const qs = new URLSearchParams({
    cepOrigem: env.correiosCepOrigem,
    cepDestino,
  });
  const res = await fetch(
    `${env.correiosBase}/prazo/v1/nacional/${code}?${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const raw = (await res.json().catch(() => ({}))) as {
    prazoEntrega?: number | string;
    txErro?: string;
  };
  if (!res.ok || raw.txErro || raw.prazoEntrega == null) return 0;
  const n = Number(raw.prazoEntrega);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Cotação de frete para um CEP de destino e um peso. Retorna as opções válidas
 * (com preço > 0) ou `null` se a integração não estiver configurada ou falhar.
 */
export async function quoteShipping(
  cepDestinoRaw: string,
  weightGrams: number
): Promise<CorreiosQuote[] | null> {
  if (!hasCorreios) return null;
  const cepDestino = String(cepDestinoRaw || "").replace(/\D/g, "");
  if (cepDestino.length !== 8) return null;

  try {
    const token = await getToken();
    if (!token) return null;

    const quotes = await Promise.all(
      services().map(async ({ service, code, label }) => {
        const [cents, etaDays] = await Promise.all([
          precoServico(token, code, cepDestino, weightGrams),
          prazoServico(token, code, cepDestino),
        ]);
        return { service, code, label, cents, etaDays } as CorreiosQuote;
      })
    );

    const valid = quotes.filter((q) => q.cents > 0);
    return valid.length ? valid : null;
  } catch (e) {
    console.error("[correios] falha na cotação:", e);
    return null;
  }
}

// ---- Rastreio --------------------------------------------------------------

interface SroEvento {
  descricao?: string;
  dtHrCriado?: string;
  unidade?: { nome?: string; endereco?: { cidade?: string; uf?: string } };
}

function eventLocation(u: SroEvento["unidade"]): string | null {
  const cidade = u?.endereco?.cidade?.trim();
  const uf = u?.endereco?.uf?.trim();
  if (cidade && uf) return `${cidade} / ${uf}`;
  return u?.nome?.trim() || cidade || null;
}

/**
 * Consulta os eventos de rastreamento de um objeto. Retorna `null` quando a
 * integração não está configurada ou o código é inválido/desconhecido.
 */
export async function trackObject(
  codeRaw: string
): Promise<TrackingResult | null> {
  if (!hasCorreios) return null;
  const code = String(codeRaw || "").trim().toUpperCase();
  // Código dos Correios: 2 letras + 9 dígitos + 2 letras (ex.: AA123456789BR).
  if (!/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(code)) return null;

  try {
    const token = await getToken();
    if (!token) return null;

    const res = await fetch(
      `${env.correiosBase}/srorastro/v1/objetos/${code}?resultado=T`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const raw = (await res.json().catch(() => ({}))) as {
      objetos?: { eventos?: SroEvento[] }[];
    };
    if (!res.ok) return null;

    const eventos = raw.objetos?.[0]?.eventos ?? [];
    const events: TrackingEvent[] = eventos.map((ev) => ({
      description: ev.descricao?.trim() || "Atualização",
      at: ev.dtHrCriado ?? null,
      location: eventLocation(ev.unidade),
    }));

    const delivered = events.some((e) =>
      /entregue/i.test(e.description)
    );

    return { code, delivered, events };
  } catch (e) {
    console.error("[correios] falha no rastreio:", e);
    return null;
  }
}
