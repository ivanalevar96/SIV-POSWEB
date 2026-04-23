import { useState } from 'react';
import { I } from './icons.jsx';
import { Logo } from './ui.jsx';

export default function Shell({ state, dispatch, children, onGo }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = state.viewport === 'mobile';
  const isTablet = state.viewport === 'tablet';
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: I.home },
    { id: 'pos',       label: 'Nueva Venta', icon: I.cart, fab: true },
    { id: 'productos', label: 'Productos', icon: I.grid },
    { id: 'historial', label: 'Historial', icon: I.receipt },
    { id: 'estadisticas', label: 'Estadísticas', icon: I.chart },
  ];

  return (
    <div className="flex h-full">
      {!isMobile && (
        <aside className={`shrink-0 border-r border-black/5 flex flex-col ${isTablet?'w-[76px]':'w-[240px]'}`} style={{background:'var(--ink)', color:'white'}}>
          <div className={`p-5 ${isTablet?'flex justify-center':''}`}>
            <Logo size={32} showText={!isTablet}/>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map(it => {
              const Icn = it.icon;
              const active = state.view === it.id;
              return (
                <button key={it.id} onClick={()=>onGo(it.id)}
                  className={`press w-full h-11 rounded-xl flex items-center gap-3 ${isTablet?'justify-center':'px-3'} ${active?'':'hover:bg-white/5'}`}
                  style={active?{background:'var(--mustard)', color:'black'}:{color:'rgba(255,255,255,0.7)'}}>
                  <Icn size={20}/>
                  {!isTablet && <span className="text-sm font-semibold">{it.label}</span>}
                </button>
              );
            })}
          </nav>
          <div className={`p-3 border-t border-white/10 ${isTablet?'flex justify-center':''}`}>
            {isTablet ? (
              <div className="flex flex-col gap-2">
                <button onClick={()=>dispatch({type:'OPEN_CLOSE_CASH'})} title="Cerrar caja" className="press w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/5" style={{color:'var(--tomato)'}}>
                  <I.cash size={20}/>
                </button>
                <button onClick={()=>dispatch({type:'LOGOUT'})} title="Cerrar sesión" className="press w-11 h-11 rounded-xl flex items-center justify-center hover:bg-white/5" style={{color:'rgba(255,255,255,0.7)'}}>
                  <I.logout size={20}/>
                </button>
              </div>
            ) : (
              <>
                <button onClick={()=>dispatch({type:'OPEN_CLOSE_CASH'})}
                  className="press w-full h-10 mb-2 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                  style={{background:'rgba(220,60,40,0.12)', color:'var(--tomato)'}}>
                  <I.cash size={16}/> Cerrar caja
                </button>
                <div className="rounded-xl p-3 bg-white/5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-display font-bold" style={{background:'var(--mustard)', color:'black'}}>
                    {state.user.first[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{state.user.first}</div>
                    <div className="text-[11px] text-white/50 capitalize">{state.user.role}</div>
                  </div>
                  <button onClick={()=>dispatch({type:'LOGOUT'})} title="Cerrar sesión" className="press w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center" style={{color:'rgba(255,255,255,0.7)'}}>
                    <I.logout size={16}/>
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative" style={{background:'var(--paper)'}}>
        {isMobile && (
          <header className="flex items-center justify-between px-4 h-14 border-b border-black/5 bg-white/90 backdrop-blur sticky top-0 z-20">
            <button onClick={()=>setMenuOpen(true)} className="press w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center"><I.menu size={20}/></button>
            <Logo size={26}/>
            <button className="press w-9 h-9 rounded-lg bg-black/5 flex items-center justify-center relative">
              <I.bell size={18}/>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{background:'var(--tomato)'}}/>
            </button>
          </header>
        )}

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {isMobile && (
          <nav className="absolute bottom-0 left-0 right-0 z-30">
            <div className="relative h-[72px]">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 72" preserveAspectRatio="none">
                <path d="M0,0 L155,0 C165,0 168,18 175,24 C182,30 208,30 215,24 C222,18 225,0 235,0 L390,0 L390,72 L0,72 Z" fill="white"/>
              </svg>
              <div className="absolute inset-0 flex items-end justify-around px-2 pb-2">
                {navItems.map((it) => {
                  const Icn = it.icon;
                  const active = state.view === it.id;
                  if (it.fab) {
                    return (
                      <button key={it.id} onClick={()=>onGo(it.id)} className="press relative -mt-7 shrink-0">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl" style={{background:'var(--tomato)', color:'white'}}>
                          <I.plus size={26}/>
                        </div>
                        <div className="text-[10px] font-bold mt-1 text-center uppercase tracking-wider" style={{color:'var(--tomato-deep)'}}>Venta</div>
                      </button>
                    );
                  }
                  return (
                    <button key={it.id} onClick={()=>onGo(it.id)} className="press flex flex-col items-center gap-0.5 pt-2 pb-1 w-14">
                      <Icn size={20} style={{color: active?'var(--ink)':'oklch(0.6 0.015 60)'}}/>
                      <div className="text-[9.5px] font-semibold uppercase tracking-wider" style={{color: active?'var(--ink)':'oklch(0.6 0.015 60)'}}>
                        {it.label.split(' ')[0]}
                      </div>
                      {active && <div className="w-1 h-1 rounded-full" style={{background:'var(--tomato)'}}/>}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>
        )}

        {menuOpen && (
          <div className="absolute inset-0 z-50 fade-in" onClick={()=>setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/40"/>
            <div className="absolute top-0 left-0 bottom-0 w-[78%] max-w-[300px] slide-up" style={{background:'var(--ink)', color:'white'}} onClick={e=>e.stopPropagation()}>
              <div className="p-5 flex items-center justify-between">
                <Logo size={32}/>
                <button onClick={()=>setMenuOpen(false)} className="press w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center"><I.x size={18}/></button>
              </div>
              <div className="px-3 mt-4 space-y-1">
                {navItems.map(it => {
                  const Icn = it.icon;
                  const active = state.view === it.id;
                  return (
                    <button key={it.id} onClick={()=>{onGo(it.id); setMenuOpen(false);}}
                      className="press w-full h-12 rounded-xl flex items-center gap-3 px-4"
                      style={active?{background:'var(--mustard)',color:'black'}:{color:'rgba(255,255,255,0.8)'}}>
                      <Icn size={20}/>
                      <span className="text-sm font-semibold">{it.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-white/10 space-y-3">
                <button onClick={()=>{ dispatch({type:'OPEN_CLOSE_CASH'}); setMenuOpen(false); }}
                  className="press w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
                  style={{background:'rgba(220,60,40,0.15)', color:'var(--tomato)'}}>
                  <I.cash size={16}/> Cerrar caja
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold" style={{background:'var(--mustard)', color:'black'}}>
                    {state.user.first[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{state.user.first}</div>
                    <div className="text-[11px] text-white/50 capitalize">{state.user.role}</div>
                  </div>
                  <button onClick={()=>dispatch({type:'LOGOUT'})} className="press w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <I.logout size={16}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
