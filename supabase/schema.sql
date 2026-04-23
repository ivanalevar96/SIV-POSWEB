-- ============================================================
-- SVI POS — Schema + Seed
-- Pegar TODO este archivo en el SQL Editor de Supabase y ejecutar.
-- Seguro de re-ejecutar (idempotente) mientras no tengas datos reales.
-- ============================================================

-- -----------------------------------------------------------
-- 0. Limpieza (opcional — comentar si ya tienes data real)
-- -----------------------------------------------------------
drop table if exists cash_movements cascade;
drop table if exists sale_items   cascade;
drop table if exists sales        cascade;
drop table if exists cash_sessions cascade;
drop table if exists products     cascade;
drop table if exists categories   cascade;
drop table if exists profiles     cascade;

-- -----------------------------------------------------------
-- 1. Tablas
-- -----------------------------------------------------------

-- Perfiles (extiende auth.users con rol + nombre)
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  role       text check (role in ('admin','cajero')) default 'cajero',
  created_at timestamptz default now()
);

-- Categorías
create table categories (
  id    text primary key,
  name  text not null,
  emoji text,
  color text,
  sort  int default 0
);

-- Productos
create table products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  category_id text references categories(id),
  price       integer,              -- null cuando usa sizes
  stock       integer default 0,
  tag         text,                 -- "Más pedido", "Picante", "+18"...
  image_url   text,
  sizes       jsonb,                -- [{"name":"Chica","price":2000}]
  active      boolean default true,
  created_at  timestamptz default now()
);

-- Sesión de caja
create table cash_sessions (
  id              uuid primary key default gen_random_uuid(),
  opened_by       uuid references auth.users(id),
  opening_amount  integer not null,
  opened_at       timestamptz default now(),
  closed_at       timestamptz,
  closing_amount  integer
);

-- Ventas (cabecera)
create table sales (
  id            uuid primary key default gen_random_uuid(),
  code          text unique,                          -- V-0247
  session_id    uuid references cash_sessions(id),
  cashier_id    uuid references auth.users(id),
  cashier_name  text,                                 -- snapshot por si cambia el user
  method        text check (method in ('efectivo','debito','credito','transferencia','tarjeta')) not null,
  total         integer not null,
  received      integer,
  change_given  integer,
  created_at    timestamptz default now()
);

-- Items de cada venta
create table sale_items (
  id             uuid primary key default gen_random_uuid(),
  sale_id        uuid references sales(id) on delete cascade,
  product_id     uuid references products(id),
  name_snapshot  text not null,
  size_name      text,
  qty            integer not null,
  unit_price     integer not null
);

-- Movimientos intradía de caja (retiros / ingresos externos)
create table cash_movements (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references cash_sessions(id) on delete cascade,
  type         text check (type in ('retiro','ingreso')) not null,
  amount       integer not null check (amount > 0),
  reason       text,
  created_by   uuid references auth.users(id),
  cashier_name text,
  created_at   timestamptz default now()
);

-- Índices útiles
create index idx_products_category   on products(category_id) where active = true;
create index idx_sales_created       on sales(created_at desc);
create index idx_sale_items_sale     on sale_items(sale_id);
create index idx_cash_mov_session    on cash_movements(session_id);
create index idx_cash_mov_created    on cash_movements(created_at desc);

-- -----------------------------------------------------------
-- 2. Trigger: auto-crear profile al registrarse
-- -----------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)), 'cajero');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------
-- 3. Row Level Security
-- -----------------------------------------------------------
alter table profiles       enable row level security;
alter table categories     enable row level security;
alter table products       enable row level security;
alter table cash_sessions  enable row level security;
alter table sales          enable row level security;
alter table sale_items     enable row level security;
alter table cash_movements enable row level security;

-- Helper: ¿es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: cada uno ve/edita su perfil; admin ve todo
create policy "profiles: self read"   on profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles: self update" on profiles for update using (auth.uid() = id);

-- categories / products: lectura para autenticados
create policy "categories read" on categories for select using (auth.role() = 'authenticated');
create policy "products read"   on products   for select using (auth.role() = 'authenticated');
-- Solo admin puede modificar catálogo
create policy "categories admin write" on categories for all using (public.is_admin()) with check (public.is_admin());
create policy "products admin write"   on products   for all using (public.is_admin()) with check (public.is_admin());

