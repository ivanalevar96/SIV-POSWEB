import { useEffect, useState } from 'react';
import { I } from '../icons.jsx';
import { Modal, Button } from '../ui.jsx';
import { fmtCLP } from '../data.js';
import { getOpenSession } from '../hooks/useCashSession.js';
import {
  getSessionMovements,
  createCashMovement,
  netFromMovements,
} from '../hooks/useCashMovements.js';

export default function CashMovementModal({ state, onCancel, onSaved }) {
  const isMobile = state.viewport === 'mobile';
  const [type, setType] = useState('retiro');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [movements, setMovements] = useState([]);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const s = await getOpenSession();
        if (!s) { setError('No hay caja abierta'); return; }
        const mv = await getSessionMovements(s.id);
        if (cancel) return;
        setSessionId(s.id);
        setMovements(mv);
      } catch (e) {
        if (!cancel) setError(e.message || 'Error cargando movimientos');
      }
    })();
    return () => { cancel = true; };
  }, []);

  const amountNum = parseInt(amount.replace(/\D/g, '') || '0', 10);
  const net = netFromMovements(movements);
  const preset = [1000, 5000, 10000, 20000];

  const save = async () => {
    if (saving || amountNum <= 0) return;
    setSaving(true);
    setError(null);
    try {
      const mv = await createCashMovement({
        type,
        amount: amountNum,
        reason: reason.trim() || null,
        cashier_name: state.user.first,
      });
      setMovements(prev => [...prev, mv]);
      setAmount('');
      setReason('');
      onSaved?.();
    } catch (e) {
      setError(e.message || 'No se pudo registrar');
    } finally {
      setSaving(false);
    }
  };

  const typeColor = type === 'retiro' ? 'var(--tomato-deep)' : 'var(--pickle-deep, var(--pickle))';

  return (
    <Modal open onClose={onCancel} position={isMobile ? 'bottom' : 'center'}
      className={isMobile ? 'w-full rounded-t-3xl bg-white p-5' : 'w-[480px] rounded-3xl bg-white p-6'}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
            Movimientos de caja
          </div>
          <div className="font-display font-bold text-xl mt-1">Retiro o ingreso</div>
        </div>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press">
          <I.x size={18}/>
        </button>
      </div>

      {!sessionId && !error ? (
        <div className="py-8 text-center text-sm" style={{color:'var(--ink-mute)'}}>Cargando sesión…</div>
      ) : error ? (
        <div className="mt-4 text-sm rounded-xl px-3 py-2 border"
          style={{color:'var(--tomato-deep)', borderColor:'rgba(220,60,40,0.25)', background:'rgba(220,60,40,0.06)'}}>
          {error}
        </div>
      ) : (
        <>
          {/* Tipo */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={()=>setType('retiro')}
              className="press h-12 rounded-xl flex items-center justify-center gap-2 font-semibold border-2 transition-all text-sm"
              style={type==='retiro'
                ? {background:'var(--tomato)', borderColor:'var(--tomato)', color:'white'}
                : {background:'white', borderColor:'rgba(0,0,0,0.08)', color:'var(--ink-mute)'}}>
              <I.minus size={16}/> Retiro
            </button>
            <button onClick={()=>setType('ingreso')}
              className="press h-12 rounded-xl flex items-center justify-center gap-2 font-semibold border-2 transition-all text-sm"
              style={type==='ingreso'
                ? {background:'var(--pickle)', borderColor:'var(--pickle)', color:'white'}
                : {background:'white', borderColor:'rgba(0,0,0,0.08)', color:'var(--ink-mute)'}}>
              <I.plus size={16}/> Ingreso
            </button>
          </div>

          {/* Monto */}
          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
              Monto
            </label>
            <div className="mt-1 rounded-2xl p-4 text-center" style={{background:'var(--cream, var(--paper-2))'}}>
              <div className="inline-flex items-baseline gap-1 font-display font-bold tabnum" style={{color:'var(--ink)'}}>
                <span className="text-2xl">$</span>
                <input
                  autoFocus
                  value={amount ? fmtCLP(amountNum).replace('$','') : ''}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  className="text-3xl font-display font-bold tabnum w-[7ch] text-center bg-transparent outline-none"/>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {preset.map(v => (
                <button key={v} onClick={()=>setAmount(String(v))}
                  className="press h-8 px-2.5 rounded-full bg-white text-xs font-semibold border border-black/10">
                  {fmtCLP(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo */}
          <div className="mt-3">
            <label className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
              Motivo {type==='retiro' ? '(ej: guardar en bóveda, pago a proveedor)' : '(ej: reposición de cambio)'}
            </label>
            <input
              value={reason}
              onChange={e=>setReason(e.target.value)}
              placeholder="Describe brevemente…"
              className="mt-1 w-full h-10 px-3 rounded-lg bg-white border border-black/10 text-sm ring-brand"/>
          </div>

          {/* Histórico del turno */}
          <div className="mt-4 rounded-2xl p-3 text-sm" style={{background:'var(--paper-2)'}}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
                Neto del turno ({movements.length} movs)
              </span>
              <span className="font-display font-bold tabnum" style={{color: net>=0 ? 'var(--pickle-deep, var(--ink))' : 'var(--tomato-deep)'}}>
                {net >= 0 ? '+' : ''}{fmtCLP(net)}
              </span>
            </div>
            {movements.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {movements.slice().reverse().map(m => (
                  <div key={m.id} className="flex justify-between text-xs">
                    <span className="truncate pr-2">
                      <span className="font-semibold capitalize" style={{color: m.type==='retiro'?'var(--tomato-deep)':'var(--pickle-deep, var(--pickle))'}}>
                        {m.type}
                      </span>
                      {m.reason ? ` · ${m.reason}` : ''}
                    </span>
                    <span className="tabnum font-mono" style={{color:'var(--ink-soft)'}}>
                      {m.type==='retiro' ? '-' : '+'}{fmtCLP(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={saving}>Cerrar</Button>
            <Button size="lg" onClick={save} disabled={!amountNum || saving} className="flex-[2]"
              style={{background: typeColor, color:'white'}}>
              {saving ? 'Guardando…' : <>Registrar {type} <I.check size={18}/></>}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
