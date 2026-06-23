-- ============================================================
--  CORREÇÃO do erro de login:
--    "Database error querying schema" / AuthRetryableFetchError
--
--  Causa: usuário admin inserido manualmente na auth.users deixou
--  colunas de token como NULL. O GoTrue lê essas colunas como texto
--  NÃO-nulo, então UM único NULL em QUALQUER linha quebra todas as
--  consultas de autenticação (login E listagem de usuários).
--
--  Este script normaliza TODAS as linhas (NULL -> '').
--  Cole no SQL Editor do Supabase e clique RUN.
-- ============================================================

update auth.users set
  confirmation_token            = coalesce(confirmation_token, ''),
  recovery_token                = coalesce(recovery_token, ''),
  email_change                  = coalesce(email_change, ''),
  email_change_token_new        = coalesce(email_change_token_new, ''),
  email_change_token_current    = coalesce(email_change_token_current, ''),
  phone_change                  = coalesce(phone_change, ''),
  phone_change_token            = coalesce(phone_change_token, ''),
  reauthentication_token        = coalesce(reauthentication_token, '');

-- Garante senha + e-mail confirmado do admin (caso precise)
update auth.users
  set encrypted_password = crypt('123456', gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
where email = 'admin@cafedofeirantems.com';
