-- ============================================================
--  13 PEDIDOS DE EXEMPLO (para testar painel, clientes e relatórios)
--  Cole no SQL Editor do Supabase e clique RUN.
--  Pode rodar quantas vezes quiser: a limpeza abaixo remove os
--  exemplos da rodada anterior (reference_id começa com 'EX-')
--  antes de recriá-los, então nunca dá erro de chave duplicada.
--  Os itens saem junto via "on delete cascade".
-- ============================================================

-- 0) Limpa os exemplos da execução anterior (não toca em pedidos reais)
delete from cafe_diego_orders where reference_id like 'EX-%';

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

-- 4) Maria — 2ª compra (paga), há ~3 dias · São Paulo (com frete)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 3490 + 2500, 2500, 'ship_sedex',
     'Maria Souza', '67999990002', '55566677788', 'maria.exemplo@email.com',
     '{"cep":"01001-000","street":"Praça da Sé","number":"50","district":"Sé","city":"São Paulo"}'::jsonb,
     'EX-MARIA-2', now() - interval '3 days', now() - interval '3 days',
     (now() + interval '2 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Tradicional', 1, 3490 from o;

-- 5) Carlos — pedido PENDENTE (aguardando pagamento), hoje · Campo Grande
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('pending', 5990, 0, 'free',
     'Carlos Pereira', '67999990003', '22233344455', 'carlos.exemplo@email.com',
     '{"cep":"79050-000","street":"Av. Afonso Pena","number":"3500","district":"Centro","city":"Campo Grande"}'::jsonb,
     'EX-CARLOS-1', now() - interval '2 hours', null,
     null)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;

-- 6) Ana — compra grande (paga), há ~15 dias · Campo Grande (frete grátis)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 5990 * 3, 0, 'free',
     'Ana Oliveira', '67999990004', '33344455566', 'ana.exemplo@email.com',
     '{"cep":"79020-000","street":"Rua Dom Aquino","number":"800","district":"Centro","city":"Campo Grande"}'::jsonb,
     'EX-ANA-1', now() - interval '15 days', now() - interval '15 days',
     (now() - interval '13 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 3, 5990 from o;

-- 7) Pedro — entregue, há ~25 dias · Rio de Janeiro (com frete)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('delivered', 9480 + 3200, 3200, 'ship_sedex',
     'Pedro Santos', '67999990005', '44455566677', 'pedro.exemplo@email.com',
     '{"cep":"20040-000","street":"Av. Rio Branco","number":"150","district":"Centro","city":"Rio de Janeiro"}'::jsonb,
     'EX-PEDRO-1', now() - interval '25 days', now() - interval '25 days',
     (now() - interval '20 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o
union all
select id, '100% Arábica · Tradicional', 1, 3490 from o;

-- 8) Ana — 2ª compra (paga), há ~5 dias → previsão de recompra · Campo Grande
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 3490 * 2, 0, 'free',
     'Ana Oliveira', '67999990004', '33344455566', 'ana.exemplo@email.com',
     '{"cep":"79020-000","street":"Rua Dom Aquino","number":"800","district":"Centro","city":"Campo Grande"}'::jsonb,
     'EX-ANA-2', now() - interval '5 days', now() - interval '5 days',
     (now() - interval '3 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Tradicional', 2, 3490 from o;

-- 9) Fernanda — CANCELADO, há ~7 dias · Curitiba
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('canceled', 5990 + 2800, 2800, 'ship_sedex',
     'Fernanda Lima', '67999990006', '55566677799', 'fernanda.exemplo@email.com',
     '{"cep":"80010-000","street":"Rua XV de Novembro","number":"600","district":"Centro","city":"Curitiba"}'::jsonb,
     'EX-FERNANDA-1', now() - interval '7 days', null,
     null)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;

-- 10) Roberto — paga, há ~30 dias · Campo Grande (frete grátis)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 3490, 0, 'free',
     'Roberto Alves', '67999990007', '66677788800', 'roberto.exemplo@email.com',
     '{"cep":"79100-000","street":"Av. Mato Grosso","number":"2200","district":"Cabreúva","city":"Campo Grande"}'::jsonb,
     'EX-ROBERTO-1', now() - interval '30 days', now() - interval '30 days',
     (now() - interval '28 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Tradicional', 1, 3490 from o;

-- 11) Roberto — 2ª compra (paga), há ~8 dias · Campo Grande
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 5990, 0, 'free',
     'Roberto Alves', '67999990007', '66677788800', 'roberto.exemplo@email.com',
     '{"cep":"79100-000","street":"Av. Mato Grosso","number":"2200","district":"Cabreúva","city":"Campo Grande"}'::jsonb,
     'EX-ROBERTO-2', now() - interval '8 days', now() - interval '8 days',
     (now() - interval '6 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;

-- 12) Juliana — pedido PAGO recente, há ~1 dia · Belo Horizonte (com frete)
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 5990 + 2700, 2700, 'ship_sedex',
     'Juliana Costa', '67999990008', '77788899900', 'juliana.exemplo@email.com',
     '{"cep":"30110-000","street":"Av. Afonso Pena","number":"1000","district":"Centro","city":"Belo Horizonte"}'::jsonb,
     'EX-JULIANA-1', now() - interval '1 day', now() - interval '1 day',
     (now() + interval '4 days')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o;

-- 13) João — 3ª compra (paga), há ~2 dias → cliente fiel · Campo Grande
with o as (
  insert into cafe_diego_orders
    (status, total_cents, shipping_cents, shipping_method,
     customer_name, customer_phone, customer_cpf, customer_email,
     address_json, reference_id, created_at, paid_at, delivery_eta)
  values
    ('paid', 5990 + 3490, 0, 'free',
     'João da Silva', '67999990001', '11122233344', 'joao.exemplo@email.com',
     '{"cep":"79002-000","street":"Rua 14 de Julho","number":"1200","district":"Centro","city":"Campo Grande"}'::jsonb,
     'EX-JOAO-3', now() - interval '2 days', now() - interval '2 days',
     (now() + interval '1 day')::date)
  returning id
)
insert into cafe_diego_order_items (order_id, name, qty, unit_price_cents)
select id, '100% Arábica · Em Grãos', 1, 5990 from o
union all
select id, '100% Arábica · Tradicional', 1, 3490 from o;
