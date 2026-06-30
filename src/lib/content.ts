import { hasSupabase } from "./env";
import { getSupabaseAdmin } from "./supabase/server";
import { T } from "./tables";
import { CONTENT_DEFAULTS, KEYS, type SiteContent } from "./content-data";

/**
 * Leitura no servidor do conteúdo editável do site.
 * As constantes/tipos/helpers "puros" ficam em `content-data.ts` (sem
 * dependência de servidor) e são reexportados aqui por conveniência.
 */
export * from "./content-data";

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
