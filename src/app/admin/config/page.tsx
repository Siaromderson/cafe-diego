import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { SettingField } from "@/components/admin/SettingField";
import { HelpButton } from "@/components/admin/HelpButton";

export const dynamic = "force-dynamic";

export default async function AdminConfig() {
  const sb = await getSupabaseServer();
  const { data } = await sb.from(T.settings).select("*");
  const map = new Map((data ?? []).map((s) => [s.key, s.value]));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl text-cream">Configurações</h1>
        <HelpButton title="O que dá pra configurar aqui">
          <p>
            Ajustes gerais da loja. Cada campo salva sozinho ao clicar em{" "}
            <strong>Salvar</strong>.
          </p>
          <ul className="ml-4 list-disc space-y-0.5">
            <li>
              <strong>Taxa de entrega:</strong> valor fixo cobrado quando o
              cliente pede entrega. Na retirada no local não há custo.
            </li>
            <li>
              <strong>WhatsApp:</strong> número de contato (só números, com DDD).
            </li>
          </ul>
        </HelpButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingField
          settingKey="delivery_fee"
          label="Taxa de entrega (R$)"
          hint="Ex: 15,00 · retirada no local é sempre grátis"
          value={map.get("delivery_fee") ?? "15,00"}
        />
        <SettingField
          settingKey="whatsapp"
          label="WhatsApp (só números)"
          hint="Ex: 5567992220619"
          value={map.get("whatsapp") ?? "5567992220619"}
        />
      </div>
    </div>
  );
}
