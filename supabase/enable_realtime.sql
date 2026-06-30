-- ============================================================
--  Café do Feirante MS — Ativar Realtime (Supabase / Postgres)
--  Cole no SQL Editor do Supabase e clique RUN.
--  É idempotente e à prova de erro: pode rodar quantas vezes quiser,
--  nunca dá "already exists" nem "duplicate".
-- ============================================================

-- 1) Garante que a publicação do Realtime existe (no Supabase já vem pronta,
--    mas criamos se faltar — sem nunca falhar).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- 2) Adiciona as tabelas do app à publicação, só se ainda não estiverem.
--    REPLICA IDENTITY FULL faz os eventos de UPDATE/DELETE virem com a linha
--    completa (o painel recebe o pedido inteiro, não só o id).
do $$
declare
  t text;
  tabelas text[] := array[
    'cafe_diego_orders',
    'cafe_diego_order_items',
    'cafe_diego_products',
    'cafe_diego_stock_movements',
    'cafe_diego_settings'
  ];
begin
  foreach t in array tabelas loop
    -- pula tabela que ainda não existe (evita erro se rodar antes do setup)
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I replica identity full', t);

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 3) Conferência (opcional): lista o que ficou ativo no Realtime.
select tablename
from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by tablename;
