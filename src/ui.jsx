import { useState, useEffect, useRef } from 'react';
import { I } from './icons.jsx';

export function FoodPlaceholder({ label, color = 'mustard', className = '' }) {
  const palette = {
    tomato:  ['oklch(0.78 0.14 25)',  'oklch(0.72 0.17 25)'],
    mustard: ['oklch(0.88 0.14 85)',  'oklch(0.82 0.17 85)'],
    pickle:  ['oklch(0.8 0.12 145)',  'oklch(0.74 0.15 145)'],
    cream:   ['oklch(0.92 0.03 70)',  'oklch(0.86 0.05 70)'],
  }[color] || ['oklch(0.88 0.14 85)', 'oklch(0.82 0.17 85)'];
  return (
    <div className={`relative overflow-hidden ${className}`} style={{
      background: `repeating-linear-gradient(45deg, ${palette[0]} 0 10px, ${palette[1]} 10px 20px)`
    }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-black/50 bg-white/75 px-1.5 py-0.5 rounded">
          {label}
        </span>
      </div>
    </div>
  );
}

export function Logo({ size = 28, showText = true }) {
  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-[10px] rotate-3" style={{background:'var(--tomato)'}}/>
        <div className="absolute inset-0 rounded-[10px] -rotate-3 flex items-center justify-center font-display font-bold text-white" style={{background:'var(--ink)', fontSize: size*0.5}}>
          SVI
        </div>
      </div>
      {showText && (
        <div className="leading-none">
          <div className="font-display font-bold text-[15px]">SVI</div>
          <div className="text-[10px] uppercase tracking-[0.15em]" style={{color:'var(--ink-mute)'}}>pos completos</div>
        </div>
      )}
    </div>
  );
}

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`bg-white rounded-2xl border border-black/5 shadow-[0_1px_0_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(40,30,10,0.15)] ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...rest }) {
  const base = 'press inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors';
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-[15px]',
    lg: 'h-14 px-5 text-base',
  }[size];
  const variants = {
    primary: 'text-black hover:brightness-95',
    dark:    'text-white hover:brightness-110',
    ghost:   'bg-transparent text-[color:var(--ink)] hover:bg-black/5',
    outline: 'bg-white border border-black/10 text-[color:var(--ink)] hover:bg-black/5',
    tomato:  'text-white hover:brightness-110',
    success: 'text-white hover:brightness-110',
  }[variant];
  const style = {
    primary: { background: 'var(--mustard)' },
    dark:    { background: 'var(--ink)' },
    tomato:  { background: 'var(--tomato)' },
    success: { background: 'var(--pickle)' },
  }[variant] || {};
  return (
    <button className={`${base} ${sizes} ${variants} ${className}`} style={style} {...rest}>{children}</button>
  );
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`inline-flex p-1 rounded-xl bg-black/5 ${className}`}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`press h-8 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all ${active ? 'bg-white shadow-sm text-[color:var(--ink)]' : 'text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]'}`}>
            {o.icon}{o.label}
          </button>
        );
      })}
    </div>
  );
}

export function BarChart({ data, valueKey = 'v', labelKey = 'l', height = 120, color = 'var(--mustard)', secondary, secondaryColor = 'var(--ink)' }) {
  const ref = useRef(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...data.map(d => Math.max(d[valueKey], secondary ? d[secondary] : 0))) || 1;
  const n = data.length;
  const pad = 6;
  const groupW = (w - pad * 2) / n;
  const barW = secondary ? groupW * 0.35 : groupW * 0.6;
  return (
    <div ref={ref} className="w-full" style={{ height }}>
      <svg width={w} height={height} className="overflow-visible">
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={0} x2={w} y1={height - t*height} y2={height - t*height} stroke="black" strokeOpacity="0.06" strokeDasharray="2 3"/>
        ))}
        {data.map((d, i) => {
          const h1 = (d[valueKey] / max) * (height - 22);
          const h2 = secondary ? (d[secondary] / max) * (height - 22) : 0;
          const x = pad + i * groupW + groupW/2;
          return (
            <g key={i}>
              {secondary && (
                <rect x={x - barW - 2} y={height - 22 - h2} width={barW} height={h2} rx="3" fill={secondaryColor} opacity="0.18"/>
              )}
              <rect x={secondary ? x + 2 : x - barW/2} y={height - 22 - h1} width={barW} height={h1} rx="3" fill={color}/>
              <text x={x} y={height - 6} fontSize="10" fill="currentColor" opacity="0.55" textAnchor="middle" fontFamily="Inter">{d[labelKey]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function Donut({ segments, size = 140, thick = 22, label, sub }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = (size - thick) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="oklch(0.92 0.01 80)" strokeWidth={thick}/>
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={R} fill="none" stroke={s.color} strokeWidth={thick}
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} strokeLinecap="butt"/>
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs opacity-60">{sub}</div>
        <div className="font-display font-bold text-lg tabnum">{label}</div>
      </div>
    </div>
  );
}

export function LineChart({ data, keyA = 'esta', keyB = 'pasada', labelKey = 'd', height = 160 }) {
  const ref = useRef(null);
  const [w, setW] = useState(400);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  const max = Math.max(...data.map(d => Math.max(d[keyA], d[keyB]))) * 1.1;
  const min = 0;
  const pad = { l: 36, r: 10, t: 10, b: 22 };
  const ix = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const iy = (v) => pad.t + (1 - (v - min)/(max - min)) * (height - pad.t - pad.b);
  const pathA = data.map((d,i) => `${i?'L':'M'}${ix(i)},${iy(d[keyA])}`).join(' ');
  const pathB = data.map((d,i) => `${i?'L':'M'}${ix(i)},${iy(d[keyB])}`).join(' ');
  const areaA = pathA + ` L${ix(data.length-1)},${height-pad.b} L${ix(0)},${height-pad.b} Z`;
  return (
    <div ref={ref} className="w-full" style={{ height }}>
      <svg width={w} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="lcGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mustard)" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="var(--mustard)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={pad.l} x2={w-pad.r} y1={pad.t + t*(height-pad.t-pad.b)} y2={pad.t + t*(height-pad.t-pad.b)} stroke="black" strokeOpacity="0.06" strokeDasharray="2 3"/>
        ))}
        <path d={areaA} fill="url(#lcGrad)"/>
        <path d={pathB} fill="none" stroke="var(--ink)" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 4"/>
        <path d={pathA} fill="none" stroke="var(--mustard-deep)" strokeWidth="2.5"/>
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={ix(i)} cy={iy(d[keyA])} r="3" fill="white" stroke="var(--mustard-deep)" strokeWidth="2"/>
            <text x={ix(i)} y={height-6} fontSize="10" fill="currentColor" opacity="0.55" textAnchor="middle">{d[labelKey]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function Modal({ open, onClose, children, position = 'center', className = '' }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40"/>
      <div
        onClick={e => e.stopPropagation()}
        className={`absolute ${position === 'bottom' ? 'left-0 right-0 bottom-0 slide-up' : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'} ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function Chip({ active, children, onClick, color = 'mustard' }) {
  const activeBg = { mustard: 'var(--mustard)', tomato: 'var(--tomato)', pickle: 'var(--pickle)', ink: 'var(--ink)' }[color];
  return (
    <button onClick={onClick}
      className="press shrink-0 h-9 px-4 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
      style={active ? { background: activeBg, color: color === 'ink' || color === 'tomato' || color === 'pickle' ? 'white' : 'black' } : { background: 'white', color: 'var(--ink-soft)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)' }}>
      {children}
    </button>
  );
}

export function Toast({ msg, onDone }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  if (!msg) return null;
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full text-white text-sm font-semibold shadow-lg fade-in flex items-center gap-2"
         style={{ background: 'var(--ink)' }}>
      <I.check size={16}/> {msg}
    </div>
  );
}
