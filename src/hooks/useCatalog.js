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
