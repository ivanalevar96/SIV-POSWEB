import { useReducer, useState, useEffect } from 'react';
import { I } from './icons.jsx';
import { Segmented } from './ui.jsx';
import Shell from './Shell.jsx';
import LoginView from './views/Login.jsx';
import Dashboard from './views/Dashboard.jsx';
import POSView, { Receipt } from './views/POS.jsx';
import Productos from './views/Productos.jsx';
import Historial from './views/Historial.jsx';
import Estadisticas from './views/Estadisticas.jsx';

function initialAppState() {
  return {
    view: 'dashboard',
    viewport: 'mobile',
    auth: false,
    user: { first: 'Cata', role: 'admin' },
    openingAmount: 0,
    cart: [],
    salesToday: 8,
    summary: {
      openingAmount: 50000,
      cashSales: 112400,
      cardSales: 186300,
      sales: 42,
      cash: 162400,
    },
  };
}

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, auth: true, user: { first: action.user.split('.')[0].replace(/^./, c=>c.toUpperCase()), role: action.role }, openingAmount: action.apertura, summary: { ...state.summary, openingAmount: action.apertura } };
    case 'LOGOUT': return { ...state, auth: false, cart: [] };
    case 'GO': return { ...state, view: action.view };
    case 'VIEWPORT': return { ...state, viewport: action.viewport };
    case 'ADD': {
      const existing = state.cart.find(i => i.key === action.key);
      if (existing) return { ...state, cart: state.cart.map(i => i.key===action.key ? {...i, qty: i.qty+1} : i) };
      return { ...state, cart: [...state.cart, { ...action.item, qty: 1 }] };
    }
    case 'INC': return { ...state, cart: state.cart.map(i => i.key===action.key ? {...i, qty: i.qty+1} : i) };
    case 'DEC': return { ...state, cart: state.cart.flatMap(i => i.key===action.key ? (i.qty>1?[{...i, qty: i.qty-1}]:[]) : [i]) };
    case 'CLEAR': return { ...state, cart: [] };
    case 'CHECKOUT': return {
      ...state, cart: [], salesToday: state.salesToday + 1,
      summary: {
        ...state.summary,
        sales: state.summary.sales + 1,
        cashSales: state.summary.cashSales + (action.sale.method==='efectivo'?action.sale.total:0),
        cardSales: state.summary.cardSales + (action.sale.method==='tarjeta'?action.sale.total:0),
      }
    };
    default: return state;
  }
}

function ViewportSwitcher({ viewport, onChange }) {
  return (
    <Segmented
      value={viewport} onChange={onChange}
      options={[
        { value: 'mobile',  label: 'Mobile',  icon: <I.phone size={14}/> },
        { value: 'tablet',  label: 'Tablet',  icon: <I.tablet size={14}/> },
        { value: 'desktop', label: 'Desktop', icon: <I.desktop size={14}/> },
      ]}
    />
  );
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialAppState);
  const [receipt, setReceipt] = useState(null);

  const onGo = (v) => dispatch({ type: 'GO', view: v });

  const frames = {
    mobile:  { w: 390,  h: 780 },
    tablet:  { w: 820,  h: 680 },
    desktop: { w: 1280, h: 780 },
  };
  const frame = frames[state.viewport];

  const view = (() => {
    if (!state.auth) return <LoginView onLogin={(u)=>dispatch({type:'LOGIN', user:u.user, role:u.role, apertura:u.apertura})}/>;
    const inner = (() => {
      switch (state.view) {
        case 'dashboard':    return <Dashboard state={state} onGo={onGo}/>;
        case 'pos':          return <POSView state={state} dispatch={dispatch} onReceipt={(s)=>{ dispatch({type:'CHECKOUT', sale:s}); setReceipt(s); }}/>;
        case 'productos':    return <Productos state={state}/>;
        case 'historial':    return <Historial state={state}/>;
        case 'estadisticas': return <Estadisticas state={state}/>;
        default: return null;
      }
    })();
    return <Shell state={state} dispatch={dispatch} onGo={onGo}>{inner}</Shell>;
  })();

  const isMobileFrame = state.viewport === 'mobile';

  return (
    <div className="h-full w-full stage-bg flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 bg-white/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="font-display font-bold text-sm">SVI POS</div>
          <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/5" style={{color:'var(--ink-mute)'}}>
            Prototype · {state.auth ? state.view : 'login'}
          </span>
        </div>
        <ViewportSwitcher viewport={state.viewport} onChange={(v)=>dispatch({type:'VIEWPORT', viewport:v})}/>
        <div className="text-[11px] font-mono uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>
          {state.viewport}: {frame.w}×{frame.h}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="device-frame" style={{ width: frame.w, height: frame.h, maxWidth: '100%' }}>
          {isMobileFrame && <div className="notch"/>}
          <div className="h-full relative overflow-hidden">
            {view}
            {receipt && <Receipt sale={receipt} onClose={()=>setReceipt(null)}/>}
          </div>
        </div>
      </div>
    </div>
  );
}
