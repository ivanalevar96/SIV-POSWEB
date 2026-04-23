import { useState } from 'react';
import { I } from '../icons.jsx';
import { Card, Segmented, LineChart, Donut } from '../ui.jsx';
import { fmtCLP } from '../data.js';
import { useStats } from '../hooks/useStats.js';

const CAT_COLORS = [
  'oklch(0.63 0.22 25)',  // tomato
  'oklch(0.82 0.17 85)',  // mustard
  'oklch(0.68 0.15 145)', // pickle
  'oklch(0.4 0.03 60)',   // ink
  'oklch(0.75 0.1 300)',  // violet fallback
  'oklch(0.7 0.15 200)',  // blue fallback
];

function fmtDelta(n) {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}
function deltaColor(n) {
  if (!isFinite(n) || n === 0) return 'var(--ink-mute)';
  return n > 0 ? 'var(--pickle)' : 'var(--tomato-deep)';
}

export default function Estadisticas() {
  const [period, setPeriod] = useState('semana');
  const stats = useStats(period);
  const totalByCat = stats.byCategory ? stats.byCategory.reduce((a,c)=>a+c.value,0) : 0;

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Estadísticas</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>
            {stats.loading ? 'Cargando…' : stats.error ? 'Error al cargar' : 'Desempeño del negocio'}
          </div>
        </div>
        <Segmented
          value={period} onChange={setPeriod}
          options={[
            { value: 'dia', label: 'Día' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Ingresos" value={fmtCLP(stats.revenue || 0)} delta={fmtDelta(stats.revenueDelta || 0)} deltaC={deltaColor(stats.revenueDelta || 0)} accent="mustard" icon={<I.wallet size={18}/>}/>
        <KPI label="Ventas" value={String(stats.count || 0)} delta={fmtDelta(stats.countDelta || 0)} deltaC={deltaColor(stats.countDelta || 0)} accent="tomato" icon={<I.receipt size={18}/>}/>
        <KPI label="Ticket promedio" value={fmtCLP(stats.avgTicket || 0)} delta={fmtDelta(stats.avgDelta || 0)} deltaC={deltaColor(stats.avgDelta || 0)} accent="pickle" icon={<I.ticket size={18}/>}/>
        <KPI label="Productos vendidos" value={String(stats.itemsSold || 0)} delta={fmtDelta(stats.itemsDelta || 0)} deltaC={deltaColor(stats.itemsDelta || 0)} accent="ink" icon={<I.cart size={18}/>}/>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display font-bold text-lg">Comparativo</div>
            <div className="text-xs" style={{color:'var(--ink-mute)'}}>
              {period === 'dia' && 'Hoy vs ayer · por hora'}
              {period === 'semana' && 'Últimos 7 días vs anterior'}
              {period === 'mes' && 'Últimos 30 días vs anterior'}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{background:'var(--mustard-deep)'}}/>Actual</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[2px] rounded-full" style={{background:'var(--ink)', opacity:0.35}}/>Anterior</span>
          </div>
        </div>
        {stats.series && stats.series.length > 0 ? (
          <LineChart data={stats.series} height={200}/>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-sm" style={{color:'var(--ink-mute)'}}>
            {stats.loading ? 'Cargando…' : 'Sin datos en el periodo'}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-bold text-lg">Productos más vendidos</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>
                Top {stats.topProducts?.length || 0} · {period === 'dia' ? 'hoy' : period === 'semana' ? 'últimos 7 días' : 'últimos 30 días'}
              </div>
            </div>
          </div>
          {!stats.topProducts || stats.topProducts.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{color:'var(--ink-mute)'}}>
              {stats.loading ? 'Cargando…' : 'Sin ventas en el periodo'}
            </div>
          ) : (
            <div className="space-y-2.5">
              {stats.topProducts.map((t, i) => {
                const max = Math.max(...stats.topProducts.map(x => x.count));
                const barPct = max ? (t.count / max) * 100 : 0;
                return (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className="w-6 font-display font-bold tabnum text-sm" style={{color:'var(--ink-mute)'}}>#{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <div className="font-semibold text-sm truncate">{t.name}</div>
                        <div className="font-mono text-xs tabnum" style={{color:'var(--ink-mute)'}}>{t.count} u · {fmtCLP(t.revenue)}</div>
                      </div>
                      <div className="mt-1 h-2 rounded-full overflow-hidden" style={{background:'var(--paper-2)'}}>
                        <div className="h-full rounded-full transition-all" style={{width: `${barPct}%`, background: i<3 ? 'var(--mustard)' : 'var(--ink)'}}/>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="font-display font-bold text-lg">Ventas por categoría</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>
            {period === 'dia' ? 'Hoy' : period === 'semana' ? 'Últimos 7 días' : 'Últimos 30 días'}
          </div>
          {!stats.byCategory || stats.byCategory.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{color:'var(--ink-mute)'}}>
              {stats.loading ? 'Cargando…' : 'Sin ventas en el periodo'}
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center justify-center">
                <Donut size={160} thick={26} label={fmtCLP(totalByCat)} sub="total"
                  segments={stats.byCategory.map((c, i) => ({ value: c.value, color: CAT_COLORS[i % CAT_COLORS.length] }))}
                />
              </div>
              <div className="mt-4 space-y-1.5">
                {stats.byCategory.map((c, i) => {
                  const p = totalByCat ? (c.value / totalByCat * 100).toFixed(0) : '0';
                  return (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{background: CAT_COLORS[i % CAT_COLORS.length]}}/>
                        <span className="font-medium">{c.name}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="tabnum font-semibold">{fmtCLP(c.value)}</span>
                        <span className="tabnum text-xs" style={{color:'var(--ink-mute)'}}>{p}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, deltaC, accent, icon }) {
  const colors = {
    mustard: { bg:'oklch(0.95 0.1 85)', fg:'oklch(0.35 0.1 70)' },
    tomato:  { bg:'oklch(0.94 0.08 25)', fg:'var(--tomato-deep)' },
    pickle:  { bg:'oklch(0.94 0.08 145)', fg:'oklch(0.4 0.1 145)' },
    ink:     { bg:'oklch(0.9 0.01 60)', fg:'var(--ink)' },
  }[accent];
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:colors.bg, color:colors.fg}}>{icon}</div>
      </div>
      <div className="font-display font-bold text-2xl tabnum">{value}</div>
      <div className="text-xs mt-0.5" style={{color: deltaC || 'var(--pickle)'}}>{delta}</div>
    </Card>
  );
}
