-- ============================================================
--  3 PEDIDOS DE EXEMPLO (para testar painel, clientes e relatórios)
--  Cole no SQL Editor do Supabase e clique RUN.
--  Pode rodar mais de uma vez (cada execução cria novos exemplos).
-- ============================================================

-- 1) João — 1ª compra (paga), há ~40 dias · Campo Grande (frete grátis)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 5990, 0, 'free',
     'João da Silva', '67999990001', '11122233344', 'joao.exemplo@email.com',
     '{"cep":"79002-000","street":"Rua 14 de Julho","number":"1200","district":"Centro","city":"Campo Grande","reference":"perto da praça"}'::jsonb,
     'EX-JOAO-1', now() - interval '40 days', now() - interval '40 days',
     (now() - interval '38 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;

-- 2) João — 2ª compra (paga), há ~20 dias  → gera a previsão de próxima compra
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 9480, 0, 'free',
     'João da Silva', '67999990001', '11122233344', 'joao.exemplo@email.com',
     '{"cep":"79002-000","street":"Rua 14 de Julho","number":"1200","district":"Centro","city":"Campo Grande"}'::jsonb,
     'EX-JOAO-2', now() - interval '20 days', now() - interval '20 days',
     (now() - interval '18 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o
union all
select id, '100% Arábica · Tradicional', 1, 3490 from o;

-- 3) Maria — fora de Campo Grande, com frete, já ENTREGUE (há ~10 dias)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('delivered', 5990 + 2500, 2500, 'ship_sedex',
     'Maria Souza', '67999990002', '55566677788', 'maria.exemplo@email.com',
     '{"cep":"01001-000","street":"Praça da Sé","number":"50","district":"Sé","city":"São Paulo"}'::jsonb,
     'EX-MARIA-1', now() - interval '10 days', now() - interval '10 days',
     (now() - interval '6 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;
