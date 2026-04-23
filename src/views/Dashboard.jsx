import { useMemo } from 'react';
import { I } from '../icons.jsx';
import { Card, Button, Segmented, BarChart, Donut } from '../ui.jsx';
import { fmtCLP, methodLabel } from '../data.js';
import { useSales } from '../hooks/useSales.js';
import { useCashSession } from '../hooks/useCashSession.js';
import { useSessionMovements, netFromMovements } from '../hooks/useCashMovements.js';

const HOURS = ['11','12','13','14','15','16','17','18','19','20','21','22'];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

const METHOD_STYLE = {
  efectivo:      { color: 'oklch(0.82 0.17 85)',  dot: 'var(--mustard)',  bg: 'oklch(0.96 0.07 85)' },
  debito:        { color: 'oklch(0.63 0.22 25)',  dot: 'var(--tomato)',   bg: 'oklch(0.95 0.08 25)' },
  credito:       { color: 'oklch(0.68 0.15 145)', dot: 'var(--pickle)',   bg: 'oklch(0.94 0.08 145)' },
  transferencia: { color: 'oklch(0.4 0.03 60)',   dot: 'var(--ink)',      bg: 'oklch(0.9 0.01 60)' },
  tarjeta:       { color: 'oklch(0.63 0.22 25)',  dot: 'var(--tomato)',   bg: 'oklch(0.95 0.08 25)' },
};

