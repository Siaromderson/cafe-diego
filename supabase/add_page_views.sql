-- ============================================================
--  Métrica de acessos ao site (contador simples)
--  Rode este arquivo uma vez no SQL Editor do Supabase.
-- ============================================================

create table if not exists cafe_diego_page_views (
  id bigint generated always as identity primary key,
  path text not null default '/',
  created_at timestamptz not null default now()
);

-- Índice para as contagens por data (hoje / período) ficarem rápidas.
create index if not exists idx_cafe_diego_page_views_created
  on cafe_diego_page_views (created_at);

-- RLS: só o admin lê os números. Os registros de acesso são gravados
-- pelo backend (service role), que ignora o RLS — por isso não há
-- policy de insert para o público.
alter table cafe_diego_page_views enable row level security;

drop policy if exists cd_pageviews_admin on cafe_diego_page_views;
create policy cd_pageviews_admin on cafe_diego_page_views for select
  using (cafe_diego_is_admin());
