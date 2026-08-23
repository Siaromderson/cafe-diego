-- ============================================================
--  Café do Feirante MS — Categoria do produto (Café / Itens)
--  Cole no SQL Editor do Supabase e clique RUN.
--  Acrescenta a coluna "category" para separar cafés de outros
--  itens (acessórios, brindes, etc.). Seguro rodar mais de uma vez.
-- ============================================================

alter table cafe_diego_products
  add column if not exists category text not null default 'cafe';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cafe_diego_products_category_chk'
  ) then
    alter table cafe_diego_products
      add constraint cafe_diego_products_category_chk
      check (category in ('cafe','itens'));
  end if;
end $$;

-- Produtos já cadastrados continuam como café (default acima).
