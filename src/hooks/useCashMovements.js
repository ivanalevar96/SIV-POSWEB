import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { getOpenSession } from './useCashSession.js';

/**
 * Lista movimientos intradía de una sesión (retiros / ingresos).
 */
export async function getSessionMovements(sessionId) {
  if (!sessionId) return [];
  const { data, error } = await supabase
    .from('cash_movements')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Crea un movimiento en la sesión abierta. type: 'retiro' | 'ingreso'.
 */
export async function createCashMovement({ type, amount, reason, cashier_name }) {
  if (!['retiro', 'ingreso'].includes(type)) throw new Error('Tipo inválido');
  if (!amount || amount <= 0) throw new Error('Monto inválido');

  const open = await getOpenSession();
  if (!open) throw new Error('No hay caja abierta');

  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('cash_movements')
    .insert({
      session_id: open.id,
      type,
      amount,
      reason: reason || null,
      created_by: user?.user?.id || null,
      cashier_name: cashier_name || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Suma efectivo neto aportado por movimientos: +ingresos -retiros.
 */
export function netFromMovements(movements) {
  return (movements || []).reduce((acc, m) => acc + (m.type === 'ingreso' ? m.amount : -m.amount), 0);
}

/**
 * Hook reactivo que carga los movimientos de la sesión actual.
 */
export function useSessionMovements(sessionId) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!sessionId) { setMovements([]); setLoading(false); return; }
    setLoading(true);
    try {
      setMovements(await getSessionMovements(sessionId));
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { reload(); }, [reload]);

  return { movements, loading, error, reload };
}
