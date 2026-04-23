import { useState } from 'react';
import { I } from '../icons.jsx';
import { Logo, Button } from '../ui.jsx';
import { fmtCLP } from '../data.js';
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
    <div className="h-full w-full flex items-center justify-center px-5" style={{background:'var(--paper)'}}>
      <div className="w-full max-w-sm">
        {step === 'login' && (
          <form onSubmit={submit} className="space-y-5">
            <div className="flex justify-center mb-2">
              <Logo size={40}/>
            </div>

            <div className="space-y-3">
              <input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="Correo"
                className="w-full h-12 px-4 rounded-xl bg-white border border-black/10 text-[15px] ring-brand placeholder:text-[color:var(--ink-mute)]"/>

              <div className="relative">
                <input type={showPass?'text':'password'} autoComplete="current-password" required value={pass} onChange={e=>setPass(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full h-12 pl-4 pr-11 rounded-xl bg-white border border-black/10 text-[15px] ring-brand placeholder:text-[color:var(--ink-mute)]"/>
                <button type="button" onClick={()=>setShowPass(s=>!s)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
                  {showPass ? <I.eyeOff size={18}/> : <I.eye size={18}/>}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-center" style={{color:'var(--tomato-deep)'}}>
                {error}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>
        )}

        {step === 'apertura' && (
          <div className="space-y-5">
            <div className="text-center">
              <div className="text-[11px] font-mono uppercase tracking-[0.25em]" style={{color:'var(--ink-mute)'}}>Apertura</div>
              <div className="font-display font-bold text-2xl mt-1 capitalize">Hola, {profile?.first_name}</div>
            </div>

            <div className="text-center py-6">
              <div className="inline-flex items-baseline gap-1 font-display font-bold tabnum" style={{color:'var(--ink)'}}>
                <span className="text-2xl" style={{color:'var(--ink-mute)'}}>$</span>
                <input value={fmtCLP(parseInt(apertura.replace(/\D/g,'')||'0',10)).replace('$','')}
                  onChange={e => setApertura(e.target.value)}
                  className="text-5xl font-display font-bold tabnum w-[8ch] text-center bg-transparent outline-none"/>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {[30000, 50000, 80000, 100000].map(v => (
                  <button key={v} type="button" onClick={()=>setApertura(String(v))}
                    className="press h-8 px-3 rounded-full text-xs font-semibold border border-black/10 hover:border-black/30">
                    {fmtCLP(v)}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-xs text-center" style={{color:'var(--tomato-deep)'}}>{error}</div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={()=>setStep('login')} className="flex-1">Atrás</Button>
              <Button size="lg" onClick={finish} className="flex-[2]">Abrir caja</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
