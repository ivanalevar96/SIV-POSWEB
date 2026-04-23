import { useState } from 'react';
import { I } from '../icons.jsx';
import { Card, Button, Segmented, LineChart, Donut } from '../ui.jsx';
import { fmtCLP, methodLabel } from '../data.js';
import { useStats } from '../hooks/useStats.js';

function downloadCSV(filename, rows) {
  const escape = v => {
    const str = v == null ? '' : String(v);
    return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const CAT_COLORS = [
  'oklch(0.63 0.22 25)',  // tomato
  'oklch(0.82 0.17 85)',  // mustard
  'oklch(0.68 0.15 145)', // pickle
  'oklch(0.4 0.03 60)',   // ink
  'oklch(0.75 0.1 300)',  // violet fallback
  'oklch(0.7 0.15 200)',  // blue fallback
];

const METHOD_COLOR = {
  efectivo:      'oklch(0.82 0.17 85)',
  debito:        'oklch(0.63 0.22 25)',
  credito:       'oklch(0.68 0.15 145)',
  transferencia: 'oklch(0.4 0.03 60)',
  tarjeta:       'oklch(0.55 0.18 25)',
};

function fmtDelta(n) {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}
function deltaColor(n) {
  if (!isFinite(n) || n === 0) return 'var(--ink-mute)';
  return n > 0 ? 'var(--pickle)' : 'var(--tomato-deep)';
}

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export default function Estadisticas() {
  const [period, setPeriod] = useState('semana');
  const [range, setRange] = useState(() => ({
    from: toDateKey(new Date(Date.now() - 6 * 86400000)),
    to: toDateKey(new Date()),
  }));
  const stats = useStats(period, period === 'personalizado' ? range : null);
  const totalByCat = stats.byCategory ? stats.byCategory.reduce((a,c)=>a+c.value,0) : 0;

  const rangeLabel = period === 'dia' ? 'Hoy'
    : period === 'semana' ? 'Últimos 7 días'
    : period === 'mes_calendario' ? 'Este mes'
    : period === 'personalizado' ? `${range.from} → ${range.to}`
    : '';

  const methodEntries = stats.byMethod
    ? Object.entries(stats.byMethod).filter(([, v]) => v > 0).sort((a,b)=>b[1]-a[1])
    : [];
  const totalByMethod = methodEntries.reduce((a,[,v])=>a+v, 0);

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Estadísticas</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>
            {stats.loading ? 'Cargando…' : stats.error ? 'Error al cargar' : 'Desempeño del negocio'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={period} onChange={setPeriod}
            options={[
              { value: 'dia', label: 'Día' },
              { value: 'semana', label: 'Semana' },
              { value: 'mes_calendario', label: 'Mes' },
              { value: 'personalizado', label: 'Personalizado' },
            ]}
          />
          <Button
            variant="outline" size="sm"
            disabled={stats.loading || !stats.series}
            onClick={() => {
              const periodLabel = { dia:'dia', semana:'semana', mes_calendario:'mes-calendario', personalizado: `${range.from}_a_${range.to}` }[period];
              const stamp = new Date().toISOString().slice(0, 10);
              const rows = [
                ['Periodo', periodLabel],
                ['Generado', stamp],
                [],
                ['KPI','Valor','Periodo anterior','Delta %'],
                ['Ingresos', stats.revenue || 0, stats.prevRevenue || 0, (stats.revenueDelta || 0).toFixed(1)],
                ['Ventas',   stats.count   || 0, stats.prevCount   || 0, (stats.countDelta   || 0).toFixed(1)],
                ['Ticket promedio', Math.round(stats.avgTicket || 0), Math.round(stats.prevAvg || 0), (stats.avgDelta || 0).toFixed(1)],
                ['Productos vendidos', stats.itemsSold || 0, stats.prevItemsSold || 0, (stats.itemsDelta || 0).toFixed(1)],
                [],
                ['Método de pago','Ingresos','Periodo anterior'],
                ...Object.entries(stats.byMethod || {})
                  .filter(([, v]) => v > 0)
                  .map(([m, v]) => [methodLabel(m), v, stats.prevByMethod?.[m] || 0]),
                [],
                ['Bucket','Actual','Anterior'],
                ...(stats.series || []).map(s => [s.d, s.esta, s.pasada]),
                [],
                ['Top productos','Unidades','Ingresos'],
                ...(stats.topProducts || []).map(p => [p.name, p.count, p.revenue]),
                [],
                ['Categoría','Ingresos'],
                ...(stats.byCategory || []).map(c => [c.name, c.value]),
              ];
              downloadCSV(`reporte-${periodLabel}-${stamp}.csv`, rows);
            }}>
            <I.download size={14}/> CSV
          </Button>
        </div>
      </div>

      {period === 'personalizado' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Rango</div>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{color:'var(--ink-mute)'}}>Desde</label>
              <input
                type="date"
                value={range.from}
                max={range.to}
                onChange={e => setRange(r => ({ ...r, from: e.target.value }))}
                className="h-9 px-3 rounded-xl text-sm tabnum bg-[color:var(--paper-2)] border border-black/5 ring-brand"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{color:'var(--ink-mute)'}}>Hasta</label>
              <input
                type="date"
                value={range.to}
                min={range.from}
                max={toDateKey(new Date())}
                onChange={e => setRange(r => ({ ...r, to: e.target.value }))}
                className="h-9 px-3 rounded-xl text-sm tabnum bg-[color:var(--paper-2)] border border-black/5 ring-brand"
              />
            </div>
          </div>
        </Card>
      )}

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
              {period === 'mes_calendario' && 'Mes actual vs mes anterior'}
              {period === 'personalizado' && `${rangeLabel} · vs periodo previo`}
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

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display font-bold text-lg">Ventas por método de pago</div>
            <div className="text-xs" style={{color:'var(--ink-mute)'}}>
              {rangeLabel}
              {' · '}Total {fmtCLP(totalByMethod)}
            </div>
          </div>
        </div>
        {methodEntries.length === 0 ? (
          <div className="py-6 text-center text-sm" style={{color:'var(--ink-mute)'}}>
            {stats.loading ? 'Cargando…' : 'Sin ventas en el periodo'}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {methodEntries.map(([m, v]) => {
              const p = totalByMethod ? (v / totalByMethod * 100).toFixed(0) : '0';
              const prev = stats.prevByMethod?.[m] || 0;
              const delta = prev === 0 ? (v > 0 ? 100 : 0) : ((v - prev) / prev) * 100;
              return (
                <div key={m} className="rounded-2xl p-3" style={{background:'var(--paper-2)'}}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background: METHOD_COLOR[m] || 'var(--ink)'}}/>
                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
                      {methodLabel(m)}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display font-bold text-lg tabnum">{fmtCLP(v)}</div>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span style={{color:'var(--ink-mute)'}}>{p}% del total</span>
                    <span className="tabnum" style={{color: delta>=0?'var(--pickle)':'var(--tomato-deep)'}}>
                      {fmtDelta(delta)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-bold text-lg">Productos más vendidos</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>
                Top {stats.topProducts?.length || 0} · {rangeLabel}
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
            {rangeLabel}
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
