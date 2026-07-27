/**
 * Helpers "puros" de frete por cidade — SEM imports de servidor.
 * Pode ser usado no servidor (checkout, config) e no cliente (checkout page).
 */

/** Chaves de entrega usadas em todo o app. */
export const PICKUP_KEY = "pickup";
export const DELIVERY_KEY = "delivery";
/** Entrega FORA de Campo Grande com frete "a combinar" (sem valor fixo). */
export const DELIVERY_QUOTE_KEY = "delivery_quote";

/** Cidade-base da loja: entrega grátis. */
export const HOME_CITY = "Campo Grande";

/** Texto padrão quando o frete de fora não tem valor definido. */
export const QUOTE_LABEL = "A combinar";

/** Normaliza a cidade: minúsculas, sem acento, sem UF no fim ("- MS", "/MS"). */
export function normalizeCity(city: string | undefined | null): string {
  return String(city ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[-/,].*$/, "") // corta " - ms", "/ms", ", ms"
    .replace(/\s+/g, " ")
    .trim();
}

/** A cidade informada é Campo Grande (entrega grátis)? */
export function isCampoGrande(city: string | undefined | null): boolean {
  return normalizeCity(city) === "campo grande";
}
