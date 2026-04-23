import { I } from '../icons.jsx';
import { Card, Button, Segmented, BarChart, Donut } from '../ui.jsx';
import { HOURS, todaySalesByHour, RECENT_SALES, fmtCLP } from '../data.js';

export default function Dashboard({ state, onGo }) {
  const { openingAmount, sales, cashSales, cardSales } = state.summary;
  const total = cashSales + cardSales + openingAmount;
  const chartData = HOURS.map((h,i) => ({ l: h, v: todaySalesByHour[i] }));
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
            <div className="mt-1 text-white/60 text-sm">Total estimado en caja</div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="Apertura" value={fmtCLP(openingAmount)} dark/>
              <Stat label="Efectivo" value={fmtCLP(cashSales)} dark accent="mustard"/>
              <Stat label="Tarjeta" value={fmtCLP(cardSales)} dark accent="tomato"/>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{color:'var(--ink-mute)'}}>Ventas hoy</div>
              <div className="font-display font-bold text-4xl tabnum mt-1">{sales}</div>
              <div className="text-xs mt-1" style={{color:'var(--pickle)'}}>↑ 18% vs ayer</div>
            </div>
            <Donut
              size={110} thick={16}
              segments={[
                { value: cashSales, color: 'oklch(0.82 0.17 85)' },
                { value: cardSales, color: 'oklch(0.63 0.22 25)' },
              ]}
              label={fmtCLP(cashSales + cardSales)}
              sub="ventas"
            />
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'var(--mustard)'}}/>Efectivo {Math.round(cashSales/(cashSales+cardSales)*100)}%</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:'var(--tomato)'}}/>Tarjeta {Math.round(cardSales/(cashSales+cardSales)*100)}%</span>
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
          <BarChart data={chartData} valueKey="v" labelKey="l" height={180} color="oklch(0.82 0.17 85)"/>
          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-3 gap-4">
            <MiniStat label="Hora peak" value="20:00" sub="31 ventas"/>
            <MiniStat label="Ticket prom." value={fmtCLP(4850)} sub="↑ 4%"/>
            <MiniStat label="Flujo/hora" value="16.2" sub="ventas/h"/>
          </div>
        </Card>

        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-bold text-lg">Últimas ventas</div>
            <button onClick={()=>onGo('historial')} className="text-xs font-semibold" style={{color:'var(--tomato-deep)'}}>Ver todas →</button>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-[280px] pr-1">
            {RECENT_SALES.slice(0,6).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.03] transition-colors">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: s.method==='efectivo' ? 'oklch(0.95 0.07 85)' : 'oklch(0.94 0.08 25)'}}>
                  {s.method==='efectivo' ? <I.cash size={16}/> : <I.card size={16}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{s.items.map(i=>i.n).join(' · ')}</div>
                  <div className="text-[11px]" style={{color:'var(--ink-mute)'}}>{s.id} · {s.time} · {s.cashier}</div>
                </div>
                <div className="text-sm font-bold tabnum">{fmtCLP(s.total)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, dark, accent }) {
  const dot = { mustard: 'var(--mustard)', tomato: 'var(--tomato)' }[accent];
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
