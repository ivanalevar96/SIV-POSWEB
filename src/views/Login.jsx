import { useState } from 'react';
import { I } from '../icons.jsx';
import { Logo, Card, Button } from '../ui.jsx';
import { fmtCLP, nowHM } from '../data.js';

export default function LoginView({ onLogin }) {
  const [user, setUser] = useState('cata.fuentes');
  const [pass, setPass] = useState('••••••');
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('login');
  const [apertura, setApertura] = useState('50000');

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('apertura');
    }, 600);
  };

  const finish = () => {
    const amount = parseInt(apertura.replace(/\D/g,'') || '0', 10);
    onLogin({ user, role, apertura: amount });
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
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Usuario</label>
                <div className="mt-1.5 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"><I.user size={18}/></div>
                  <input value={user} onChange={e=>setUser(e.target.value)}
                    className="w-full h-12 pl-10 pr-3 rounded-xl bg-[color:var(--paper-2)] border border-black/5 text-[15px] ring-brand"/>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Contraseña</label>
                <div className="mt-1.5 relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]"><I.lock size={18}/></div>
                  <input type={showPass?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)}
                    className="w-full h-12 pl-10 pr-10 rounded-xl bg-[color:var(--paper-2)] border border-black/5 text-[15px] ring-brand"/>
                  <button type="button" onClick={()=>setShowPass(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-mute)]">
                    {showPass ? <I.eyeOff size={18}/> : <I.eye size={18}/>}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider" style={{color:'var(--ink-mute)'}}>Rol</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {['admin','cajero'].map(r => (
                    <button key={r} type="button" onClick={()=>setRole(r)}
                      className={`press h-11 rounded-xl font-semibold text-sm capitalize border transition-all`}
                      style={role===r
                        ? { background:'var(--ink)', color:'white', borderColor:'var(--ink)'}
                        : { background:'white', color:'var(--ink-soft)', borderColor:'rgba(0,0,0,0.08)'}}>
                      {r === 'admin' ? 'Administrador' : 'Cajero'}
                    </button>
                  ))}
                </div>
              </div>

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
                <div className="text-sm" style={{color:'var(--ink-mute)'}}>Monto de efectivo con que inicias el turno.</div>
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
