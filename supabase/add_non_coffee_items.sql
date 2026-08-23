-- ============================================================
--  Café do Feirante MS — Itens que não são café
--  Cole no SQL Editor do Supabase e clique RUN.
--  Acrescenta a coluna is_coffee. Quando false, o item (ex.: caneca,
--  filtro, brinde) não mostra tipo grão/moído, classificação sensorial
--  nem a Pirâmide do Café na loja. Seguro rodar mais de uma vez.
-- ============================================================

-- Todos os produtos já cadastrados continuam sendo café (default true).
alter table cafe_diego_products
  add column if not exists is_coffee boolean not null default true;
