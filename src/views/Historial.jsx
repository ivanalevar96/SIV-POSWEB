import { useState, useMemo } from 'react';
import { I } from '../icons.jsx';
import { Card, Button, Modal, Chip } from '../ui.jsx';
import { fmtCLP, PAYMENT_METHODS, methodLabel } from '../data.js';
import { useSales } from '../hooks/useSales.js';

function toDateKey(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function salesToCSV(sales) {
  const header = ['Código','Fecha','Hora','Método','Total','Recibido','Vuelto','Cajero','Productos'];
  const rows = sales.map(s => [
    s.id,
    s.date ? s.date.toISOString().slice(0, 10) : '',
    s.time || '',
    methodLabel(s.method),
    s.total ?? '',
    s.recibido ?? '',
    s.vuelto ?? '',
    s.cashier || '',
    (s.items || []).map(i => `${i.qty}x ${i.n}`).join(' | '),
  ]);
  const escape = v => {
    const str = v == null ? '' : String(v);
    return /[",\n;]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  return [header, ...rows].map(r => r.map(escape).join(',')).join('\n');
}

function downloadCSV(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Historial({ state }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [method, setMethod] = useState('all');
  const [cashier, setCashier] = useState('all');
  const [date, setDate] = useState(toDateKey(new Date()));
  const [detail, setDetail] = useState(null);
  const isMobile = state.viewport === 'mobile';
  const { sales: allSales, loading } = useSales({ limit: 500 });

  // Lista única de cajeros a partir de las ventas cargadas
  const cashiers = useMemo(() => {
    const set = new Set();
    allSales.forEach(s => { if (s.cashier) set.add(s.cashier); });
    return Array.from(set).sort();
  }, [allSales]);

  const sales = allSales.filter(s =>
    (method === 'all' || s.method === method) &&
    (cashier === 'all' || s.cashier === cashier) &&
    (date === '' || toDateKey(s.date) === date)
  );

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Historial</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>{loading ? 'Cargando…' : `${sales.length} ventas`}</div>
        </div>
        <Button variant="outline" size="sm" disabled={sales.length === 0}
          onClick={() => {
            const stamp = new Date().toISOString().slice(0, 10);
            downloadCSV(`ventas-${stamp}.csv`, salesToCSV(sales));
          }}>
          <I.download size={16}/> CSV ({sales.length})
        </Button>
      </div>

      {isMobile ? (
        <Card className="mb-3">
          <button onClick={()=>setFiltersOpen(o=>!o)} className="w-full px-4 py-3 flex items-center justify-between press">
            <div className="inline-flex items-center gap-2 font-semibold text-sm"><I.filter size={16}/> Filtros</div>
            <I.chevD size={16} style={{transform: filtersOpen?'rotate(180deg)':''}}/>
          </button>
          {filtersOpen && <FiltersBody method={method} setMethod={setMethod} cashier={cashier} setCashier={setCashier} cashiers={cashiers} date={date} setDate={setDate}/>}
        </Card>
      ) : (
        <Card className="p-4 mb-4"><FiltersBody method={method} setMethod={setMethod} cashier={cashier} setCashier={setCashier} cashiers={cashiers} date={date} setDate={setDate}/></Card>
      )}

      {!isMobile ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[100px_110px_2.5fr_140px_110px_120px_40px] px-4 py-3 border-b border-black/5 text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)', background:'var(--paper-2)'}}>
            <div>N° venta</div><div>Hora</div><div>Productos</div><div>Método</div><div>Cajero</div><div className="text-right">Total</div><div></div>
          </div>
          {sales.map(s => (
            <button key={s.id} onClick={()=>setDetail(s)} className="w-full text-left grid grid-cols-[100px_110px_2.5fr_140px_110px_120px_40px] px-4 py-3 border-b border-black/5 items-center hover:bg-black/[0.02]">
              <div className="font-mono font-semibold text-sm">{s.id}</div>
              <div className="tabnum text-sm">{s.time}</div>
              <div className="text-sm truncate" style={{color:'var(--ink-soft)'}}>{s.items.map(i=>i.n).join(' · ')}</div>
              <div>
                <MethodBadge method={s.method}/>
              </div>
              <div className="text-sm">{s.cashier}</div>
              <div className="text-right font-display font-bold tabnum">{fmtCLP(s.total)}</div>
              <I.chevR size={16} className="opacity-40"/>
            </button>
          ))}
        </Card>
      ) : (
        <div className="space-y-2">
          {sales.map(s => (
            <Card key={s.id} onClick={()=>setDetail(s)} className="p-3 flex items-center gap-3 press cursor-pointer">
              <MethodIcon method={s.method} size={18}/>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm">{s.id}</span>
                  <span className="text-[11px]" style={{color:'var(--ink-mute)'}}>{s.time}</span>
                </div>
                <div className="text-[12px] truncate" style={{color:'var(--ink-soft)'}}>{s.items.map(i=>i.n).join(' · ')}</div>
                <div className="text-[11px]" style={{color:'var(--ink-mute)'}}>{s.cashier}</div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-base tabnum">{fmtCLP(s.total)}</div>
                <div className="text-[10px]" style={{color:'var(--ink-mute)'}}>{methodLabel(s.method)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {detail && (
        <Modal open onClose={()=>setDetail(null)} position={isMobile?'bottom':'center'}
          className={isMobile?'w-full rounded-t-3xl bg-white p-5':'w-[420px] rounded-3xl bg-white p-6'}>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-xs" style={{color:'var(--ink-mute)'}}>{detail.id} · {detail.time}</div>
              <div className="font-display font-bold text-xl mt-1">Detalle de venta</div>
            </div>
            <button onClick={()=>setDetail(null)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
          </div>
          <div className="mt-4 space-y-2">
            {detail.items.map((it,i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{it.qty}× {it.n}</span>
                <span className="tabnum font-semibold">{fmtCLP(it.qty * it.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-black/10 flex justify-between items-baseline">
            <div>
              <div className="text-[11px] uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Total · {methodLabel(detail.method)}</div>
              <div className="font-display font-bold text-3xl tabnum">{fmtCLP(detail.total)}</div>
            </div>
            <Button variant="outline" size="sm"><I.download size={14}/> Imprimir</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FiltersBody({ method, setMethod, cashier, setCashier, cashiers, date, setDate }) {
  const todayKey = toDateKey(new Date());
  const yestKey = toDateKey(new Date(Date.now() - 86400000));
  return (
    <div className="px-4 py-3 space-y-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--ink-mute)'}}>Fecha</div>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="h-8 px-3 rounded-full text-xs tabnum bg-[color:var(--paper-2)] border border-black/5 ring-brand"
          />
          <Chip active={date===todayKey} onClick={()=>setDate(todayKey)} color="ink">Hoy</Chip>
          <Chip active={date===yestKey} onClick={()=>setDate(yestKey)} color="ink">Ayer</Chip>
          <Chip active={date===''} onClick={()=>setDate('')} color="ink">Todos</Chip>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--ink-mute)'}}>Método de pago</div>
        <div className="flex gap-2 flex-wrap">
          <Chip active={method==='all'} onClick={()=>setMethod('all')} color="ink">Todos</Chip>
          {PAYMENT_METHODS.map(m => (
            <Chip key={m.id} active={method===m.id} onClick={()=>setMethod(m.id)} color={m.color}>{m.label}</Chip>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--ink-mute)'}}>Cajero</div>
        <div className="flex gap-2 flex-wrap">
          <Chip active={cashier==='all'} onClick={()=>setCashier('all')} color="ink">Todos</Chip>
          {cashiers.length === 0 && (
            <span className="text-xs self-center" style={{color:'var(--ink-mute)'}}>Sin ventas registradas</span>
          )}
          {cashiers.map(name => (
            <Chip key={name} active={cashier===name} onClick={()=>setCashier(name)} color="ink">{name}</Chip>
          ))}
        </div>
      </div>
    </div>
  );
}

const METHOD_STYLE = {
  efectivo:      { bg:'oklch(0.96 0.07 85)',  fg:'oklch(0.4 0.1 70)',    icon: 'cash' },
  debito:        { bg:'oklch(0.95 0.08 25)',  fg:'var(--tomato-deep)',   icon: 'card' },
  credito:       { bg:'oklch(0.94 0.08 145)', fg:'oklch(0.35 0.1 145)',  icon: 'card' },
  transferencia: { bg:'oklch(0.9 0.01 60)',   fg:'var(--ink)',           icon: 'wallet' },
  tarjeta:       { bg:'oklch(0.95 0.08 25)',  fg:'var(--tomato-deep)',   icon: 'card' },
};

function MethodBadge({ method }) {
  const st = METHOD_STYLE[method] || METHOD_STYLE.tarjeta;
  const Icn = I[st.icon];
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
      style={{background: st.bg, color: st.fg}}>
      <Icn size={12}/>
      {methodLabel(method)}
    </span>
  );
}

function MethodIcon({ method, size = 16 }) {
  const st = METHOD_STYLE[method] || METHOD_STYLE.tarjeta;
  const Icn = I[st.icon];
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background: st.bg, color: st.fg}}>
      <Icn size={size}/>
    </div>
  );
}