export default function Dashboard({ state, onGo }) {
  const { openingAmount } = state.summary;
  const { sales: allSales, loading } = useSales({ limit: 500 });
  const { session } = useCashSession();
  const { movements } = useSessionMovements(session?.id);
  const netMovements = netFromMovements(movements);

  const metrics = useMemo(() => {
    const today = new Date();
    const todaySales = allSales.filter(s => s.date && isSameDay(s.date, today));

    const byMethod = {};
    todaySales.forEach(s => {
      byMethod[s.method] = (byMethod[s.method] || 0) + (s.total || 0);
    });
    const cashSales = byMethod['efectivo'] || 0;

    // Ventas por hora (transacciones, no monto)
    const byHour = HOURS.map(h => ({ l: h, v: 0 }));
    todaySales.forEach(s => {
      const hh = String(s.date.getHours()).padStart(2, '0');
      const idx = HOURS.indexOf(hh);
      if (idx >= 0) byHour[idx].v += 1;
    });

    const peak = byHour.reduce((a, b) => (b.v > a.v ? b : a), { l: '—', v: 0 });
    const totalRevenue = todaySales.reduce((a, s) => a + (s.total || 0), 0);
    const avgTicket = todaySales.length > 0 ? totalRevenue / todaySales.length : 0;
    const activeHours = byHour.filter(h => h.v > 0).length;
    const flowPerHour = activeHours > 0 ? todaySales.length / activeHours : 0;

    return {
      todayCount: todaySales.length,
      byMethod,
      cashSales,
      totalRevenue,
      byHour,
      peak,
      avgTicket,
      flowPerHour,
      recent: todaySales.slice(0, 6),
    };
  }, [allSales]);

  // Efectivo físico esperado en caja = apertura + ventas efectivo + movimientos netos
  const total = openingAmount + metrics.cashSales + netMovements;
  const payTotal = metrics.totalRevenue;
  const methodEntries = ['efectivo','debito','credito','transferencia','tarjeta']
    .filter(k => (metrics.byMethod[k] || 0) > 0)
    .map(k => ({ id: k, value: metrics.byMethod[k] || 0 }));

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5 pb-28 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>{new Date().toLocaleDateString('es-CL',{weekday:'long', day:'numeric', month:'long'})}</div>
          <div className="font-display font-bold text-2xl md:text-3xl">Buenas, {state.user.first} 👋</div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" size="sm"><I.download size={16}/> Reporte</Button>
          <Button variant="dark" size="sm" onClick={()=>onGo('pos')}><I.plus size={16}/> Nueva venta</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 p-5 overflow-hidden relative" style={{background:'var(--ink)', color:'white'}}>
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{background:'var(--mustard)', opacity:0.9}}/>
          <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full" style={{background:'var(--tomato)'}}/>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60">Balance de caja</div>
              <div className="text-xs font-mono flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-[color:var(--pickle)] animate-pulse"/>en vivo</div>
            </div>
            <div className="mt-3 font-display font-bold text-4xl md:text-5xl tabnum">{fmtCLP(total)}</div>
            <div className="mt-1 text-white/60 text-sm">Efectivo estimado en caja</div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="Apertura" value={fmtCLP(openingAmount)} dark/>
              <Stat label="Ventas total" value={fmtCLP(metrics.totalRevenue)} dark accent="mustard"/>
              <Stat
                label="Movimientos netos"
                value={`${netMovements>=0?'+':''}${fmtCLP(netMovements)}`}
                dark
                accent={netMovements >= 0 ? 'pickle' : 'tomato'}/>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{color:'var(--ink-mute)'}}>Ventas hoy</div>
              <div className="font-display font-bold text-4xl tabnum mt-1">{metrics.todayCount}</div>
              <div className="text-xs mt-1" style={{color:'var(--ink-mute)'}}>
                {loading ? 'Cargando…' : (metrics.todayCount === 0 ? 'Sin ventas aún' : `${fmtCLP(payTotal)} vendidos`)}
              </div>
            </div>
            <Donut
              size={110} thick={16}
              segments={payTotal > 0
                ? methodEntries.map(e => ({ value: e.value, color: METHOD_STYLE[e.id]?.color || 'oklch(0.6 0 0)' }))
                : [{ value: 1, color: 'oklch(0.92 0 0)' }]}
              label={fmtCLP(payTotal)}
              sub="ventas"
            />
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 space-y-1">
            {methodEntries.length === 0 && (
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>Sin ventas aún</div>
            )}
            {methodEntries.map(e => {
              const p = payTotal > 0 ? Math.round(e.value / payTotal * 100) : 0;
              return (
                <div key={e.id} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{background: METHOD_STYLE[e.id]?.dot || 'var(--ink)'}}/>
                    {methodLabel(e.id)}
                  </span>
                  <span className="tabnum">{fmtCLP(e.value)} · {p}%</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-bold text-lg">Ventas por hora</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>Hoy · transacciones</div>
            </div>
            <Segmented
              value="hoy"
              onChange={()=>{}}
              options={[
                { value: 'hoy', label: 'Hoy' },
                { value: 'ayer', label: 'Ayer' },
                { value: '7d', label: '7d' },
              ]}
            />
          </div>
          <BarChart data={metrics.byHour} valueKey="v" labelKey="l" height={180} color="oklch(0.82 0.17 85)"/>
          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-3 gap-4">
            <MiniStat label="Hora peak" value={metrics.peak.v > 0 ? `${metrics.peak.l}:00` : '—'} sub={metrics.peak.v > 0 ? `${metrics.peak.v} ventas` : 'sin datos'}/>
            <MiniStat label="Ticket prom." value={fmtCLP(metrics.avgTicket)} sub={metrics.todayCount > 0 ? `${metrics.todayCount} ventas` : '—'}/>
            <MiniStat label="Flujo/hora" value={metrics.flowPerHour.toFixed(1)} sub="ventas/h"/>
          </div>
        </Card>

        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-bold text-lg">Últimas ventas</div>
            <button onClick={()=>onGo('historial')} className="text-xs font-semibold" style={{color:'var(--tomato-deep)'}}>Ver todas →</button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
            {metrics.recent.length === 0 && !loading && (
              <div className="text-sm text-center py-8" style={{color:'var(--ink-mute)'}}>Sin ventas registradas</div>
            )}
            {metrics.recent.map(s => {
              const st = METHOD_STYLE[s.method] || METHOD_STYLE.tarjeta;
              const icon = s.method === 'efectivo' ? <I.cash size={16}/>
                : s.method === 'transferencia' ? <I.wallet size={16}/>
                : <I.card size={16}/>;
              return (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.03] transition-colors">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: st.bg}}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.items.map(i=>`${i.qty}× ${i.n}`).join(' · ') || '—'}</div>
                    <div className="text-[11px]" style={{color:'var(--ink-mute)'}}>{s.id} · {s.time}{s.cashier?` · ${s.cashier}`:''}</div>
                  </div>
                  <div className="text-sm font-bold tabnum">{fmtCLP(s.total)}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, dark, accent }) {
  const dot = { mustard: 'var(--mustard)', tomato: 'var(--tomato)', pickle: 'var(--pickle)', ink: 'var(--ink)' }[accent];
  return (
    <div className={`rounded-xl p-3 ${dark ? '' : 'bg-black/5'}`} style={dark ? {background:'rgba(255,255,255,0.08)'} : {}}>
      <div className={`text-[11px] font-semibold uppercase tracking-wider ${dark ? 'text-white/50' : 'text-[color:var(--ink-mute)]'} flex items-center gap-1.5`}>
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{background:dot}}/>}
        {label}
      </div>
      <div className={`font-display font-bold text-lg tabnum mt-0.5 ${dark ? 'text-white' : ''}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, sub }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>{label}</div>
      <div className="font-display font-bold text-base tabnum">{value}</div>
      <div className="text-[10px]" style={{color:'var(--ink-mute)'}}>{sub}</div>
    </div>
  );
}
