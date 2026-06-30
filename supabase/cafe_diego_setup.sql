-- ============================================================
--  Café do Feirante MS — Setup completo (Supabase / Postgres)
--  Cole tudo no SQL Editor do Supabase e clique RUN.
--  Tabelas prefixadas com cafe_diego_.
--  Controle de estoque inspirado no Kontro: estoque em tempo real,
--  alerta de estoque baixo e histórico de movimentações.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- Produtos
-- ------------------------------------------------------------
create table if not exists cafe_diego_products (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null,
  name        text not null,
  line        text not null default '',
  type        text not null check (type in ('grao','moido')),
  weight_g    int  not null default 1000,
  price_cents int  not null default 0,
  cost_cents  int  not null default 0,        -- custo (p/ margem, estilo Kontro)
  description text not null default '',
  intensity   int  not null default 3,
  acidity     int  not null default 3,
  body        int  not null default 3,
  image_url   text not null default '',
  images      text[] not null default '{}',     -- galeria de fotos extras
  accent      text not null default 'wine',
  stock       int  not null default 0,        -- estoque atual
  low_stock   int  not null default 5,        -- alerta de estoque baixo
  active      boolean not null default true,
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Movimentações de estoque (entradas/saídas) — auditoria
-- ------------------------------------------------------------
create table if not exists cafe_diego_stock_movements (
  id         uuid primary key default uuid_generate_v4(),
  product_id uuid references cafe_diego_products(id) on delete cascade,
  delta      int not null,                    -- +entrada / -saída
  reason     text not null default 'ajuste',  -- 'entrada','venda','ajuste','perda'
  note       text default '',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Clientes (1:1 com auth.users) e endereços
-- ------------------------------------------------------------
create table if not exists cafe_diego_customers (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default '',
  phone      text not null default '',
  cpf        text not null default '',
  email      text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists cafe_diego_addresses (
  id          uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references cafe_diego_customers(id) on delete cascade,
  cep         text not null,
  street      text not null,
  number      text not null,
  complement  text default '',
  district    text not null,
  city        text not null default 'Campo Grande',
  reference   text default '',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Pedidos
-- ------------------------------------------------------------
create table if not exists cafe_diego_orders (
  id             uuid primary key default uuid_generate_v4(),
  customer_id    uuid references cafe_diego_customers(id) on delete set null,
  status         text not null default 'pending'
                 check (status in ('pending','paid','canceled','delivered')),
  total_cents    int not null default 0,
  payment_ref    text,
  reference_id   text unique,
  payment_method text,
  payment_url    text,
  customer_name  text not null default '',
  customer_phone text not null default '',
  customer_cpf   text not null default '',
  customer_email text not null default '',
  address_json   jsonb,
  shipping_cents int not null default 0,
  shipping_method text,
  delivery_eta   date,
  created_at     timestamptz not null default now(),
  paid_at        timestamptz
);

create table if not exists cafe_diego_order_items (
  id               uuid primary key default uuid_generate_v4(),
  order_id         uuid not null references cafe_diego_orders(id) on delete cascade,
  product_id       uuid references cafe_diego_products(id) on delete set null,
  name             text not null,
  qty              int not null,
  unit_price_cents int not null
);

-- ------------------------------------------------------------
-- Configurações e admins
-- ------------------------------------------------------------
create table if not exists cafe_diego_settings (
  key   text primary key,
  value text not null
);

insert into cafe_diego_settings (key, value) values
  ('delivery_fee', '15,00'),
  ('whatsapp', '5567992220619'),
  ('fee_pix_pct', '0'),
  ('fee_credit_pct', '0'),
  ('fee_debit_pct', '0')
on conflict (key) do nothing;

create table if not exists cafe_diego_admins (
  email text primary key
);

-- >>> Cadastre AQUI o seu e-mail de administrador <<<
-- insert into cafe_diego_admins (email) values ('morais2730@gmail.com');

create or replace function cafe_diego_is_admin() returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from cafe_diego_admins a
    where a.email = (auth.jwt() ->> 'email')
  );
$$;

-- ------------------------------------------------------------
-- Baixa de estoque automática quando o pedido é pago
-- ------------------------------------------------------------
create or replace function cafe_diego_apply_stock_on_paid()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'paid' and (old.status is distinct from 'paid') then
    update cafe_diego_products p
      set stock = p.stock - oi.qty
      from cafe_diego_order_items oi
      where oi.order_id = new.id and oi.product_id = p.id;

    insert into cafe_diego_stock_movements (product_id, delta, reason, note)
      select oi.product_id, -oi.qty, 'venda', 'Pedido ' || left(new.id::text,8)
      from cafe_diego_order_items oi where oi.order_id = new.id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_cafe_diego_stock on cafe_diego_orders;
create trigger trg_cafe_diego_stock
  after update on cafe_diego_orders
  for each row execute function cafe_diego_apply_stock_on_paid();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table cafe_diego_admins          enable row level security;
create policy cd_admins_self on cafe_diego_admins for select
  using (email = (auth.jwt() ->> 'email'));

alter table cafe_diego_products         enable row level security;
create policy cd_products_read  on cafe_diego_products for select
  using (active or cafe_diego_is_admin());
create policy cd_products_admin on cafe_diego_products for all
  using (cafe_diego_is_admin()) with check (cafe_diego_is_admin());

alter table cafe_diego_stock_movements  enable row level security;
create policy cd_stock_admin on cafe_diego_stock_movements for all
  using (cafe_diego_is_admin()) with check (cafe_diego_is_admin());

alter table cafe_diego_settings         enable row level security;
create policy cd_settings_read  on cafe_diego_settings for select using (true);
create policy cd_settings_admin on cafe_diego_settings for all
  using (cafe_diego_is_admin()) with check (cafe_diego_is_admin());

alter table cafe_diego_customers        enable row level security;
create policy cd_customers_self on cafe_diego_customers for all
  using (id = auth.uid() or cafe_diego_is_admin())
  with check (id = auth.uid() or cafe_diego_is_admin());

alter table cafe_diego_addresses        enable row level security;
create policy cd_addresses_self on cafe_diego_addresses for all
  using (customer_id = auth.uid() or cafe_diego_is_admin())
  with check (customer_id = auth.uid() or cafe_diego_is_admin());

alter table cafe_diego_orders           enable row level security;
create policy cd_orders_self  on cafe_diego_orders for select
  using (customer_id = auth.uid() or cafe_diego_is_admin());
create policy cd_orders_admin on cafe_diego_orders for all
  using (cafe_diego_is_admin()) with check (cafe_diego_is_admin());

alter table cafe_diego_order_items      enable row level security;
create policy cd_items_self on cafe_diego_order_items for select
  using (exists (select 1 from cafe_diego_orders o where o.id = order_id
                 and (o.customer_id = auth.uid() or cafe_diego_is_admin())));
create policy cd_items_admin on cafe_diego_order_items for all
  using (cafe_diego_is_admin()) with check (cafe_diego_is_admin());

-- ============================================================
--  SEED — produtos iniciais (ajuste preços/estoque depois no painel)
-- ============================================================
insert into cafe_diego_products
  (slug, name, line, type, weight_g, price_cents, description, intensity, acidity, body, image_url, accent, stock, low_stock, sort)
values
  ('100-arabica-graos-1kg', '100% Arábica · Em Grãos', 'Oeste Paulista', 'grao', 1000, 5990,
   'Café espresso torrado em grãos, torra média. Encorpado, doçura de caramelo e final prolongado — ideal para quem moe na hora.',
   4, 3, 4, '/produtos/vermelho.jpg', 'wine', 20, 5, 1),
  ('100-arabica-tradicional-moido-500g', '100% Arábica · Tradicional', 'Torrado e Moído', 'moido', 500, 3490,
   'Café torrado e moído na medida certa para o dia a dia. Aroma intenso, corpo aveludado e aquele sabor de café de feirante de verdade.',
   3, 2, 4, '/produtos/dourado.jpg', 'gold', 20, 5, 2)
on conflict (slug) do nothing;
