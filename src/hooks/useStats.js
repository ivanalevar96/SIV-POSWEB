import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';

// Devuelve rango [start, end) para el periodo actual y anterior
function periodRange(now, period) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start, prevStart, prevEnd, bucketDays, bucketLabels;

  if (period === 'dia') {
    start = new Date(now); start.setHours(0, 0, 0, 0);
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 1);
    // Para gráfico diario: comparar por hora (24 buckets)
    bucketDays = null;
  } else if (period === 'semana') {
    start = new Date(now); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6); // últimos 7 días incluyendo hoy
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 7);
    bucketDays = 7;
    bucketLabels = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  } else { // mes
    start = new Date(now); start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29); // últimos 30 días
    prevEnd = new Date(start);
    prevStart = new Date(start); prevStart.setDate(prevStart.getDate() - 30);
    bucketDays = 30;
  }

  return { start, end, prevStart, prevEnd, bucketDays, bucketLabels };
}

function pct(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

export function useStats(period = 'semana') {
  const [state, setState] = useState({ loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true }));
      try {
        const now = new Date();
        const { start, end, prevStart, bucketDays, bucketLabels } = periodRange(now, period);

        // Traer ventas con items + category vía products, desde prevStart hasta end
        const [{ data: sales, error: salesErr }, { data: cats, error: catsErr }] = await Promise.all([
          supabase
            .from('sales')
            .select('created_at, total, sale_items(name_snapshot, qty, unit_price, products(category_id))')
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
          const curByDay = Array(bucketDays).fill(0);
          const prevByDay = Array(bucketDays).fill(0);
          current.forEach(s => {
            const d = new Date(s.created_at);
            const diff = Math.floor((d - start) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < bucketDays) curByDay[diff] += s.total;
          });
          previous.forEach(s => {
            const d = new Date(s.created_at);
            const diff = Math.floor((d - prevStart) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < bucketDays) prevByDay[diff] += s.total;
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
          series,
          topProducts,
          byCategory: categoryList,
        });
      } catch (err) {
        if (!cancelled) setState({ loading: false, error: err });
      }
    })();
    return () => { cancelled = true; };
  }, [period]);

  return state;
}
