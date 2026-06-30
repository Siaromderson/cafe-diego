import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { SettingField } from "@/components/admin/SettingField";
import { HelpButton } from "@/components/admin/HelpButton";
import { CONTENT_DEFAULTS } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminConteudo() {
  const sb = await getSupabaseServer();
  const { data } = await sb.from(T.settings).select("*");
  const map = new Map((data ?? []).map((s) => [s.key, s.value]));
  const d = CONTENT_DEFAULTS;
  const val = (key: string, fallback: string) => map.get(key) ?? fallback;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl text-cream">Conteúdo do site</h1>
        <HelpButton title="Editar os textos da página">
          <p>
            Aqui você muda os textos que aparecem na loja: topo (hero),
            história, rodapé e contatos. Cada campo salva ao clicar em{" "}
            <strong>Salvar</strong> e a loja atualiza sozinha.
          </p>
          <p>
            Deixe um campo igual ao padrão para manter o texto original.
          </p>
        </HelpButton>
      </div>

      {/* ---------- Topo (Hero) ---------- */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-gold">Topo da página</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField
            settingKey="content_hero_badge"
            label="Selo (linha pequena)"
            value={val("content_hero_badge", d.heroBadge)}
          />
          <SettingField
            settingKey="content_hero_title_top"
            label="Título — 1ª linha"
            value={val("content_hero_title_top", d.heroTitleTop)}
          />
          <SettingField
            settingKey="content_hero_title_highlight"
            label="Título — destaque dourado"
            value={val("content_hero_title_highlight", d.heroTitleHighlight)}
          />
          <SettingField
            settingKey="content_hero_cta_primary"
            label="Botão principal"
            value={val("content_hero_cta_primary", d.heroCtaPrimary)}
          />
          <SettingField
            settingKey="content_hero_cta_secondary"
            label="Botão secundário"
            value={val("content_hero_cta_secondary", d.heroCtaSecondary)}
          />
        </div>
        <SettingField
          settingKey="content_hero_subtitle"
          label="Subtítulo do topo"
          multiline
          value={val("content_hero_subtitle", d.heroSubtitle)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <SettingField
            settingKey="content_hero_title_size"
            label="Tamanho do título"
            value={val("content_hero_title_size", d.heroTitleSize)}
            options={[
              { value: "md", label: "Médio" },
              { value: "lg", label: "Grande (padrão)" },
              { value: "xl", label: "Maior" },
            ]}
          />
          <SettingField
            settingKey="content_hero_title_weight"
            label="Peso do título"
            value={val("content_hero_title_weight", d.heroTitleWeight)}
            options={[
              { value: "normal", label: "Normal" },
              { value: "semibold", label: "Seminegrito (padrão)" },
              { value: "bold", label: "Negrito" },
            ]}
          />
          <SettingField
            settingKey="content_hero_subtitle_size"
            label="Tamanho do subtítulo"
            value={val("content_hero_subtitle_size", d.heroSubtitleSize)}
            options={[
              { value: "sm", label: "Pequeno" },
              { value: "md", label: "Médio (padrão)" },
              { value: "lg", label: "Grande" },
            ]}
          />
        </div>
      </section>

      {/* ---------- História ---------- */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-gold">Seção “A História”</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField
            settingKey="content_historia_kicker"
            label="Etiqueta (linha pequena)"
            value={val("content_historia_kicker", d.historiaKicker)}
          />
          <SettingField
            settingKey="content_historia_title"
            label="Título da história"
            value={val("content_historia_title", d.historiaTitle)}
          />
        </div>
        <SettingField
          settingKey="content_historia_p1"
          label="Parágrafo 1"
          multiline
          value={val("content_historia_p1", d.historiaP1)}
        />
        <SettingField
          settingKey="content_historia_p2"
          label="Parágrafo 2"
          multiline
          value={val("content_historia_p2", d.historiaP2)}
        />
      </section>

      {/* ---------- Rodapé e contatos ---------- */}
      <section className="space-y-4">
        <h2 className="font-display text-xl text-gold">Rodapé e contatos</h2>
        <SettingField
          settingKey="content_footer_tagline"
          label="Frase do rodapé"
          multiline
          value={val("content_footer_tagline", d.footerTagline)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingField
            settingKey="whatsapp"
            label="WhatsApp (só números, com DDD)"
            hint="Ex: 5567992220619 — usado no rodapé e no checkout"
            value={val("whatsapp", d.whatsapp)}
          />
          <SettingField
            settingKey="content_contact_instagram"
            label="Instagram (@usuário)"
            value={val("content_contact_instagram", d.contactInstagram)}
          />
          <SettingField
            settingKey="content_contact_address"
            label="Endereço / ponto de venda"
            value={val("content_contact_address", d.contactAddress)}
          />
          <SettingField
            settingKey="content_footer_credit"
            label="Crédito (rodapé, embaixo)"
            value={val("content_footer_credit", d.footerCredit)}
          />
        </div>
      </section>
    </div>
  );
}
