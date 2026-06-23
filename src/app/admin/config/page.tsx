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
              <strong>Cidade com frete grátis:</strong> pedidos nessa cidade não
              pagam frete; nas outras, o cliente escolhe SEDEX/PAC/Motoboy.
            </li>
            <li>
              <strong>Prazo de entrega:</strong> usado nas mensagens da loja.
            </li>
            <li>
              <strong>WhatsApp:</strong> número de contato (só números, com DDD).
            </li>
          </ul>
        </HelpButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SettingField
          settingKey="free_shipping_city"
          label="Cidade com frete grátis"
          value={map.get("free_shipping_city") ?? "Campo Grande"}
        />
        <SettingField
          settingKey="delivery_days"
          label="Prazo de entrega (dias)"
          value={map.get("delivery_days") ?? "2"}
        />
        <SettingField
          settingKey="whatsapp"
          label="WhatsApp (só números)"
          hint="Ex: 5567992220619"
          value={map.get("whatsapp") ?? "5567992220619"}
        />
      </div>

      <div className="flex items-center gap-2 pt-4">
        <h2 className="font-display text-xl text-gold">
          Frete (fora da cidade grátis)
        </h2>
        <HelpButton title="Como funciona o frete">
          <p>
            Quando o cliente coloca um endereço <strong>fora</strong> da cidade
            grátis, ele escolhe uma forma de entrega no checkout e o valor é
            somado ao total automaticamente.
          </p>
          <p>
            Defina o preço de cada opção abaixo. Deixe <strong>0</strong> ou em
            branco para esconder uma opção (ex.: se você não faz Motoboy fora da
            cidade, zere o Motoboy).
          </p>
        </HelpButton>
      </div>
      <p className="text-sm text-cream/55">
        Valor em reais para cada forma de entrega. Deixe <strong>0</strong> ou
        em branco para esconder a opção no checkout.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <SettingField
          settingKey="ship_sedex"
          label="SEDEX (R$)"
          hint="Ex: 25,00"
          value={map.get("ship_sedex") ?? "25,00"}
        />
        <SettingField
          settingKey="ship_pac"
          label="PAC (R$)"
          hint="Ex: 24,00"
          value={map.get("ship_pac") ?? "24,00"}
        />
        <SettingField
          settingKey="ship_motoboy"
          label="Motoboy (R$)"
          hint="Ex: 15,00"
          value={map.get("ship_motoboy") ?? "15,00"}
        />
      </div>
    </div>
  );
}
