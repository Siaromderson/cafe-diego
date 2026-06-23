-- ============================================================
--  Frete fora da cidade grátis (SEDEX / PAC / Motoboy)
--  Cole no SQL Editor do Supabase e clique RUN.
-- ============================================================

-- 1) colunas de frete no pedido
alter table cafe_diego_orders
  add column if not exists shipping_cents  int  not null default 0,
  add column if not exists shipping_method text;

-- 2) valores de frete (em reais) — edite depois pelo painel /admin/config
insert into cafe_diego_settings (key, value) values
  ('ship_sedex',   '25,00'),
  ('ship_pac',     '24,00'),
  ('ship_motoboy', '15,00')
on conflict (key) do nothing;
