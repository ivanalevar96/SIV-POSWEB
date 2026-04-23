import { useState, useEffect, useRef } from 'react';
import { I } from '../icons.jsx';
import { FoodPlaceholder, Card, Button, Modal, Chip } from '../ui.jsx';
import { fmtCLP } from '../data.js';
import { useProducts, useCategories, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../hooks/useCatalog.js';

export default function Productos({ state }) {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const isMobile = state.viewport === 'mobile';
  const { products, loading, reload } = useProducts();
  const { categories } = useCategories();
  const filtered = products.filter(p =>
    (cat==='all' || p.cat===cat) && p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(p) {
    if (!window.confirm(`¿Eliminar "${p.name}"? Se ocultará del catálogo; las ventas antiguas no se alteran.`)) return;
    try {
      await deleteProduct(p.id);
      reload();
    } catch (e) {
      alert(e.message || 'No se pudo eliminar el producto');
    }
  }
  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-display font-bold text-2xl md:text-3xl">Productos</div>
          <div className="text-xs" style={{color:'var(--ink-mute)'}}>{loading ? 'Cargando…' : `${products.length} productos · ${categories.length} categorías`}</div>
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
            {categories.map(c => <Chip key={c.id} active={cat===c.id} onClick={()=>setCat(c.id)} color={c.color}>{c.name}</Chip>)}
          </div>
        </div>
      </Card>

      {!isMobile ? (
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[80px_2fr_1fr_1fr_110px_110px_80px] px-4 py-3 border-b border-black/5 text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)', background:'var(--paper-2)'}}>
            <div></div><div>Producto</div><div>Categoría</div><div>Precio</div><div>Stock</div><div>Estado</div><div className="text-right">Acciones</div>
          </div>
          {filtered.map(p => {
            const c = categories.find(x=>x.id===p.cat) || { color:'mustard', name:'—' };
            const low = p.stock < 30;
            return (
              <div key={p.id} className="grid grid-cols-[80px_2fr_1fr_1fr_110px_110px_80px] px-4 py-3 border-b border-black/5 items-center hover:bg-black/[0.02]">
                <FoodPlaceholder label={p.name.split(' ')[0]} img={p.img} color={c.color} className="w-14 h-14 rounded-xl"/>
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
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={()=>setEditing(p)} className="w-8 h-8 rounded-lg hover:bg-black/5 press flex items-center justify-center" title="Editar"><I.edit size={16}/></button>
                  <button onClick={()=>handleDelete(p)} className="w-8 h-8 rounded-lg hover:bg-[oklch(0.95_0.08_25)] press flex items-center justify-center" title="Eliminar" style={{color:'var(--tomato-deep)'}}><I.trash size={16}/></button>
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const c = categories.find(x=>x.id===p.cat) || { color:'mustard', name:'—' };
            const low = p.stock < 30;
            return (
              <Card key={p.id} className="p-3 flex items-center gap-3">
                <FoodPlaceholder label={p.name.split(' ')[0]} img={p.img} color={c.color} className="w-14 h-14 rounded-xl shrink-0"/>
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
                <button onClick={()=>setEditing(p)} className="w-9 h-9 rounded-lg bg-black/5 press flex items-center justify-center" title="Editar"><I.edit size={16}/></button>
                <button onClick={()=>handleDelete(p)} className="w-9 h-9 rounded-lg press flex items-center justify-center" title="Eliminar" style={{background:'oklch(0.95 0.08 25)', color:'var(--tomato-deep)'}}><I.trash size={16}/></button>
              </Card>
            );
          })}
        </div>
      )}

      {openForm && <ProductForm onClose={()=>setOpenForm(false)} onSaved={reload} fullscreen={isMobile} categories={categories}/>}
      {editing && <ProductForm product={editing} onClose={()=>setEditing(null)} onSaved={reload} fullscreen={isMobile} categories={categories}/>}
    </div>
  );
}

function parsePriceInput(v) {
  if (v == null) return null;
  const digits = String(v).replace(/\D+/g, '');
  return digits ? Number(digits) : null;
}

function ProductForm({ product, onClose, onSaved, fullscreen, categories = [] }) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.desc || '');
  const [categoryId, setCategoryId] = useState(product?.cat || '');
  const [price, setPrice] = useState(product?.price != null ? String(product.price) : '');
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : '');
  const [hasSizes, setHasSizes] = useState(!!(product?.sizes && product.sizes.length));
  const [sizes, setSizes] = useState(
    product?.sizes && product.sizes.length
      ? product.sizes.map(s => ({ name: s.name, price: String(s.price) }))
      : [{ name: 'Mediana', price: '' }]
  );
  const [imageUrl, setImageUrl] = useState(product?.img || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setImageUrl(url);
    } catch (err) {
      setError(err.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!categoryId && categories.length) setCategoryId(categories[0].id);
  }, [categories, categoryId]);

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        category_id: categoryId,
        price: hasSizes ? null : parsePriceInput(price),
        stock: stock === '' ? 0 : Number(stock),
        image_url: imageUrl || null,
        sizes: hasSizes
          ? sizes
              .map(s => ({ name: s.name.trim(), price: parsePriceInput(s.price) }))
              .filter(s => s.name && s.price > 0)
          : null,
      };
      if (hasSizes && (!payload.sizes || payload.sizes.length === 0)) {
        throw new Error('Agrega al menos un tamaño con nombre y precio');
      }
      if (isEdit) await updateProduct(product.id, payload);
      else await createProduct(payload);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} position={fullscreen?'bottom':'center'}
      className={fullscreen ? 'inset-0 w-full h-full bg-white overflow-y-auto' : 'w-[520px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white'}>
      <div className={fullscreen ? 'min-h-full flex flex-col' : ''}>
        <div className="p-5 flex items-center justify-between border-b border-black/5 sticky top-0 bg-white z-10">
          <div className="font-display font-bold text-lg">{isEdit ? 'Editar producto' : 'Nuevo producto'}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center press"><I.x size={18}/></button>
        </div>
        <div className="p-5 space-y-4 flex-1">
          {error && (
            <div className="rounded-xl px-3 py-2 text-sm" style={{background:'oklch(0.95 0.08 25)', color:'var(--tomato-deep)'}}>
              {error}
            </div>
          )}
          <Field label="Imagen">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden h-32 bg-black/5">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover"/>
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading}
                    className="px-2 h-8 rounded-full bg-white/90 text-xs font-semibold press inline-flex items-center gap-1">
                    <I.edit size={12}/> Cambiar
                  </button>
                  <button type="button" onClick={()=>setImageUrl('')} disabled={uploading}
                    className="w-8 h-8 rounded-full bg-white/90 press flex items-center justify-center" title="Quitar">
                    <I.x size={14}/>
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={()=>fileInputRef.current?.click()} disabled={uploading}
                className="stripes rounded-xl h-32 w-full flex flex-col items-center justify-center gap-1 text-xs font-mono uppercase tracking-wider press" style={{color:'var(--ink-mute)'}}>
                {uploading ? 'Subiendo…' : <><I.plus size={18}/> Click para subir imagen</>}
              </button>
            )}
            <div className="text-[10px] mt-1" style={{color:'var(--ink-mute)'}}>JPG / PNG / WebP · máx 5 MB</div>
          </Field>
          <Field label="Nombre">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Completo Italiano" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 ring-brand"/>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Categoría">
              <select value={categoryId} onChange={e=>setCategoryId(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Stock inicial">
              <input type="number" value={stock} onChange={e=>setStock(e.target.value)} placeholder="0" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 tabnum"/>
            </Field>
          </div>
          <Field label="Descripción">
            <textarea rows={2} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Palta, tomate, mayo casera…" className="w-full p-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 resize-none"/>
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
              <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="$ 3.500" className="w-full h-11 px-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 tabnum font-display font-bold"/>
            </Field>
          ) : (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Tamaños y precios</label>
              <div className="mt-1.5 space-y-2">
                {sizes.map((s,i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2">
                    <input value={s.name} onChange={e=>{const n=[...sizes]; n[i].name=e.target.value; setSizes(n);}} placeholder="Nombre" className="h-10 px-3 rounded-lg bg-[color:var(--paper-2)] border border-black/5"/>
                    <input value={s.price} onChange={e=>{const n=[...sizes]; n[i].price=e.target.value; setSizes(n);}} placeholder="Precio" className="h-10 px-3 rounded-lg bg-[color:var(--paper-2)] border border-black/5 tabnum"/>
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
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button variant="dark" className="flex-[2]" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Guardar producto')}
          </Button>
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
