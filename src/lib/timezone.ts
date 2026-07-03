/** Fuso horário da loja (Cuiabá / Mato Grosso — UTC−4, sem horário de verão). */
export const APP_TIMEZONE = "America/Cuiaba";

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Partes de data/hora no fuso informado. */
export function getZonedParts(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Converte um instante local no fuso para `Date` UTC. */
function zonedLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string = APP_TIMEZONE
): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(guess, timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      ms
    );
    const wantUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
    guess = new Date(guess.getTime() + (wantUtc - asUtc));
  }
  return guess;
}

/** Início do dia (00:00:00.000) no fuso da loja. */
export function startOfDayInTz(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): Date {
  const { year, month, day } = getZonedParts(date, timeZone);
  return zonedLocalToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

/** Fim do dia (23:59:59.999) no fuso da loja. */
export function endOfDayInTz(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE
): Date {
  const { year, month, day } = getZonedParts(date, timeZone);
  return zonedLocalToUtc(year, month, day, 23, 59, 59, 999, timeZone);
}

/** Interpreta `YYYY-MM-DD` como data de calendário no fuso da loja (não UTC). */
export function parseDateInputInTz(
  ymd: string,
  timeZone: string = APP_TIMEZONE
): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  return zonedLocalToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

/** Chave `YYYY-MM-DD` no fuso da loja — útil para agrupar pedidos por dia. */
export function formatDateKeyInTz(
  dateLike: string | Date,
  timeZone: string = APP_TIMEZONE
): string {
  const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
  const { year, month, day } = getZonedParts(d, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Adiciona dias a um instante, preservando o conceito de dia no fuso. */
export function addDaysInTz(
  date: Date,
  days: number,
  timeZone: string = APP_TIMEZONE
): Date {
  const start = startOfDayInTz(date, timeZone);
  return new Date(start.getTime() + days * 86_400_000);
}
