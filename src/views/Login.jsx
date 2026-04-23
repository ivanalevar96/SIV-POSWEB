import { useState } from 'react';
import { I } from '../icons.jsx';
import { Logo, Card, Button } from '../ui.jsx';
import { fmtCLP, nowHM } from '../data.js';
import { supabase } from '../lib/supabase.js';
import { getOpenSession, getLastClosingAmount, openCashSession } from '../hooks/useCashSession.js';

export default function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('login');
  const [apertura, setApertura] = useState('50000');
  const [profile, setProfile] = useState(null); // { first_name, role }
  const [openedByOther, setOpenedByOther] = useState(null); // nombre de quien abrió

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (signInErr) throw signInErr;

      // Traer perfil (rol + nombre)
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('first_name, role')
        .eq('id', data.user.id)
        .single();
      if (profErr) throw profErr;

      const first_name = prof?.first_name || (data.user.email?.split('@')[0] ?? 'Usuario');
      const role = prof?.role || 'cajero';
      setProfile({ first_name, role });

      // ¿Ya hay caja abierta?
      const open = await getOpenSession();
      if (open) {
        // Alguien ya abrió caja hoy → entrar directo
        let openedName = null;
        if (open.opened_by) {
          const { data: opener } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', open.opened_by)
            .single();
          openedName = opener?.first_name || 'otro cajero';
        }
        setOpenedByOther(openedName);
        onLogin({ user: first_name, role, apertura: open.opening_amount });
        return;
      }

      // No hay caja abierta → sugerir monto del último cierre
      const lastClose = await getLastClosingAmount();
      if (lastClose != null) setApertura(String(lastClose));
      setStep('apertura');
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    const amount = parseInt(apertura.replace(/\D/g, '') || '0', 10);
    try {
      await openCashSession(amount);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo abrir caja');
      return;
    }
    onLogin({
      user: profile.first_name,
      role: profile.role,
      apertura: amount,
    });
  };

  return (
    <div className="h-full w-full flex flex-col" style={{background:'var(--paper)'}}>
      <div className="relative overflow-hidden" style={{background:'var(--ink)', minHeight: 220}}>
        <div className="absolute inset-0 stripes-mustard opacity-20"/>
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full" style={{background:'var(--tomato)', opacity: 0.9}}/>
        <div className="absolute top-24 -left-10 w-40 h-40 rounded-full" style={{background:'var(--mustard)', opacity: 0.95}}/>
        <div className="relative z-10 p-6 flex items-start justify-between h-full">
          <div className="text-white">
            <Logo size={36}/>
            <div className="mt-8">
              <div className="font-display text-3xl md:text-4xl font-bold leading-[0.95]">Hola,<br/>¿listos para<br/>abrir caja?</div>
              <div className="text-white/70 text-sm mt-2 max-w-[22ch]">Inicia tu turno e ingresa el monto de apertura.</div>
            </div>
          </div>
          <div className="hidden md:block text-white/80 text-right">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em]">Turno</div>
            <div className="font-display text-xl font-semibold tabnum">{nowHM()}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 -mt-10 relative z-10">
        <Card className="p-5 md:p-6 max-w-md mx-auto">
          {step === 'login' && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="font-display font-bold text-xl">Iniciar sesión</div>
                <div className="text-sm" style={{color:'var(--ink-mute)'}}>Ingresa tus credenciales</div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Correo</label>
                <div className="mt-1.5 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"><I.user size={18}/></div>
                  <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
                    placeholder="tu@correo.cl"
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 text-[15px] ring-brand"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Contraseña</label>
                <div className="mt-1.5 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"><I.lock size={18}/></div>
                  <input type={showPass?'text':'password'} autoComplete="current-password" required value={pass} onChange={e=>setPass(e.target.value)}
                    className="w-full h-12 pl-10 pr-10 rounded-xl bg-[color:var(--paper-2)] border border-black/5 text-[15px] ring-brand"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]">
                    {showPass ? <I.eyeOff size={18}/> : <I.eye size={18}/>}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm rounded-xl px-3 py-2 border" style={{color:'var(--tomato-deep)', borderColor:'rgba(220,60,40,0.25)', background:'rgba(220,60,40,0.06)'}}>
                  {error}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
                {loading ? 'Entrando…' : <>Entrar <I.chevR size={18}/></>}
              </Button>

              <div className="pt-1 text-center text-xs" style={{color:'var(--ink-mute)'}}>
                ¿Olvidaste tu contraseña? <span className="underline">Contacta al administrador</span>
              </div>
            </form>
          )}

          {step === 'apertura' && (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--tomato-deep)'}}>Paso 2 de 2</div>
                <div className="font-display font-bold text-xl mt-1">Apertura de caja</div>
                <div className="text-sm" style={{color:'var(--ink-mute)'}}>
                  Hola <b className="capitalize">{profile?.first_name}</b> ({profile?.role}). Monto de efectivo con que inicias el turno.
                </div>
                <div className="text-[11px] mt-1" style={{color:'var(--pickle-deep, var(--ink-mute))'}}>
                  💡 Sugerido según el cierre anterior.
                </div>
              </div>
              <div className="rounded-2xl p-5 text-center" style={{background:'var(--cream)'}}>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Monto apertura (CLP)</div>
                <div className="mt-2 inline-flex items-baseline gap-1 font-display font-bold tabnum" style={{color:'var(--ink)'}}>
                  <span className="text-2xl">$</span>
                  <input value={fmtCLP(parseInt(apertura.replace(/\D/g,'')||'0',10)).replace('$','')}
                    onChange={e => setApertura(e.target.value)}
                    className="text-5xl font-display font-bold tabnum w-[8ch] text-center bg-transparent outline-none"/>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[30000, 50000, 80000, 100000].map(v => (
                    <button key={v} onClick={()=>setApertura(String(v))}
                      className="press h-9 px-3 rounded-full bg-white text-sm font-semibold border border-black/5">
                      {fmtCLP(v)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={()=>setStep('login')} className="flex-1"><I.arrowLeft size={16}/> Atrás</Button>
                <Button size="lg" onClick={finish} className="flex-[2]">Abrir caja <I.check size={18}/></Button>
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-black/5 text-[11px] font-mono uppercase tracking-wider flex justify-between" style={{color:'var(--ink-mute)'}}>
            <span>SVI v1.4</span>
            <span>Local Providencia</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
