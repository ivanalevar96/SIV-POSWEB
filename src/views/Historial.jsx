import { useState, useMemo } from 'react';
import { I } from '../icons.jsx';
import { Card, Button, Modal, Chip } from '../ui.jsx';
import { fmtCLP } from '../data.js';
import { useSales } from '../hooks/useSales.js';

export default function Historial({ state }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [method, setMethod] = useState('all');
  const [cashier, setCashier] = useState('all');
  const [detail, setDetail] = useState(null);
  const isMobile = state.viewport === 'mobile';
  const { sales: allSales, loading } = useSales({ limit: 100 });

  // Lista única de cajeros a partir de las ventas cargadas
  const cashiers = useMemo(() => {
    const set = new Set();
    allSales.forEach(s => { if (s.cashier) set.add(s.cashier); });
    return Array.from(set).sort();
  }, [allSales]);

  const sales = allSales.filter(s =>
    (method === 'all' || s.method === method) &&
    (cashier === 'all' || s.cashier === cashier)
  );

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Historial</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>{loading ? 'Cargando…' : `${sales.length} ventas`}</div>
        </div>
        <Button variant="outline" size="sm"><I.download size={16}/> CSV</Button>
      </div>

      {isMobile ? (
        <Card className="mb-3">
          <button onClick={()=>setFiltersOpen(o=>!o)} className="w-full px-4 py-3 flex items-center justify-between press">
            <div className="inline-flex items-center gap-2 font-semibold text-sm"><I.filter size={16}/> Filtros</div>
            <I.chevD size={16} style={{transform: filtersOpen?'rotate(180deg)':''}}/>
          </button>
          {filtersOpen && <FiltersBody method={method} setMethod={setMethod} cashier={cashier} setCashier={setCashier} cashiers={cashiers}/>}
        </Card>
      ) : (
        <Card className="p-4 mb-4"><FiltersBody method={method} setMethod={setMethod} cashier={cashier} setCashier={setCashier} cashiers={cashiers}/></Card>
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
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
                  style={s.method==='efectivo'?{background:'oklch(0.96 0.07 85)',color:'oklch(0.4 0.1 70)'}:{background:'oklch(0.95 0.08 25)',color:'var(--tomato-deep)'}}>
                  {s.method==='efectivo' ? <I.cash size={12}/> : <I.card size={12}/>}
                  {s.method}
                </span>
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={s.method==='efectivo'?{background:'oklch(0.96 0.07 85)'}:{background:'oklch(0.95 0.08 25)'}}>
                {s.method==='efectivo' ? <I.cash size={18}/> : <I.card size={18}/>}
              </div>
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
                <div className="text-[10px] capitalize" style={{color:'var(--ink-mute)'}}>{s.method}</div>
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
              <div className="text-[11px] uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Total · {detail.method}</div>
              <div className="font-display font-bold text-3xl tabnum">{fmtCLP(detail.total)}</div>
            </div>
            <Button variant="outline" size="sm"><I.download size={14}/> Imprimir</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FiltersBody({ method, setMethod, cashier, setCashier, cashiers }) {
  return (
    <div className="px-4 py-3 space-y-3">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{color:'var(--ink-mute)'}}>Método de pago</div>
        <div className="flex gap-2 flex-wrap">
          <Chip active={method==='all'} onClick={()=>setMethod('all')} color="ink">Todos</Chip>
          <Chip active={method==='efectivo'} onClick={()=>setMethod('efectivo')} color="mustard">Efectivo</Chip>
          <Chip active={method==='tarjeta'} onClick={()=>setMethod('tarjeta')} color="tomato">Tarjeta</Chip>
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
