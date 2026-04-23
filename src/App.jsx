import { useReducer, useState, useEffect } from 'react';
import Shell from './Shell.jsx';
import LoginView from './views/Login.jsx';
import Dashboard from './views/Dashboard.jsx';
import POSView, { Receipt } from './views/POS.jsx';
import Productos from './views/Productos.jsx';
import Historial from './views/Historial.jsx';
import Estadisticas from './views/Estadisticas.jsx';

function detectViewport() {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function initialAppState() {
  return {
    view: 'dashboard',
    viewport: detectViewport(),
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

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, initialAppState);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const onResize = () => {
      const vp = detectViewport();
      dispatch({ type: 'VIEWPORT', viewport: vp });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onGo = (v) => dispatch({ type: 'GO', view: v });

  if (!state.auth) {
    return (
      <div className="h-full w-full relative overflow-hidden" style={{ background: 'var(--paper)' }}>
        <LoginView onLogin={(u) => dispatch({ type: 'LOGIN', user: u.user, role: u.role, apertura: u.apertura })} />
      </div>
    );
  }

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

  return (
    <div className="h-full w-full relative overflow-hidden">
      <Shell state={state} dispatch={dispatch} onGo={onGo}>{inner}</Shell>
      {receipt && <Receipt sale={receipt} onClose={()=>setReceipt(null)}/>}
    </div>
  );
}
