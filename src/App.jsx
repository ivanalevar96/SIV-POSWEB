import { useReducer, useState, useEffect } from 'react';
import Shell from './Shell.jsx';
import LoginView from './views/Login.jsx';
import Dashboard from './views/Dashboard.jsx';
import POSView, { Receipt } from './views/POS.jsx';
import Productos from './views/Productos.jsx';
import Historial from './views/Historial.jsx';
import Estadisticas from './views/Estadisticas.jsx';
import { supabase } from './lib/supabase.js';
import { getOpenSession, closeCashSession } from './hooks/useCashSession.js';
import CloseCashModal from './components/CloseCashModal.jsx';

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
    authReady: false,
    user: { first: '', role: 'cajero' },
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
    case 'AUTH_READY':
      return { ...state, authReady: true };
    case 'LOGIN': {
      const raw = (action.user || '').trim();
      const first = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Usuario';
      return {
        ...state,
        auth: true,
        user: { first, role: action.role },
        openingAmount: action.apertura,
        summary: { ...state.summary, openingAmount: action.apertura },
      };
    }
    case 'LOGOUT':
      return { ...state, auth: false, cart: [], user: { first: '', role: 'cajero' } };
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

  // Resize → viewport
  useEffect(() => {
    const onResize = () => dispatch({ type: 'VIEWPORT', viewport: detectViewport() });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Restaurar sesión persistida y escuchar cambios de auth
  useEffect(() => {
    let cancelled = false;

    const restoreFromSession = async (session) => {
      if (!session?.user) {
        if (!cancelled) dispatch({ type: 'AUTH_READY' });
        return;
      }
      // Traer perfil + caja abierta en paralelo
      const [{ data: prof }, openCash] = await Promise.all([
        supabase.from('profiles').select('first_name, role').eq('id', session.user.id).single(),
        getOpenSession(),
      ]);
      if (cancelled) return;

      // Si no hay caja abierta, forzamos re-login para que pase por apertura
      if (!openCash) {
        await supabase.auth.signOut();
        dispatch({ type: 'AUTH_READY' });
        return;
      }

      const first = prof?.first_name || session.user.email?.split('@')[0] || 'Usuario';
      const role = prof?.role || 'cajero';

      dispatch({ type: 'LOGIN', user: first, role, apertura: openCash.opening_amount });
      dispatch({ type: 'AUTH_READY' });
    };

    supabase.auth.getSession().then(({ data }) => restoreFromSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'LOGOUT' });
      if (event === 'TOKEN_REFRESHED' && session) {/* nada, sigue logueado */}
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const [closeModalOpen, setCloseModalOpen] = useState(false);

  // Interceptar LOGOUT para llamar a supabase.auth.signOut()
  const wrappedDispatch = (action) => {
    if (action.type === 'LOGOUT') {
      supabase.auth.signOut().catch(console.error);
    }
    if (action.type === 'OPEN_CLOSE_CASH') {
      setCloseModalOpen(true);
      return;
    }
    dispatch(action);
  };

  const onGo = (v) => dispatch({ type: 'GO', view: v });

  if (!state.authReady) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: 'var(--paper)' }}>
        <div className="text-sm font-mono uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Cargando…</div>
      </div>
    );
  }

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
      case 'pos':          return <POSView state={state} dispatch={wrappedDispatch} onReceipt={(s)=>{ dispatch({type:'CHECKOUT', sale:s}); setReceipt(s); }}/>;
      case 'productos':    return <Productos state={state}/>;
      case 'historial':    return <Historial state={state}/>;
      case 'estadisticas': return <Estadisticas state={state}/>;
      default: return null;
    }
  })();

  return (
    <div className="h-full w-full relative overflow-hidden">
      <Shell state={state} dispatch={wrappedDispatch} onGo={onGo}>{inner}</Shell>
      {receipt && <Receipt sale={receipt} onClose={()=>setReceipt(null)}/>}
      {closeModalOpen && (
        <CloseCashModal
          state={state}
          onCancel={()=>setCloseModalOpen(false)}
          onConfirmed={async () => {
            setCloseModalOpen(false);
            // Al cerrar caja, forzar logout para que el próximo usuario abra de nuevo
            await supabase.auth.signOut();
            dispatch({ type: 'LOGOUT' });
          }}
        />
      )}
    </div>
  );
}
