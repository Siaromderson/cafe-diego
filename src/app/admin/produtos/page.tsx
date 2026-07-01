import { getSupabaseServer } from "@/lib/supabase/server";
import { T } from "@/lib/tables";
import type { Product } from "@/lib/types";
import { ProductForm } from "@/components/admin/ProductForm";
import { HelpButton } from "@/components/admin/HelpButton";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const sb = await getSupabaseServer();
  const { data } = await sb
    .from(T.products)
    .select("*")
    .order("sort", { ascending: true });
  const products = (data ?? []) as Product[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl text-cream">Produtos</h1>
          <HelpButton title="Como cadastrar produtos">
            <p>
              Edite um produto existente em <strong>Editar</strong> ou cadastre
              um novo no final da página.
            </p>
            <ul className="ml-4 list-disc space-y-0.5">
              <li>
                <strong>Imagem principal e galeria:</strong> suba as fotos direto
                do seu computador (clique e escolha o arquivo). Para apagar uma
                foto já enviada, clique no <strong>×</strong> vermelho no canto
                dela e salve.
              </li>
              <li>
                <strong>Preço, peso e estoque:</strong> aparecem na loja em tempo
                real.
              </li>
              <li>
                <strong>Produto ativo:</strong> desmarque para esconder da loja
                sem apagar.
              </li>
              <li>
                <strong>Ordem na loja:</strong> use as setas ↑ ↓ ao lado de cada
                produto para mudar a posição na página.
              </li>
            </ul>
          </HelpButton>
        </div>
        <span className="text-sm text-cream/55">{products.length} itens</span>
      </div>

      <section className="space-y-3">
        {products.map((p, i) => (
          <ProductForm
            key={p.id}
            product={p}
            index={i}
            total={products.length}
          />
        ))}
      </section>

      <div>
        <h2 className="font-display mb-3 text-lg text-gold">
          Adicionar novo produto
        </h2>
        <ProductForm />
      </div>
    </div>
  );
}
