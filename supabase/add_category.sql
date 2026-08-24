-- ============================================================
--  Café do Feirante MS — Categoria do produto (Café / Itens)
--  Cole no SQL Editor do Supabase e clique RUN.
--  Acrescenta a coluna "category" para separar cafés de outros
--  itens (acessórios, brindes, etc.). Seguro rodar mais de uma vez.
-- ============================================================

alter table cafe_diego_products
  add column if not exists category text not null default 'cafe';

-- Recria a checagem sempre, para corrigir uma constraint antiga que porventura
-- só aceitasse 'cafe'. Garante que 'itens' é aceito. Seguro rodar de novo.
alter table cafe_diego_products
  drop constraint if exists cafe_diego_products_category_chk;
alter table cafe_diego_products
  add constraint cafe_diego_products_category_chk
  check (category in ('cafe','itens'));

-- Produtos já cadastrados continuam como café (default acima).
