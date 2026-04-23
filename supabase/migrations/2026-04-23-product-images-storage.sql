-- Storage bucket para imágenes de productos.
-- Lectura pública, escritura solo admins (consistente con RLS de products).

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Limpiar políticas previas si se re-ejecuta
drop policy if exists "product-images public read"     on storage.objects;
drop policy if exists "product-images admin insert"    on storage.objects;
drop policy if exists "product-images admin update"    on storage.objects;
drop policy if exists "product-images admin delete"    on storage.objects;

create policy "product-images public read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product-images admin insert"
on storage.objects for insert
with check (bucket_id = 'product-images' and public.is_admin());

create policy "product-images admin update"
on storage.objects for update
using (bucket_id = 'product-images' and public.is_admin());

create policy "product-images admin delete"
on storage.objects for delete
using (bucket_id = 'product-images' and public.is_admin());
