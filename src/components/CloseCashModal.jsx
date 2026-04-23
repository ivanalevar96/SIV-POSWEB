import { useEffect, useState } from 'react';
import { I } from '../icons.jsx';
import { Modal, Button } from '../ui.jsx';
import { fmtCLP } from '../data.js';
import { supabase } from '../lib/supabase.js';
import { getOpenSession, closeCashSession } from '../hooks/useCashSession.js';

export default function CloseCashModal({ state, onCancel, onConfirmed }) {
  const isMobile = state.viewport === 'mobile';
  const [openSess, setOpenSess] = useState(null);
  const [cashSalesToday, setCashSalesToday] = useState(0);
  const [cardSalesToday, setCardSalesToday] = useState(0);
  const [countSales, setCountSales] = useState(0);
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
        const { data: sales } = await supabase
          .from('sales')
          .select('method, total')
          .eq('session_id', s.id);
        const cash = (sales || []).filter(r => r.method === 'efectivo').reduce((a, r) => a + r.total, 0);
        const card = (sales || []).filter(r => r.method === 'tarjeta').reduce((a, r) => a + r.total, 0);
        setCashSalesToday(cash);
        setCardSalesToday(card);
        setCountSales(sales?.length || 0);
      } catch (e) {
        setError(e.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const amountNum = parseInt(amount.replace(/\D/g, '') || '0', 10);
  const cajaTeorica = (openSess?.opening_amount || 0) + cashSalesToday; // lo que deberías tener físico
  const diff = amountNum - cajaTeorica;

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
      className={isMobile?'w-full rounded-t-3xl bg-white p-5':'w-[460px] rounded-3xl bg-white p-6'}>
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
          <div className="mt-4 rounded-2xl p-4 space-y-2 text-sm" style={{background:'var(--paper-2)'}}>
            <Row label="Apertura" value={fmtCLP(openSess.opening_amount)}/>
            <Row label={`Ventas efectivo (${countSales})`} value={fmtCLP(cashSalesToday)}/>
            <Row label="Ventas tarjeta" value={fmtCLP(cardSalesToday)} muted/>
            <div className="pt-2 border-t border-dashed border-black/10">
              <Row label="Efectivo esperado en caja" value={fmtCLP(cajaTeorica)} bold/>
            </div>
          </div>

          {/* Input de monto dejado */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
              Balance que dejas en caja
            </label>
            <div className="text-[11px] mb-1.5" style={{color:'var(--ink-mute)'}}>
              Se sugerirá como apertura para el próximo turno.
            </div>
            <div className="rounded-2xl p-4 text-center" style={{background:'var(--cream)'}}>
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

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex justify-between">
      <span style={{color: muted ? 'var(--ink-mute)' : 'var(--ink-soft)'}}>{label}</span>
      <span className={`tabnum ${bold?'font-display font-bold text-base':''}`}>{value}</span>
    </div>
  );
}
