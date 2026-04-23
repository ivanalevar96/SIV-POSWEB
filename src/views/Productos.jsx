import { useState } from 'react';
import { I } from '../icons.jsx';
import { FoodPlaceholder, Card, Button, Modal, Chip } from '../ui.jsx';
import { PRODUCTS, CATEGORIES, fmtCLP } from '../data.js';

export default function Productos({ state }) {
  const [openForm, setOpenForm] = useState(false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const isMobile = state.viewport === 'mobile';
  const filtered = PRODUCTS.filter(p =>
    (cat==='all' || p.cat===cat) && p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Productos</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>{PRODUCTS.length} productos · {CATEGORIES.length} categorías</div>
        </div>
        <Button variant="dark" onClick={()=>setOpenForm(true)}><I.plus size={16}/> {isMobile?'':'Agregar producto'}</Button>
      </div>

      <Card className="p-3 md:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <I.search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nombre…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 text-sm ring-brand"/>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Chip active={cat==='all'} onClick={()=>setCat('all')} color="ink">Todas</Chip>
            {CATEGORIES.map(c => <Chip key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} color={c.color}>{c.name}</Chip>)}
          </div>
        </div>
      </Card>

      {!isMobile ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_110px_110px_40px] px-4 py-3 border-b border-black/5 text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)', background:'var(--paper-2)'}}>
            <div></div><div>Producto</div><div>Categoría</div><div>Precio</div><div>Stock</div><div>Estado</div><div></div>
          </div>
          {filtered.map(p => {
            const c = CATEGORIES.find(x=>x.id===p.cat);
            const low = p.stock < 30;
            return (
              <div key={p.id} className="grid grid-cols-[80px_2fr_1fr_1fr_110px_110px_40px] px-4 py-3 border-b border-black/5 items-center hover:bg-black/[0.02]">
                <FoodPlaceholder label={p.name.split(' ')[0]} color={c.color} className="w-14 h-14 rounded-xl"/>
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs line-clamp-1" style={{color:'var(--ink-mute)'}}>{p.desc}</div>
                </div>
                <div className="text-sm inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{background: c.color==='tomato'?'var(--tomato)':c.color==='pickle'?'var(--pickle)':'var(--mustard)'}}/>
                  {c.name}
                </div>
                <div className="font-display font-semibold tabnum">
                  {p.sizes
                    ? <span className="text-sm">{fmtCLP(p.sizes[0].price)}<span className="text-xs font-normal" style={{color:'var(--ink-mute)'}}> – {fmtCLP(p.sizes[p.sizes.length-1].price)}</span></span>
                    : fmtCLP(p.price)}
                </div>
                <div className={`tabnum font-semibold text-sm ${low?'text-[color:var(--tomato-deep)]':''}`}>{p.stock} u.</div>
                <div>
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={low?{background:'oklch(0.93 0.12 25)',color:'var(--tomato-deep)'}:{background:'oklch(0.92 0.1 145)',color:'oklch(0.35 0.1 145)'}}>
                    {low ? 'Bajo' : 'Activo'}
                  </span>
                </div>
                <button className="w-8 h-8 rounded-lg hover:bg-black/5 press flex items-center justify-center"><I.dots size={18}/></button>
              </div>
            );
          })}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const c = CATEGORIES.find(x=>x.id===p.cat);
            const low = p.stock < 30;
            return (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <FoodPlaceholder label={p.name.split(' ')[0]} color={c.color} className="w-14 h-14 rounded-xl shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    {low && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase" style={{background:'oklch(0.93 0.12 25)',color:'var(--tomato-deep)'}}>Bajo</span>}
                  </div>
                  <div className="text-[11px]" style={{color:'var(--ink-mute)'}}>{c.name} · {p.stock}u.</div>
                  <div className="font-display font-bold text-sm tabnum mt-0.5">
                    {p.sizes ? `${fmtCLP(p.sizes[0].price)} – ${fmtCLP(p.sizes[p.sizes.length-1].price)}` : fmtCLP(p.price)}
                  </div>
                </div>
                <button className="w-9 h-9 rounded-lg bg-black/5 press flex items-center justify-center"><I.dots size={18}/></button>
              </Card>
            );
          })}
        </div>
      )}

      {openForm && <ProductForm onClose={()=>setOpenForm(false)} fullscreen={isMobile}/>}
    </div>
  );
}

function ProductForm({ onClose, fullscreen }) {
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes] = useState([{ name: 'Mediana', price: '' }]);
  return (
    <Modal open onClose={onClose} position={fullscreen?'bottom':'center'}
      className={fullscreen ? 'inset-0 w-full h-full bg-white overflow-y-auto' : 'w-[520px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white'}>
      <div className={fullscreen ? 'min-h-full flex flex-col' : ''}>
        <div className="p-5 flex items-center justify-between border-b border-black/5 sticky top-0 bg-white z-10">
          <div className="font-display font-bold text-lg">Nuevo producto</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
        </div>
        <div className="p-5 space-y-4 flex-1">
          <Field label="Imagen">
            <div className="stripes rounded-xl h-32 flex items-center justify-center text-xs font-mono uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
              Click para subir imagen
            </div>
          </Field>
          <Field label="Nombre">
            <input placeholder="Completo Italiano" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 ring-brand"/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5">
                {CATEGORIES.map(c => <option key={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Stock inicial">
              <input type="number" placeholder="0" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 tabnum"/>
            </Field>
          </div>
          <Field label="Descripción">
            <textarea rows={2} placeholder="Palta, tomate, mayo casera…" className="w-full p-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 resize-none"/>
          </Field>

          <div className="rounded-xl p-3 flex items-center justify-between" style={{background:'var(--paper-2)'}}>
            <div>
              <div className="font-semibold text-sm">¿Tiene tamaños?</div>
              <div className="text-xs" style={{color:'var(--ink-mute)'}}>Ej: Chica / Mediana / Grande</div>
            </div>
            <button onClick={()=>setHasSizes(s=>!s)}
              className="w-12 h-7 rounded-full relative transition-colors press"
              style={{background: hasSizes ? 'var(--ink)' : 'rgba(0,0,0,0.15)'}}>
              <span className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform" style={{transform: hasSizes?'translateX(20px)':''}}/>
            </button>
          </div>

          {!hasSizes ? (
            <Field label="Precio (CLP)">
              <input placeholder="$ 3.500" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 tabnum font-display font-bold"/>
            </Field>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Tamaños y precios</label>
              <div className="mt-1.5 space-y-2">
                {sizes.map((s,i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                    <input value={s.name} onChange={e=>{const n=[...sizes]; n[i].name=e.target.value; setSizes(n);}} placeholder="Nombre" className="h-10 px-3 rounded-lg bg-[color:var(--paper-2)] border border-black/5"/>
                    <input placeholder="Precio" className="h-10 px-3 rounded-lg bg-[color:var(--paper-2)] border border-black/5 tabnum"/>
                    <button onClick={()=>setSizes(sizes.filter((_,j)=>j!==i))} className="w-10 h-10 rounded-lg bg-black/5 press flex items-center justify-center"><I.trash size={14}/></button>
                  </div>
                ))}
                <button onClick={()=>setSizes([...sizes,{name:'',price:''}])} className="press w-full h-10 rounded-lg border-2 border-dashed border-black/15 text-sm font-semibold" style={{color:'var(--ink-mute)'}}>
                  + Agregar tamaño
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-black/5 flex gap-2 sticky bottom-0 bg-white">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button variant="dark" className="flex-[2]" onClick={onClose}>Guardar producto</Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
