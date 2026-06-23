-- ============================================================
--  Bucket de imagens dos produtos (upload direto pelo painel)
--  Cole no SQL Editor do Supabase e clique RUN.
-- ============================================================

-- Cria o bucket "produtos" (público para leitura na loja)
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do update set public = true;

-- Leitura pública das imagens
drop policy if exists "produtos_public_read" on storage.objects;
create policy "produtos_public_read" on storage.objects
  for select using (bucket_id = 'produtos');

-- Observação: o upload é feito pelo servidor com a service-role key
-- (server action saveProduct), que ignora RLS — não é preciso policy
-- de insert para o painel funcionar.
