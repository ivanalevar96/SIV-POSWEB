import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getOpenSession } from './useCashSession.js';

function mapSale(row) {
  return {
    id: row.code || row.id,
    dbId: row.id,
    time: new Date(row.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    date: new Date(row.created_at),
    method: row.method,
    total: row.total,
    recibido: row.received,
    vuelto: row.change_given,
    cashier: row.cashier_name,
    items: (row.sale_items || []).map(it => ({
      key: it.id,
      id: it.product_id,
      n: it.name_snapshot + (it.size_name ? ` ${it.size_name}` : ''),
      name: it.name_snapshot + (it.size_name ? ` ${it.size_name}` : ''),
      qty: it.qty,
      price: it.unit_price,
    })),
  };
}

export function useSales({ limit = 50 } = {}) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) setError(error);
    else setSales((data || []).map(mapSale));
    setLoading(false);
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { sales, loading, error, reload: load };
}

// Genera código V-NNNN secuencial basado en cuántas ventas hay
async function nextSaleCode() {
  const { count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true });
  const n = (count || 0) + 1;
  return `V-${String(n).padStart(4, '0')}`;
}

/**
 * Inserta una venta + sus items. Devuelve la venta normalizada.
 * payload = { items: [{id, name, qty, price, size_name?}], method, total, recibido?, vuelto?, cashier_name }
 */
export async function createSale(payload) {
  // Validar primero que exista una caja abierta: sin caja no se permite ninguna venta.
  const openSession = await getOpenSession();
  if (!openSession) {
    throw new Error('No hay caja abierta. Abre caja antes de registrar ventas.');
  }

  const code = await nextSaleCode();
  const { data: user } = await supabase.auth.getUser();
  const cashierId = user?.user?.id || null;

  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .insert({
      code,
      session_id: openSession.id,
      cashier_id: cashierId,
      cashier_name: payload.cashier_name,
      method: payload.method,
      total: payload.total,
      received: payload.recibido ?? null,
      change_given: payload.vuelto ?? null,
    })
    .select()
    .single();
  if (saleErr) throw saleErr;

  const items = payload.items.map(it => ({
    sale_id: sale.id,
    product_id: it.id,
    name_snapshot: it.baseName || it.name,
    size_name: it.size_name || null,
    qty: it.qty,
    unit_price: it.price,
  }));

  const { error: itemsErr } = await supabase.from('sale_items').insert(items);
  if (itemsErr) throw itemsErr;

  return { ...sale, code };
}