-- cash_sessions: autenticados leen, autenticados abren sesión propia, admin cierra cualquiera
create policy "sessions read"   on cash_sessions for select using (auth.role() = 'authenticated');
create policy "sessions insert" on cash_sessions for insert with check (auth.uid() = opened_by);
create policy "sessions update" on cash_sessions for update using (public.is_admin() or opened_by = auth.uid());

-- sales / sale_items: autenticados leen e insertan
create policy "sales read"   on sales      for select using (auth.role() = 'authenticated');
create policy "sales insert" on sales      for insert with check (auth.role() = 'authenticated');
create policy "items read"   on sale_items for select using (auth.role() = 'authenticated');
create policy "items insert" on sale_items for insert with check (auth.role() = 'authenticated');

-- cash_movements: autenticados leen e insertan; solo admin puede borrar/editar
create policy "cash_mov read"   on cash_movements for select using (auth.role() = 'authenticated');
create policy "cash_mov insert" on cash_movements for insert with check (auth.role() = 'authenticated');
create policy "cash_mov update" on cash_movements for update using (public.is_admin());
create policy "cash_mov delete" on cash_movements for delete using (public.is_admin());

-- ============================================================
-- 4. SEED DATA (categorías + productos con las mismas URLs de Unsplash)
-- ============================================================

insert into categories (id, name, emoji, color, sort) values
  ('completos', 'Completos', '🌭', 'tomato',  1),
  ('papas',     'Papas',     '🍟', 'mustard', 2),
  ('bebidas',   'Bebidas',   '🥤', 'pickle',  3),
  ('extras',    'Extras',    '✨', 'mustard', 4);

insert into products (name, description, category_id, price, stock, tag, image_url, sizes) values
  ('Completo Italiano',  'Palta, tomate, mayo casera',                'completos', 3500, 42, 'Más pedido',
   'https://images.unsplash.com/photo-1619740455993-9e612b1af08a?auto=format&fit=crop&w=500&q=75', null),

  ('Completo Dinámico',  'Palta, tomate, mayo, chucrut',              'completos', 3800, 38, null,
   'https://images.unsplash.com/photo-1612392062798-2ea0aea3bff0?auto=format&fit=crop&w=500&q=75', null),

  ('As Chacarero',       'Carne, tomate, poroto verde, ají verde',    'completos', 4900, 25, 'Picante',
   'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=75', null),

  ('Vienesa XL',         'Vienesa premium, pan artesanal',            'completos', 2900, 60, null,
   'https://images.unsplash.com/photo-1612392061787-2d078b3e573b?auto=format&fit=crop&w=500&q=75', null),

  ('Papas Fritas',       'Corte grueso, crujientes',                  'papas',     null, 80, null,
   'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=75',
   '[{"name":"Chica","price":2000},{"name":"Mediana","price":3000},{"name":"Grande","price":4000}]'::jsonb),

  ('Papas Bravas',       'Con mayo picante y queso',                  'papas',     null, 45, null,
   'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=500&q=75',
   '[{"name":"Mediana","price":3800},{"name":"Grande","price":4800}]'::jsonb),

  ('Anillos de Cebolla', 'Apanados, 8 unidades',                      'papas',     3200, 30, null,
   'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=500&q=75', null),

  ('Bebida en Lata',     'Coca, Sprite, Fanta',                       'bebidas',   1500, 120, null,
   'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=500&q=75', null),

  ('Jugo Natural',       'Frambuesa, piña, naranja',                  'bebidas',   null, 50, null,
   'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=75',
   '[{"name":"Vaso","price":1800},{"name":"Jarra","price":4500}]'::jsonb),

  ('Agua Mineral',       'Con/sin gas',                               'bebidas',   1200, 80, null,
   'https://images.unsplash.com/photo-1560526860-1f0e56046c85?auto=format&fit=crop&w=500&q=75', null),

  ('Cerveza Artesanal',  'Rubia, negra, IPA',                         'bebidas',   3500, 24, '+18',
   'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=500&q=75', null),

  ('Salsa Extra',        'Ají, mayo, ketchup, mostaza',               'extras',     500, 200, null,
   'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=500&q=75', null);

-- ============================================================
-- 5. Verificación rápida
-- ============================================================
-- select c.name as categoria, count(p.id) as productos
-- from categories c left join products p on p.category_id = c.id
-- group by c.name order by c.name;
