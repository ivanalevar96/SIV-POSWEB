import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

// Normaliza fila de DB → shape que usa la UI
function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    desc: row.description || '',
    cat: row.category_id,
    price: row.price,
    stock: row.stock ?? 0,
    tag: row.tag,
    img: row.image_url,
    sizes: row.sizes, // jsonb → array o null
    active: row.active,
  };
}

function mapCategory(row) {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    sort: row.sort,
  };
}

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) setError(error);
    else setProducts((data || []).map(mapProduct));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { products, loading, error, reload: load };
}

/**
 * Inserta un producto nuevo. Devuelve la fila creada.
 * payload = { name, description?, category_id, price?, stock?, tag?, image_url?, sizes? }
 */
export async function createProduct(payload) {
  const clean = {
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    category_id: payload.category_id || null,
    price: payload.price ?? null,
    stock: payload.stock ?? 0,
    tag: payload.tag?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    sizes: payload.sizes && payload.sizes.length ? payload.sizes : null,
    active: true,
  };
  if (!clean.name) throw new Error('El nombre es obligatorio');
  if (!clean.category_id) throw new Error('La categoría es obligatoria');
  if (clean.sizes == null && (clean.price == null || clean.price <= 0)) {
    throw new Error('Ingresa un precio o define tamaños');
  }

  const { data, error } = await supabase
    .from('products')
    .insert(clean)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Actualiza un producto existente. Solo afecta ventas futuras — las filas
 * de sale_items ya registradas mantienen su unit_price / name_snapshot.
 */
export async function updateProduct(id, payload) {
  const clean = {
    name: payload.name?.trim(),
    description: payload.description?.trim() || null,
    category_id: payload.category_id || null,
    price: payload.price ?? null,
    stock: payload.stock ?? 0,
    tag: payload.tag?.trim() || null,
    image_url: payload.image_url?.trim() || null,
    sizes: payload.sizes && payload.sizes.length ? payload.sizes : null,
  };
  if (!clean.name) throw new Error('El nombre es obligatorio');
  if (!clean.category_id) throw new Error('La categoría es obligatoria');
  if (clean.sizes == null && (clean.price == null || clean.price <= 0)) {
    throw new Error('Ingresa un precio o define tamaños');
  }

  const { data, error } = await supabase
    .from('products')
    .update(clean)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Sube un archivo al bucket `product-images` y devuelve la URL pública.
 * El nombre se aleatoriza para evitar colisiones.
 */
export async function uploadProductImage(file) {
  if (!file) throw new Error('Archivo vacío');
  const maxBytes = 5 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error('La imagen supera los 5 MB');
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una imagen');

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (upErr) throw upErr;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Soft-delete: marca el producto como inactivo. No borra filas — así las
 * ventas históricas mantienen su referencia.
 */
export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .update({ active: false })
    .eq('id', id);
  if (error) throw error;
}

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort');
      if (error) setError(error);
      else setCategories((data || []).map(mapCategory));
      setLoading(false);
    })();
  }, []);

  return { categories, loading, error };
}
