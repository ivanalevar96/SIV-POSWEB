import { useEffect, useState } from 'react';
import { I } from '../icons.jsx';
import { Modal, Button } from '../ui.jsx';
import { fmtCLP, PAYMENT_METHODS, methodLabel } from '../data.js';
import { supabase } from '../lib/supabase.js';
import { getOpenSession, closeCashSession } from '../hooks/useCashSession.js';
import { getSessionMovements, netFromMovements } from '../hooks/useCashMovements.js';

export default function CloseCashModal({ state, onCancel, onConfirmed }) {
  const isMobile = state.viewport === 'mobile';
  const [openSess, setOpenSess] = useState(null);
  const [byMethod, setByMethod] = useState({});
  const [countSales, setCountSales] = useState(0);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getOpenSession();
        if (!s) {
          setError('No hay caja abierta');
          setLoading(false);
          return;
        }
        setOpenSess(s);
        const [{ data: sales }, mvs] = await Promise.all([
          supabase.from('sales').select('method, total').eq('session_id', s.id),
          getSessionMovements(s.id),
        ]);
        const totals = {};
        (sales || []).forEach(r => {
          totals[r.method] = (totals[r.method] || 0) + (r.total || 0);
        });
        setByMethod(totals);
        setCountSales(sales?.length || 0);
        setMovements(mvs);
      } catch (e) {
        setError(e.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const amountNum = parseInt(amount.replace(/\D/g, '') || '0', 10);
  const cashSales = byMethod['efectivo'] || 0;
  const netMov = netFromMovements(movements);
  const cajaTeorica = (openSess?.opening_amount || 0) + cashSales + netMov;
  const diff = amountNum - cajaTeorica;

  // Lista de métodos no-efectivo presentes (incluye legacy 'tarjeta')
  const otherMethods = Object.keys(byMethod).filter(k => k !== 'efectivo' && (byMethod[k] || 0) > 0);
  const otherTotal = otherMethods.reduce((a, k) => a + (byMethod[k] || 0), 0);
  const grandTotal = cashSales + otherTotal;

  const confirm = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await closeCashSession(amountNum);
      onConfirmed();
    } catch (e) {
      setError(e.message || 'No se pudo cerrar caja');
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onCancel} position={isMobile?'bottom':'center'}
      className={isMobile?'w-full rounded-t-3xl bg-white p-5':'w-[500px] rounded-3xl bg-white p-6'}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--tomato-deep)'}}>Cierre de caja</div>
          <div className="font-display font-bold text-xl mt-1">Cerrar turno</div>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm" style={{color:'var(--ink-mute)'}}>Cargando totales…</div>
      ) : error ? (
        <div className="mt-4 text-sm rounded-xl px-3 py-2 border" style={{color:'var(--tomato-deep)', borderColor:'rgba(220,60,40,0.25)', background:'rgba(220,60,40,0.06)'}}>
          {error}
        </div>
      ) : (
        <>
          {/* Resumen del turno */}
          <div className="mt-4 rounded-2xl p-4 space-y-1.5 text-sm" style={{background:'var(--paper-2)'}}>
            <Row label="Apertura" value={fmtCLP(openSess.opening_amount)}/>
            <div className="pt-1.5 border-t border-dashed border-black/10">
              <Row label={`Efectivo (${countSales ? countSales : 0} ventas totales)`} value={fmtCLP(cashSales)} accent="mustard"/>
              {otherMethods.map(m => (
                <Row key={m} label={methodLabel(m)} value={fmtCLP(byMethod[m])} muted/>
              ))}
              <Row label="Total ventas" value={fmtCLP(grandTotal)} bold/>
            </div>
            {movements.length > 0 && (
              <div className="pt-1.5 border-t border-dashed border-black/10">
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{color:'var(--ink-mute)'}}>
                  Movimientos ({movements.length})
                </div>
                {movements.map(m => (
                  <Row key={m.id}
                    label={`${m.type === 'retiro' ? 'Retiro' : 'Ingreso'}${m.reason ? ` · ${m.reason}` : ''}`}
                    value={`${m.type==='retiro'?'-':'+'}${fmtCLP(m.amount)}`}
                    muted/>
                ))}
                <Row label="Neto movimientos" value={`${netMov>=0?'+':''}${fmtCLP(netMov)}`}/>
              </div>
            )}
            <div className="pt-1.5 border-t border-dashed border-black/10">
              <Row label="Efectivo esperado en caja" value={fmtCLP(cajaTeorica)} bold/>
              <div className="text-[11px]" style={{color:'var(--ink-mute)'}}>
                = apertura + ventas efectivo {movements.length > 0 ? '+ movimientos netos' : ''}
              </div>
            </div>
          </div>

          {/* Input de monto dejado */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
              Balance físico en caja
            </label>
            <div className="text-[11px] mb-1.5" style={{color:'var(--ink-mute)'}}>
              Conteo real. Se sugerirá como apertura para el próximo turno.
            </div>
            <div className="rounded-2xl p-4 text-center" style={{background:'var(--cream, var(--paper-2))'}}>
              <div className="inline-flex items-baseline gap-1 font-display font-bold tabnum" style={{color:'var(--ink)'}}>
                <span className="text-2xl">$</span>
                <input
                  autoFocus
                  value={amount ? fmtCLP(amountNum).replace('$','') : ''}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-4xl font-display font-bold tabnum w-[8ch] text-center bg-transparent outline-none"
                />
              </div>
              {amount && (
                <div className="mt-2 text-xs font-mono" style={{color: diff===0?'var(--pickle-deep, var(--ink-mute))' : diff>0?'var(--ink-mute)' : 'var(--tomato-deep)'}}>
                  {diff === 0 && '✓ Cuadra exacto'}
                  {diff > 0 && `Sobran ${fmtCLP(diff)}`}
                  {diff < 0 && `Faltan ${fmtCLP(-diff)}`}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={saving}>Cancelar</Button>
            <Button size="lg" onClick={confirm} disabled={!amount || saving} className="flex-[2]">
              {saving ? 'Cerrando…' : <>Cerrar caja <I.check size={18}/></>}
            </Button>
          </div>
          <div className="mt-2 text-[11px] text-center" style={{color:'var(--ink-mute)'}}>
            Se cerrará sesión tras el cierre. El próximo cajero deberá abrir caja de nuevo.
          </div>
        </>
      )}
    </Modal>
  );
}

function Row({ label, value, bold, muted, accent }) {
  const dot = accent === 'mustard' ? 'var(--mustard)' : null;
  return (
    <div className="flex justify-between items-center">
      <span className="inline-flex items-center gap-1.5" style={{color: muted ? 'var(--ink-mute)' : 'var(--ink-soft)'}}>
        {dot && <span className="w-1.5 h-1.5 rounded-full" style={{background: dot}}/>}
        {label}
      </span>
      <span className={`tabnum ${bold?'font-display font-bold text-base':''}`}>{value}</span>
    </div>
  );
}
