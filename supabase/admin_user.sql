-- ============================================================
--  Café do Feirante — Criar usuário ADMIN
--  Cole no SQL Editor do Supabase e clique RUN.
--
--  Login do painel:
--    email: admin@cafedofeirantems.com
--    senha: 123456
--
--  Depois acesse /login no site, entre com esse e-mail/senha
--  e você terá acesso ao painel em /admin.
-- ============================================================

-- 0) (se o banco já existia antes da galeria) garante a coluna de fotos
alter table cafe_diego_products
  add column if not exists images text[] not null default '{}';

-- 1) extensão de hash de senha
create extension if not exists pgcrypto;

-- 2) cria o usuário no auth do Supabase (só se ainda não existir)
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  -- colunas de token: precisam ser '' (não NULL), senão o GoTrue
  -- quebra com "Database error querying schema" no login
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'admin@cafedofeirantems.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now(),
  '', '', '', '', '', '', '', ''
where not exists (
  select 1 from auth.users where email = 'admin@cafedofeirantems.com'
);

-- 2b) garante a senha e conserta colunas de token NULL (caso já existisse)
update auth.users
  set encrypted_password = crypt('123456', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      confirmation_token = coalesce(confirmation_token, ''),
      recovery_token = coalesce(recovery_token, ''),
      email_change = coalesce(email_change, ''),
      email_change_token_new = coalesce(email_change_token_new, ''),
      email_change_token_current = coalesce(email_change_token_current, ''),
      phone_change = coalesce(phone_change, ''),
      phone_change_token = coalesce(phone_change_token, ''),
      reauthentication_token = coalesce(reauthentication_token, ''),
      updated_at = now()
where email = 'admin@cafedofeirantems.com';

-- 3) cria a identidade de e-mail (necessária para o login funcionar)
insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(),
  u.id,
  u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.email = 'admin@cafedofeirantems.com'
  and not exists (
    select 1 from auth.identities i
    where i.user_id = u.id and i.provider = 'email'
  );

-- 4) marca esse e-mail como administrador (libera o painel /admin)
insert into cafe_diego_admins (email)
values ('admin@cafedofeirantems.com')
on conflict (email) do nothing;
