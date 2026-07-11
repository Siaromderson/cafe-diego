-- ============================================================
--  Café do Feirante MS — Classificação sensorial + Pirâmide do Café
--  Cole no SQL Editor do Supabase e clique RUN.
--  Acrescenta os atributos da embalagem (bolinhas 0-5) e o nível
--  do café na "Pirâmide do Café". Seguro rodar mais de uma vez.
-- ============================================================

-- Novos atributos sensoriais (0 a 5). "body" e "acidity" já existem.
alter table cafe_diego_products
  add column if not exists sweetness  int  not null default 3,   -- Doçura
  add column if not exists bitterness int  not null default 2,   -- Amargor
  add column if not exists aroma      int  not null default 3,   -- Aroma
  add column if not exists aftertaste int  not null default 3;   -- Retrogosto

-- Nível na Pirâmide do Café: especial > gourmet > superior > tradicional.
alter table cafe_diego_products
  add column if not exists tier text not null default 'superior';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'cafe_diego_products_tier_chk'
  ) then
    alter table cafe_diego_products
      add constraint cafe_diego_products_tier_chk
      check (tier in ('especial','gourmet','superior','tradicional'));
  end if;
end $$;

-- Valores "ideais" que o cliente passou, aplicados aos dois produtos iniciais.
-- (Depois é só ajustar produto a produto pelo painel admin.)
update cafe_diego_products
  set body = 4, sweetness = 4, bitterness = 1, acidity = 1, aroma = 4, aftertaste = 4,
      tier = 'especial'
  where slug = '100-arabica-graos-1kg';

update cafe_diego_products
  set body = 4, sweetness = 3, bitterness = 2, acidity = 1, aroma = 4, aftertaste = 3,
      tier = 'superior'
  where slug = '100-arabica-tradicional-moido-500g';
