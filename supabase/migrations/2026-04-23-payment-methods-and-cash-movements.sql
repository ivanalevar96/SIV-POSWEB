-- ============================================================
-- Migración: métodos de pago ampliados + movimientos intradía
-- Fecha: 2026-04-23
-- Seguro para ejecutar en DB con datos reales.
-- ============================================================

-- 1. Ampliar métodos de pago de sales
--    Antes: ('efectivo','tarjeta')
--    Ahora: ('efectivo','debito','credito','transferencia','tarjeta'*)
--    *'tarjeta' se mantiene por compatibilidad con ventas históricas.
alter table sales drop constraint if exists sales_method_check;
alter table sales
  add constraint sales_method_check
  check (method in ('efectivo','debito','credito','transferencia','tarjeta'));

-- 2. Tabla de movimientos intradía
create table if not exists cash_movements (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references cash_sessions(id) on delete cascade,
  type         text check (type in ('retiro','ingreso')) not null,
  amount       integer not null check (amount > 0),
  reason       text,
  created_by   uuid references auth.users(id),
  cashier_name text,
  created_at   timestamptz default now()
);

create index if not exists idx_cash_mov_session on cash_movements(session_id);
create index if not exists idx_cash_mov_created on cash_movements(created_at desc);

alter table cash_movements enable row level security;

drop policy if exists "cash_mov read"   on cash_movements;
drop policy if exists "cash_mov insert" on cash_movements;
drop policy if exists "cash_mov update" on cash_movements;
drop policy if exists "cash_mov delete" on cash_movements;

create policy "cash_mov read"   on cash_movements for select using (auth.role() = 'authenticated');
create policy "cash_mov insert" on cash_movements for insert with check (auth.role() = 'authenticated');
create policy "cash_mov update" on cash_movements for update using (public.is_admin());
create policy "cash_mov delete" on cash_movements for delete using (public.is_admin());
