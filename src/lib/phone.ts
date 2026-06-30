/**
 * Validação/normalização de telefone brasileiro (helpers puros, sem servidor).
 * Usado no checkout (cliente + API) e no cadastro.
 */

/** Só dígitos; remove o código do país (55) quando presente. */
export function normalizePhone(raw: string | undefined | null): string {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d;
}

/**
 * Telefone brasileiro válido com DDD:
 * - celular: 11 dígitos, 9º dígito = 9  (ex.: 67 9XXXX-XXXX)
 * - fixo:    10 dígitos, começa em 2–8  (ex.: 67 3XXX-XXXX)
 * Rejeita DDD inexistente (< 11) e números com todos os dígitos iguais.
 */
export function isValidBrazilPhone(raw: string | undefined | null): boolean {
  const d = normalizePhone(raw);
  if (d.length !== 10 && d.length !== 11) return false;
  if (Number(d.slice(0, 2)) < 11) return false; // DDDs começam em 11
  if (/^(\d)\1+$/.test(d)) return false; // 00000000000, 99999999999...
  if (d.length === 11) return d[2] === "9"; // celular
  return Number(d[2]) >= 2 && Number(d[2]) <= 8; // fixo
}

/** "67999990000" -> "(67) 99999-0000" (exibição). */
export function formatPhone(raw: string | undefined | null): string {
  const d = normalizePhone(raw);
  const m = d.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : String(raw ?? "");
}
