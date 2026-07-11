import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import { hasUazapi } from "@/lib/env";
import { SettingField } from "@/components/admin/SettingField";
import { ToggleField } from "@/components/admin/ToggleField";
import { HelpButton } from "@/components/admin/HelpButton";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TestWhatsappButton } from "@/components/admin/TestWhatsappButton";
import { clearAllOrders, sendTestWhatsapp } from "@/app/admin/actions";

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
              Também é o número que recebe o aviso automático de novos pedidos.
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

      <div className="flex items-center gap-2 pt-4">
        <h2 className="font-display text-xl text-gold">
          Formas de pagamento
        </h2>
        <HelpButton title="Ativar/desativar formas de pagamento">
          <p>
            Ligue ou desligue cada forma de pagamento que aparece no checkout.
            O que estiver <strong>desligado</strong> some da loja na hora.
          </p>
          <p>
            Mantenha pelo menos uma ligada. Se desligar todas, a loja mostra
            todas como segurança (pra não ficar sem opção de pagar).
          </p>
        </HelpButton>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <ToggleField
          settingKey="pay_pix_on"
          label="Pix"
          hint="Aparece no checkout"
          value={map.get("pay_pix_on") ?? "on"}
        />
        <ToggleField
          settingKey="pay_saldo_on"
          label="Saldo do Mercado Pago"
          hint="Pagamento com saldo em conta MP"
          value={map.get("pay_saldo_on") ?? "on"}
        />
        <ToggleField
          settingKey="pay_credit_on"
          label="Crédito"
          hint="Cartão de crédito (permite parcelar)"
          value={map.get("pay_credit_on") ?? "on"}
        />
      </div>

      <div className="flex items-center gap-2 pt-4">
        <h2 className="font-display text-xl text-gold">Taxas de pagamento</h2>
        <HelpButton title="Taxas repassadas ao cliente">
          <p>
            Percentual somado ao total na forma escolhida. O valor aparece como{" "}
            <strong>“Taxa de pagamento”</strong> no checkout e é cobrado do
            cliente.
          </p>
          <p>
            Vale para <strong>qualquer forma</strong> (inclusive Pix). O Mercado
            Pago não envia a taxa dele automaticamente, então defina aqui o
            quanto repassar. Deixe <strong>0</strong> para não cobrar.
          </p>
        </HelpButton>
      </div>
      <p className="text-sm text-cream/55">
        Informe o percentual (ex.: <strong>4,5</strong> para 4,5%). Deixe{" "}
        <strong>0</strong> para não cobrar taxa.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <SettingField
          settingKey="fee_pix_pct"
          label="Taxa do Pix (%)"
          hint="Geralmente 0"
          value={map.get("fee_pix_pct") ?? "0"}
        />
        <SettingField
          settingKey="fee_saldo_pct"
          label="Taxa do saldo MP (%)"
          hint="Saldo do Mercado Pago"
          value={map.get("fee_saldo_pct") ?? map.get("fee_debit_pct") ?? "0"}
        />
        <SettingField
          settingKey="fee_credit_pct"
          label="Taxa do crédito (%)"
          hint="Ex: 4,5"
          value={map.get("fee_credit_pct") ?? "0"}
        />
      </div>

      <div className="flex items-center gap-2 pt-4">
        <h2 className="font-display text-xl text-gold">
          Aviso de venda no WhatsApp
        </h2>
        <HelpButton title="Aviso automático de venda no WhatsApp">
          <p>
            Quando um pedido é <strong>pago</strong>, a loja recebe um aviso no
            WhatsApp com o número do pedido, cliente, total e itens.
          </p>
          <p>
            A mensagem vai para o <strong>WhatsApp configurado acima</strong>{" "}
            (ou para o número dedicado <code>UAZAPI_NOTIFY_NUMBER</code>, se
            definido no servidor). Precisa da UAZAPI configurada
            (<code>UAZAPI_URL</code> e <code>UAZAPI_TOKEN</code>).
          </p>
          <p>
            Use <strong>Enviar teste</strong> para conferir se está chegando.
          </p>
        </HelpButton>
      </div>
      <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-cream">
              Integração:{" "}
              {hasUazapi ? (
                <span className="text-gold">conectada ✓</span>
              ) : (
                <span className="text-wine-bright">não configurada</span>
              )}
            </p>
            <p className="mt-1 text-sm text-cream/60">
              {hasUazapi
                ? "Envia um WhatsApp de teste para o número da loja."
                : "Defina UAZAPI_URL e UAZAPI_TOKEN no servidor e reinicie para ligar."}
            </p>
          </div>
          <TestWhatsappButton action={sendTestWhatsapp} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-6">
        <h2 className="font-display text-xl text-wine-bright">Zona de perigo</h2>
        <HelpButton title="Cuidado: ações que apagam dados">
          <p>
            <strong>Limpar todos os pedidos</strong> apaga toda a lista de
            pedidos (ativos e entregues) para você começar do zero — útil depois
            das simulações de teste.
          </p>
          <p>
            Os <strong>produtos</strong> e os <strong>cadastros de clientes</strong>{" "}
            não são apagados. Sempre pede confirmação antes.
          </p>
        </HelpButton>
      </div>
      <div className="rounded-2xl border border-wine-bright/25 bg-wine-bright/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-cream">Limpar todos os pedidos</p>
            <p className="mt-1 text-sm text-cream/60">
              Apaga todos os pedidos e itens (inclusive os de teste). Não desfaz.
            </p>
          </div>
          <ConfirmButton
            label="Limpar pedidos"
            className="btn-red rounded-full px-6 py-2.5 text-sm"
            title="Apagar TODOS os pedidos?"
            message={
              <>
                Isso apaga <strong>todos os pedidos e itens</strong> da loja, de
                uma vez. Produtos e clientes ficam. <strong>Não dá pra
                desfazer.</strong>
              </>
            }
            confirmLabel="Apagar tudo"
            danger
            action={clearAllOrders}
          />
        </div>
      </div>
    </div>
  );
}
