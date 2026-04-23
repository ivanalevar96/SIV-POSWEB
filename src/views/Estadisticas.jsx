import { useState } from 'react';
import { I } from '../icons.jsx';
import { Card, Segmented, LineChart, Donut } from '../ui.jsx';
import { WEEKLY, TOP_PRODUCTS, BY_CATEGORY, fmtCLP } from '../data.js';

export default function Estadisticas() {
  const [period, setPeriod] = useState('semana');
  const totalRevenue = BY_CATEGORY.reduce((a,c)=>a+c.value,0);
  const ticketProm = 4850;
  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Estadísticas</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>Desempeño del negocio</div>
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
        <KPI label="Ingresos" value={fmtCLP(totalRevenue)} delta="+12.4%" accent="mustard" icon={<I.wallet size={18}/>}/>
        <KPI label="Ventas" value="612" delta="+18%" accent="tomato" icon={<I.receipt size={18}/>}/>
        <KPI label="Ticket promedio" value={fmtCLP(ticketProm)} delta="+4%" accent="pickle" icon={<I.ticket size={18}/>}/>
        <KPI label="Clientes únicos" value="487" delta="+22%" accent="ink" icon={<I.user size={18}/>}/>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-display font-bold text-lg">Comparativo semanal</div>
            <div className="text-xs" style={{color:'var(--ink-mute)'}}>Esta semana vs anterior</div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full" style={{background:'var(--mustard-deep)'}}/>Esta semana</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-[2px] rounded-full" style={{background:'var(--ink)', opacity:0.35}}/>Semana pasada</span>
          </div>
        </div>
        <LineChart data={WEEKLY} height={200}/>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-display font-bold text-lg">Productos más vendidos</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>Top 6 · últimos 7 días</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {TOP_PRODUCTS.map((t, i) => {
              const max = Math.max(...TOP_PRODUCTS.map(x=>x.count));
              const pct = (t.count / max) * 100;
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-6 font-display font-bold tabnum text-sm" style={{color:'var(--ink-mute)'}}>#{i+1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <div className="font-semibold text-sm truncate">{t.name}</div>
                      <div className="font-mono text-xs tabnum" style={{color:'var(--ink-mute)'}}>{t.count} u · {fmtCLP(t.revenue)}</div>
                    </div>
                    <div className="mt-1 h-2 rounded-full overflow-hidden" style={{background:'var(--paper-2)'}}>
                      <div className="h-full rounded-full transition-all" style={{width: `${pct}%`, background: i<3?'var(--mustard)':'var(--ink)'}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-display font-bold text-lg">Ventas por categoría</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>Últimos 7 días</div>
          <div className="mt-4 flex items-center justify-center">
            <Donut size={160} thick={26} label={fmtCLP(totalRevenue)} sub="total"
              segments={[
                { value: BY_CATEGORY[0].value, color: 'oklch(0.63 0.22 25)' },
                { value: BY_CATEGORY[1].value, color: 'oklch(0.82 0.17 85)' },
                { value: BY_CATEGORY[2].value, color: 'oklch(0.68 0.15 145)' },
                { value: BY_CATEGORY[3].value, color: 'oklch(0.4 0.03 60)' },
              ]}
            />
          </div>
          <div className="mt-4 space-y-1.5">
            {BY_CATEGORY.map((c,i) => {
              const colors = ['oklch(0.63 0.22 25)','oklch(0.82 0.17 85)','oklch(0.68 0.15 145)','oklch(0.4 0.03 60)'];
              const pct = (c.value/totalRevenue*100).toFixed(0);
              return (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{background:colors[i]}}/>
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="tabnum font-semibold">{fmtCLP(c.value)}</span>
                    <span className="tabnum text-xs" style={{color:'var(--ink-mute)'}}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, accent, icon }) {
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
      <div className="text-xs mt-0.5" style={{color:'var(--pickle)'}}>↑ {delta}</div>
    </Card>
  );
}
