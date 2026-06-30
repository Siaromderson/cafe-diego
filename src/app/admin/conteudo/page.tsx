import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { HelpButton } from "@/components/admin/HelpButton";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { CONTENT_DEFAULTS, CONTENT_KEYS, KEYS } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminConteudo() {
  const sb = await getSupabaseServer();
  const { data } = await sb.from(T.settings).select("*");
  const map = new Map((data ?? []).map((s) => [s.key, s.value]));

  // Estado inicial: valor salvo ou o padrão de cada chave de conteúdo.
  const initial: Record<string, string> = {};
  for (const key of CONTENT_KEYS) {
    const field = KEYS[key];
    if (!field) continue;
    const saved = map.get(key);
    initial[key] =
      saved != null && String(saved).trim() !== ""
        ? String(saved)
        : CONTENT_DEFAULTS[field];
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl text-cream">Conteúdo do site</h1>
        <HelpButton title="Editar os textos da página">
          <p>
            Mude os textos da loja: topo (hero), história, rodapé e contatos. A{" "}
            <strong>prévia ao lado</strong> (ou embaixo, no celular) atualiza
            enquanto você digita.
          </p>
          <p>
            Cada campo só passa a valer na loja depois de clicar em{" "}
            <strong>Salvar</strong>.
          </p>
        </HelpButton>
      </div>

      <ContentEditor initial={initial} />
    </div>
  );
}
