/**
 * Validação, máscara e normalização de telefone brasileiro.
 * Usado no checkout (cliente + API) e no cadastro.
 */

/** DDD padrão da loja (Campo Grande / MS). Usado quando o lead digita só o número. */
export const DEFAULT_DDD = "67";

/** Só dígitos; remove o código do país (55) quando presente. */
export function normalizePhone(raw: string | undefined | null): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

/**
 * Completa DDD quando o lead digita só o número (sem área).
 * Ex.: 99395-9114 → 67993959114
 */
export function preparePhone(
  raw: string | undefined | null,
  defaultDdd: string = DEFAULT_DDD
): string {
  let d = normalizePhone(raw);
  const ddd = defaultDdd.replace(/\D/g, "").slice(0, 2);

  if (d.length === 9 && d[0] === "9") {
    d = ddd + d;
  } else if (d.length === 8 && /^[2-8]/.test(d[0])) {
    d = ddd + d;
  }

  return d.slice(0, 11);
}

/**
 * Telefone brasileiro válido com DDD:
 * - celular: 11 dígitos, 9º dígito = 9  (ex.: 67 9XXXX-XXXX)
 * - fixo:    10 dígitos, começa em 2–8  (ex.: 67 3XXX-XXXX)
 */
export function isValidBrazilPhone(raw: string | undefined | null): boolean {
  const d = preparePhone(raw);
  if (d.length !== 10 && d.length !== 11) return false;
  if (Number(d.slice(0, 2)) < 11) return false;
  if (/^(\d)\1+$/.test(d)) return false;
  if (d.length === 11) return d[2] === "9";
  return Number(d[2]) >= 2 && Number(d[2]) <= 8;
}

/** "67999990000" -> "(67) 99999-0000" (exibição). */
export function formatPhone(raw: string | undefined | null): string {
  const d = preparePhone(raw);
  const m = d.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : String(raw ?? "");
}

/**
 * Formata enquanto o usuário digita — aceita qualquer mistura de
 * dígitos, espaços e traços e vai montando (67) 99999-0000 sozinho.
 */
export function formatPhoneAsYouType(
  raw: string,
  defaultDdd: string = DEFAULT_DDD
): string {
  let digits = normalizePhone(raw);

  // Lead digitou só o celular (9 dígitos) — já completa o DDD na hora.
  if (digits.length >= 9 && digits.length <= 9 && digits[0] === "9") {
    digits = preparePhone(digits, defaultDdd);
  }

  digits = digits.slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const isMobile = digits.length > 10 || digits[2] === "9";

  if (digits.length <= 2) {
    return digits.length === 2 ? `(${digits}) ` : `(${digits}`;
  }

  if (isMobile) {
    if (rest.length <= 5) {
      return `(${ddd}) ${rest}`;
    }
    return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  }

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`;
  }
  return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

/** Valor limpo para API (só dígitos, com DDD). */
export function phoneForSubmit(raw: string | undefined | null): string {
  return preparePhone(raw);
}
