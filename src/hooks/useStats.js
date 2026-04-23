import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Devuelve rango [start, end) para el periodo actual y anterior
function periodRange(now, period, customRange) {
  let start, end, prevStart, prevEnd, bucketDays, bucketLabels;

  if (period === 'dia') {
    end = new Date(now); end.setHours(23, 59, 59, 999);
    start = new Date(now); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
    bucketDays = null;
  } else if (period === 'semana') {
    end = new Date(now); end.setHours(23, 59, 59, 999);
    start = new Date(now); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
    bucketDays = 7;
    bucketLabels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  } else if (period === 'mes_calendario') {
    end = new Date(now); end.setHours(23, 59, 59, 999);
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    bucketDays = now.getDate();
  } else if (period === 'personalizado') {
    if (!customRange?.from || !customRange?.to) return null;
    let from = new Date(`${customRange.from}T00:00:00`);
    let to = new Date(`${customRange.to}T23:59:59.999`);
    if (to < from) { const t = from; from = new Date(customRange.to + 'T00:00:00'); to = new Date(customRange.from + 'T23:59:59.999'); }
    start = from; end = to;
    const lengthMs = end - start;
    prevEnd = new Date(start);
    prevStart = new Date(start.getTime() - lengthMs);
    bucketDays = Math.max(1, Math.ceil(lengthMs / 86400000));
  } else {
    return null;
  }

  return { start, end, prevStart, prevEnd, bucketDays, bucketLabels };
}

function pct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

// Normaliza métodos legacy: 'tarjeta' → 'debito' a efectos de agregación visual.
// (Ventas antiguas quedan en 'tarjeta'; las nuevas usan débito/crédito/transferencia.)
const METHOD_KEYS = ['efectivo', 'debito', 'credito', 'transferencia'];

function breakdownByMethod(rows) {
  const out = Object.fromEntries(METHOD_KEYS.map(k => [k, 0]));
  out.tarjeta = 0; // legacy bucket
  rows.forEach(s => {
    const m = s.method;
    if (out[m] != null) out[m] += s.total || 0;
    else out[m] = s.total || 0;
  });
  return out;
}

export function useStats(period = 'semana', customRange = null) {
  const fromKey = customRange?.from || '';
  const toKey = customRange?.to || '';
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        const now = new Date();
        const range = periodRange(now, period, { from: fromKey, to: toKey });
        if (!range) {
          setState({ loading: false, error: null, revenue: 0, count: 0, avgTicket: 0, itemsSold: 0,
            byMethod: {}, prevByMethod: {}, series: [], topProducts: [], byCategory: [] });
          return;
        }
        const { start, end, prevStart, bucketDays, bucketLabels } = range;

        // Traer ventas con items + category vía products, desde prevStart hasta end
        const [{ data: sales, error: salesErr }, { data: cats, error: catsErr }] = await Promise.all([
          supabase
            .from('sales')
            .select('created_at, total, method, sale_items(name_snapshot, qty, unit_price, products(category_id))')
            .gte('created_at', prevStart.toISOString())
            .lte('created_at', end.toISOString())
            .order('created_at', { ascending: true }),
          supabase.from('categories').select('id, name'),
        ]);
        if (salesErr) throw salesErr;
        if (catsErr) throw catsErr;
        if (cancelled) return;

        const catName = Object.fromEntries((cats || []).map(c => [c.id, c.name]));

        const current = (sales || []).filter(s => new Date(s.created_at) >= start);
        const previous = (sales || []).filter(s => new Date(s.created_at) < start);

        // KPIs actuales vs anterior
        const revenue = current.reduce((a, s) => a + (s.total || 0), 0);
        const prevRevenue = previous.reduce((a, s) => a + (s.total || 0), 0);
        const count = current.length;
        const prevCount = previous.length;
        const avgTicket = count ? revenue / count : 0;
        const prevAvg = prevCount ? prevRevenue / prevCount : 0;
        const itemsSold = current.reduce((a, s) => a + (s.sale_items || []).reduce((b, it) => b + it.qty, 0), 0);
        const prevItemsSold = previous.reduce((a, s) => a + (s.sale_items || []).reduce((b, it) => b + it.qty, 0), 0);

        // Desglose por método (actual + anterior)
        const byMethod = breakdownByMethod(current);
        const prevByMethod = breakdownByMethod(previous);

        // Serie temporal para comparativo
        let series;
        if (period === 'dia') {
          // Por hora 0–23
          const curByHour = Array(24).fill(0);
          const prevByHour = Array(24).fill(0);
          current.forEach(s => { curByHour[new Date(s.created_at).getHours()] += s.total; });
          previous.forEach(s => { prevByHour[new Date(s.created_at).getHours()] += s.total; });
          series = curByHour.map((v, h) => ({ d: String(h).padStart(2,'0'), esta: v, pasada: prevByHour[h] }));
        } else {
          // Por día
          const len = Math.max(bucketDays, 1);
          const curByDay = Array(len).fill(0);
          const prevByDay = Array(len).fill(0);
          current.forEach(s => {
            const d = new Date(s.created_at);
            const diff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < len) curByDay[diff] += s.total;
          });
          previous.forEach(s => {
            const d = new Date(s.created_at);
            const diff = Math.floor((d - prevStart) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < len) prevByDay[diff] += s.total;
          });
          series = curByDay.map((v, i) => {
            const date = new Date(start); date.setDate(date.getDate() + i);
            const label = bucketLabels?.[i] || `${date.getDate()}/${date.getMonth()+1}`;
            return { d: label, esta: v, pasada: prevByDay[i] };
          });
        }

        // Top productos
        const byProduct = {};
        current.forEach(s => (s.sale_items || []).forEach(it => {
          const key = it.name_snapshot;
          if (!byProduct[key]) byProduct[key] = { name: key, count: 0, revenue: 0 };
          byProduct[key].count += it.qty;
          byProduct[key].revenue += it.qty * it.unit_price;
        }));
        const topProducts = Object.values(byProduct).sort((a,b)=>b.count-a.count).slice(0,6);

        // Por categoría
        const byCategory = {};
        current.forEach(s => (s.sale_items || []).forEach(it => {
          const catId = it.products?.category_id || 'otros';
          const name = catName[catId] || 'Otros';
          if (!byCategory[catId]) byCategory[catId] = { id: catId, name, value: 0 };
          byCategory[catId].value += it.qty * it.unit_price;
        }));
        const categoryList = Object.values(byCategory).sort((a,b)=>b.value-a.value);

        setState({
          loading: false,
          error: null,
          revenue, prevRevenue, revenueDelta: pct(revenue, prevRevenue),
          count, prevCount, countDelta: pct(count, prevCount),
          avgTicket, prevAvg, avgDelta: pct(avgTicket, prevAvg),
          itemsSold, prevItemsSold, itemsDelta: pct(itemsSold, prevItemsSold),
          byMethod, prevByMethod,
          series,
          topProducts,
          byCategory: categoryList,
        });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err });
      }
    })();
    return () => { cancelled = true; };
  }, [period, fromKey, toKey]);

  return state;
}
