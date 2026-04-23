import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Devuelve la sesión de caja actualmente abierta (o null).
 * Como solo existe una caja física compartida, buscamos la única con closed_at IS NULL.
 */
export async function getOpenSession() {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

/**
 * Devuelve el closing_amount de la última sesión cerrada (para sugerir apertura del día siguiente).
 */
export async function getLastClosingAmount() {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('closing_amount')
    .not('closed_at', 'is', null)
    .order('closed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.closing_amount ?? null;
}

/**
 * Abre una nueva sesión de caja con el monto de apertura.
 * Valida que no exista otra abierta (unicidad por convención).
 */
export async function openCashSession(openingAmount) {
  const existing = await getOpenSession();
  if (existing) return existing; // ya hay una abierta, la reutiliza

  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('cash_sessions')
    .insert({
      opened_by: user?.user?.id || null,
      opening_amount: openingAmount,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Cierra la sesión abierta con el monto que queda físicamente en caja (balance para mañana).
 */
export async function closeCashSession(closingAmount) {
  const open = await getOpenSession();
  if (!open) throw new Error('No hay caja abierta');

  const { data, error } = await supabase
    .from('cash_sessions')
    .update({
      closed_at: new Date().toISOString(),
      closing_amount: closingAmount,
    })
    .eq('id', open.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Hook reactivo para conocer la sesión actual. Refresca en demanda.
 */
export function useCashSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getOpenSession();
      setSession(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { session, loading, reload };
}
