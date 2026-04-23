import { useState } from 'react';
import { I } from '../icons.jsx';
import { FoodPlaceholder, Logo, Button, Modal, Chip, Toast } from '../ui.jsx';
import { fmtCLP, nowHM, PAYMENT_METHODS, isCashMethod, methodLabel } from '../data.js';
import { useProducts, useCategories } from '../hooks/useCatalog.js';
import { createSale } from '../hooks/useSales.js';
import { useCashSession, getOpenSession } from '../hooks/useCashSession.js';

export default function POSView({ state, dispatch, onReceipt }) {
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [sizeModal, setSizeModal] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [bumpId, setBumpId] = useState(null);
  const [toast, setToast] = useState(null);
  const isMobile = state.viewport === 'mobile';

  const { products, loading: loadingProducts } = useProducts();
  const { categories } = useCategories();
  const { session: cashSession, reload: reloadCashSession } = useCashSession();

  const filtered = products.filter(p =>
    (cat === 'all' || p.cat === cat) &&
    (p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const addItem = (p, size) => {
    const key = size ? `${p.id}-${size.name}` : p.id;
    const price = size ? size.price : p.price;
    dispatch({ type: 'ADD', key, item: { key, id: p.id, baseName: p.name, name: p.name + (size ? ` ${size.name}` : ''), price, size_name: size?.name || null } });
    setBumpId(key);
    setTimeout(()=>setBumpId(null), 320);
    setToast('Agregado al carrito');
  };

  const onPick = (p) => {
    if (p.sizes) setSizeModal(p);
    else addItem(p);
  };

  const cartCount = state.cart.reduce((a,i)=>a+i.qty, 0);
  const cartTotal = state.cart.reduce((a,i)=>a+i.qty*i.price, 0);

  const gridCols = isMobile ? 'grid-cols-2' : state.viewport === 'tablet' ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="flex h-full pb-0 relative">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-3 space-y-3 sticky top-0 z-10" style={{background:'linear-gradient(to bottom, var(--paper) 80%, transparent)'}}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-display font-bold text-2xl md:text-3xl">Nueva venta</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>{loadingProducts ? 'Cargando catálogo…' : `${filtered.length} productos disponibles`}</div>
            </div>
            <div className="relative flex-1 max-w-xs hidden sm:block">
              <I.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"/>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar producto…"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-black/5 text-sm ring-brand"/>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
            <Chip active={cat==='all'} onClick={()=>setCat('all')} color="ink">Todos</Chip>
            {categories.map(c => (
              <Chip key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} color={c.color}>
                <span className="mr-1">{c.emoji}</span>{c.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-32 md:pb-6">
          <div className={`grid ${gridCols} gap-3`}>
            {filtered.map(p => (
              <ProductCard key={p.id} p={p} onPick={onPick} bumping={bumpId && bumpId.startsWith(p.id)} categories={categories}/>
            ))}
          </div>
        </div>
      </div>

      {!isMobile && (
        <aside className="w-[340px] shrink-0 border-l border-black/5 bg-white flex flex-col">
          <CartPanel state={state} dispatch={dispatch} onCheckout={onReceipt} bumpId={bumpId} setToast={setToast} cashSession={cashSession} reloadCashSession={reloadCashSession}/>
        </aside>
      )}

      {isMobile && cartCount > 0 && (
        <button onClick={()=>setCartOpen(true)}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 h-14 px-5 rounded-full text-white font-semibold flex items-center gap-3 press shadow-xl"
          style={{background:'var(--ink)'}}>
          <div className="relative">
            <I.cart size={22}/>
            <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center tabnum ${bumpId ? 'bump' : ''}`}
              style={{background:'var(--tomato)'}}>{cartCount}</span>
          </div>
          <span>Ver carrito</span>
          <span className="tabnum opacity-90">{fmtCLP(cartTotal)}</span>
        </button>
      )}

      {isMobile && cartOpen && (
        <div className="absolute inset-0 z-50 fade-in bg-white slide-up flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-black/5">
            <div className="font-display font-bold text-lg">Carrito ({cartCount})</div>
            <button onClick={()=>setCartOpen(false)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
          </div>
          <CartPanel state={state} dispatch={dispatch} onCheckout={(sale)=>{ setCartOpen(false); onReceipt(sale); }} bumpId={bumpId} setToast={setToast} cashSession={cashSession} reloadCashSession={reloadCashSession}/>
        </div>
      )}

      {sizeModal && (
        <Modal open onClose={()=>setSizeModal(null)} position={isMobile?'bottom':'center'}
          className={isMobile?'w-full rounded-t-3xl bg-white p-5':'w-[420px] rounded-3xl bg-white p-6'}>
          <div className="flex items-start gap-4">
            <FoodPlaceholder label={sizeModal.name} img={sizeModal.img} color={categories.find(c=>c.id===sizeModal.cat)?.color} className="w-20 h-20 rounded-2xl"/>
            <div className="flex-1">
              <div className="font-display font-bold text-lg leading-tight">{sizeModal.name}</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>{sizeModal.desc}</div>
            </div>
            <button onClick={()=>setSizeModal(null)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
          </div>
          <div className="mt-5">
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color:'var(--ink-mute)'}}>Elige tamaño</div>
            <div className="space-y-2">
              {sizeModal.sizes.map(s => (
                <button key={s.name} onClick={()=>{ addItem(sizeModal, s); setSizeModal(null); }}
                  className="press w-full p-3 pl-4 rounded-xl border-2 border-black/10 hover:border-[color:var(--mustard)] flex items-center justify-between transition-all"
                  style={{background:'var(--paper-2)'}}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold" style={{background:'var(--mustard)'}}>
                      {s.name[0]}
                    </div>
                    <div className="font-semibold">{s.name}</div>
                  </div>
                  <div className="font-display font-bold tabnum">{fmtCLP(s.price)}</div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}

      <Toast msg={toast} onDone={()=>setToast(null)}/>
    </div>
  );
}

function ProductCard({ p, onPick, bumping, categories }) {
  const cat = categories.find(c => c.id === p.cat);
  const minPrice = p.sizes ? Math.min(...p.sizes.map(s=>s.price)) : p.price;
  const lowStock = p.stock < 30;
  return (
    <button onClick={()=>onPick(p)} className={`press group text-left bg-white rounded-2xl overflow-hidden border border-black/5 hover:border-[color:var(--mustard)] hover:shadow-lg transition-all ${bumping ? 'bump' : ''}`}>
      <div className="relative">
        <FoodPlaceholder label={p.name} img={p.img} color={cat?.color} className="aspect-[5/4]"/>
        {p.tag && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full text-white" style={{background:'var(--ink)'}}>{p.tag}</span>
        )}
        {p.sizes && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/95">Tamaños</span>
        )}
        <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'var(--ink)', color:'white'}}>
          <I.plus size={18}/>
        </div>
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm leading-tight line-clamp-1">{p.name}</div>
        <div className="text-[11px] line-clamp-1" style={{color:'var(--ink-mute)'}}>{p.desc}</div>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-display font-bold tabnum">
            {p.sizes && <span className="text-[10px] font-normal" style={{color:'var(--ink-mute)'}}>desde </span>}
            {fmtCLP(minPrice)}
          </div>
          <div className={`text-[10px] font-mono ${lowStock?'text-[color:var(--tomato-deep)]':''}`} style={!lowStock?{color:'var(--ink-mute)'}:{}}>
            {p.stock} u.
          </div>
        </div>
      </div>
    </button>
  );
}

function CartPanel({ state, dispatch, onCheckout, bumpId, setToast, cashSession, reloadCashSession }) {
  const [method, setMethod] = useState('efectivo');
  const [recibido, setRecibido] = useState('');
  const [saving, setSaving] = useState(false);
  const total = state.cart.reduce((a,i)=>a+i.qty*i.price, 0);
  const recibidoNum = parseInt(recibido.replace(/\D/g,'')||'0',10);
  const vuelto = Math.max(0, recibidoNum - total);
  const isCash = isCashMethod(method);
  const enough = !isCash || recibidoNum >= total;
  const empty = state.cart.length === 0;
  const noSession = !cashSession;

  const finalize = async () => {
    if (empty || !enough || saving) return;
    setSaving(true);
    try {
      // Re-chequear caja abierta en tiempo real (por si la cerró otro usuario).
      const current = await getOpenSession();
      if (!current) {
        reloadCashSession?.();
        setToast?.('La caja fue cerrada. No se puede registrar la venta.');
        return;
      }

      const sale = await createSale({
        items: state.cart,
        method,
        total,
        recibido: isCash ? recibidoNum : null,
        vuelto: isCash ? vuelto : null,
        cashier_name: state.user.first,
      });
      onCheckout({
        id: sale.code,
        items: [...state.cart],
        total, method, recibido: recibidoNum, vuelto,
        cashier: state.user.first,
        time: nowHM(),
      });
      setRecibido('');
    } catch (err) {
      console.error(err);
      if (err.message?.includes('No hay caja abierta')) reloadCashSession?.();
      setToast?.('Error: ' + (err.message || 'no se pudo guardar'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 pb-3 border-b border-black/5 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Orden actual</div>
          <div className="font-display font-bold text-lg">Carrito · {state.cart.reduce((a,i)=>a+i.qty,0)} items</div>
        </div>
        {!empty && (
          <button onClick={()=>dispatch({type:'CLEAR'})} className="text-xs font-semibold text-[color:var(--tomato-deep)] hover:underline">Vaciar</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {empty && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 stripes-mustard"></div>
            <div className="font-display font-bold text-base">Tu carrito está vacío</div>
            <div className="text-xs" style={{color:'var(--ink-mute)'}}>Toca un producto para agregarlo.</div>
          </div>
        )}
        <div className="space-y-2">
          {state.cart.map(it => (
            <div key={it.key} className={`flex items-center gap-2 p-2 rounded-xl transition-all ${bumpId===it.key?'bump':''}`} style={{background:'var(--paper-2)'}}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{it.name}</div>
                <div className="text-[11px] tabnum" style={{color:'var(--ink-mute)'}}>{fmtCLP(it.price)} c/u</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={()=>dispatch({type:'DEC', key:it.key})} className="press w-8 h-8 rounded-lg bg-white border border-black/10 flex items-center justify-center"><I.minus size={14}/></button>
                <div className="w-7 text-center font-bold tabnum">{it.qty}</div>
                <button onClick={()=>dispatch({type:'INC', key:it.key})} className="press w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--mustard)'}}><I.plus size={14}/></button>
              </div>
              <div className="w-[72px] text-right font-display font-bold tabnum text-sm">{fmtCLP(it.qty*it.price)}</div>
            </div>
          ))}
        </div>
      </div>

      {!empty && (
        <div className="p-4 border-t border-black/5 space-y-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span style={{color:'var(--ink-mute)'}}>Subtotal</span><span className="tabnum">{fmtCLP(total)}</span></div>
            <div className="flex justify-between"><span style={{color:'var(--ink-mute)'}}>Descuento</span><span className="tabnum">—</span></div>
            <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-black/10">
              <span className="font-semibold">Total</span>
              <span className="font-display font-bold text-2xl tabnum">{fmtCLP(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(m => {
              const active = method === m.id;
              const icon = m.id === 'efectivo' ? <I.cash size={16}/>
                : m.id === 'transferencia' ? <I.wallet size={16}/>
                : <I.card size={16}/>;
              const activeStyle = {
                efectivo:      { background:'var(--mustard)', borderColor:'var(--mustard)', color:'black' },
                debito:        { background:'var(--tomato)',  borderColor:'var(--tomato)',  color:'white' },
                credito:       { background:'var(--pickle)',  borderColor:'var(--pickle)',  color:'white' },
                transferencia: { background:'var(--ink)',     borderColor:'var(--ink)',     color:'white' },
              }[m.id];
              return (
                <button key={m.id} onClick={()=>setMethod(m.id)}
                  className={`press h-12 rounded-xl flex items-center justify-center gap-2 font-semibold border-2 transition-all text-sm ${active?'':'bg-white text-[color:var(--ink-mute)]'}`}
                  style={active ? activeStyle : {borderColor:'rgba(0,0,0,0.08)'}}>
                  {icon} {m.label}
                </button>
              );
            })}
          </div>

          {isCash && (
            <div className="rounded-xl p-3 space-y-2" style={{background:'var(--paper-2)'}}>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Monto recibido</label>
                <input value={recibido ? fmtCLP(recibidoNum).replace('$','$ ') : ''}
                  onChange={e=>setRecibido(e.target.value)}
                  placeholder="$ 0"
                  className="mt-1 w-full h-10 px-3 rounded-lg bg-white border border-black/10 font-display font-bold text-lg tabnum ring-brand"/>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[total, 5000, 10000, 20000].filter(v=>v>=total).map((v,i) => (
                  <button key={i} onClick={()=>setRecibido(String(v))} className="press h-8 px-2.5 rounded-full bg-white text-xs font-semibold border border-black/10">
                    {fmtCLP(v)}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-sm border-t border-dashed border-black/10 pt-2">
                <span style={{color:'var(--ink-mute)'}}>Vuelto</span>
                <span className={`font-display font-bold tabnum text-base ${!enough && recibido?'text-[color:var(--tomato-deep)]':''}`}>{fmtCLP(vuelto)}</span>
              </div>
            </div>
          )}

          {noSession && (
            <div className="rounded-xl p-3 text-xs font-semibold"
              style={{background:'rgba(220,38,38,0.08)', color:'var(--tomato-deep)'}}>
              <div className="font-display font-bold">Caja cerrada</div>
              <div className="font-normal opacity-80">No se pueden registrar ventas hasta que se abra la caja.</div>
            </div>
          )}
          <Button size="lg" variant={enough && !noSession?'dark':'outline'} disabled={!enough || saving || noSession} onClick={finalize} className="w-full">
            <I.check size={18}/> {saving ? 'Guardando…' : noSession ? 'Caja cerrada' : `Finalizar venta · ${fmtCLP(total)}`}
          </Button>
        </div>
      )}
    </div>
  );
}

export function Receipt({ sale, onClose }) {
  if (!sale) return null;
  return (
    <Modal open onClose={onClose} className="w-[340px]">
      <div className="receipt rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 text-center border-b border-dashed border-black/15">
          <Logo size={32}/>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mt-2" style={{color:'var(--ink-mute)'}}>Comprobante · {sale.id}</div>
          <div className="font-display font-bold text-lg mt-1">¡Venta realizada!</div>
        </div>
        <div className="p-5 space-y-2">
          {sale.items.map(it => (
            <div key={it.key} className="flex justify-between text-sm">
              <span className="truncate pr-2">{it.qty}× {it.name}</span>
              <span className="tabnum font-semibold">{fmtCLP(it.qty*it.price)}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-dashed border-black/15 space-y-1 text-sm">
          <div className="flex justify-between"><span style={{color:'var(--ink-mute)'}}>Método</span><span className="font-semibold">{methodLabel(sale.method)}</span></div>
          {sale.method==='efectivo' && (
            <>
              <div className="flex justify-between"><span style={{color:'var(--ink-mute)'}}>Recibido</span><span className="tabnum">{fmtCLP(sale.recibido)}</span></div>
              <div className="flex justify-between"><span style={{color:'var(--ink-mute)'}}>Vuelto</span><span className="tabnum font-semibold">{fmtCLP(sale.vuelto)}</span></div>
            </>
          )}
          <div className="flex justify-between items-baseline pt-1 border-t border-dashed border-black/15 mt-1">
            <span className="font-semibold">Total</span>
            <span className="font-display font-bold text-2xl tabnum">{fmtCLP(sale.total)}</span>
          </div>
        </div>
        <div className="p-4 flex gap-2">
          <Button variant="outline" className="flex-1"><I.download size={16}/> Imprimir</Button>
          <Button variant="dark" className="flex-[2]" onClick={onClose}>Nueva venta <I.plus size={16}/></Button>
        </div>
        <div className="text-center text-[10px] font-mono py-3 border-t border-dashed border-black/15" style={{color:'var(--ink-mute)'}}>
          {sale.cashier} · {sale.time} · Donde la Grob
        </div>
      </div>
    </Modal>
  );
}
