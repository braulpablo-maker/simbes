/**
 * SIMBES — Módulo 3: Gas y Flujo Multifásico
 * ============================================
 * Física: GVF, gas lock, degradación H-Q, separadores AGS, corrección HI de viscosidad.
 */
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceDot,
} from 'recharts';
import {
  gasVolumeFraction, hqGasDegradation,
  gasSeparatorEfficiency, hiViscosityCorrection,
} from '../../../physics/gas';
import {
  pumpHeadTotalM, tdhComponents,
  computeRequiredStages, findHydraulicOpPoint,
  STB_TO_M3,
} from '../../../physics/hydraulics';
import { M3_QUESTIONS, gradeM3 } from '../../../pedagogy/evaluations/m3';

// ─── Paleta ────────────────────────────────────────────────────────
const C = {
  bg:        '#0B0F1A',
  surface:   '#111827',
  surfaceAlt:'#0D1424',
  border:    '#1E293B',
  text:      '#CBD5E1',
  muted:     '#64748B',
  purple:    '#A78BFA',
  blue:      '#38BDF8',
  orange:    '#FB923C',
  red:       '#FB7185',
  pink:      '#F472B6',
  yellow:    '#FBBF24',
  ok:        '#22C55E',
  warning:   '#F59E0B',
  danger:    '#EF4444',
};

const SYS = { depth: 1800, Pwh: 150, densidad: 0.876, D_in: 2.441, H0_stage: 45, freq: 60 };

function Slider({ label, unit, value, min, max, step, dec = 0, onChange, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.text, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace' }}>{label}</span>
          {tooltip && <span style={{ cursor: 'pointer', color: C.muted, fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 5px' }} onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>?</span>}
        </div>
        <span style={{ color: C.purple, fontWeight: 700, fontSize: 13, fontFamily: 'IBM Plex Mono, monospace' }}>{Number(value).toFixed(dec)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>{unit}</span></span>
      </div>
      {showTip && tooltip && <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', marginBottom: 6, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{tooltip}</div>}
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: C.purple, cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function Metric({ label, value, unit, color = C.purple, sub }) {
  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 100 }}>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 700, fontSize: 16, fontFamily: 'IBM Plex Mono, monospace' }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }}>{unit}{sub && <> · {sub}</>}</div>
    </div>
  );
}

function Alert({ type, msg }) {
  const s = { ok: { bg: '#052e16', bd: '#166534', ic: '✅', c: C.ok }, warning: { bg: '#431407', bd: '#92400e', ic: '⚠️', c: C.warning }, danger: { bg: '#450a0a', bd: '#991b1b', ic: '🔴', c: C.danger } }[type] || {};
  return <div style={{ background: s.bg, border: `1px solid ${s.bd}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 12, fontFamily: 'IBM Plex Mono, monospace', color: s.c }}>{s.ic} {msg}</div>;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>Q = {Number(label).toFixed(1)} m³/d</div>
      {payload.map(p => <div key={p.dataKey} style={{ color: p.color }}>{p.name}: {Number(p.value).toFixed(1)} m</div>)}
    </div>
  );
}

function GVFGauge({ GVF_wellbore_pct, GVF_pump_pct }) {
  const maxGVF   = 30;
  const barPct   = v => Math.min(100, (v / maxGVF) * 100);
  const pumpColor = GVF_pump_pct >= 15 ? C.danger : GVF_pump_pct >= 10 ? C.warning : C.ok;
  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px' }}>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 10 }}>MEDIDOR GVF EN SUCCIÓN</div>
      <div style={{ position: 'relative', height: 20, background: C.surface, borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
        {[[0,5,C.ok],[5,10,C.warning],[10,15,'#F97316'],[15,30,C.danger]].map(([f,t,col]) => (
          <div key={f} style={{ position: 'absolute', left: `${(f/maxGVF)*100}%`, width: `${((t-f)/maxGVF)*100}%`, height: '100%', background: col, opacity: 0.3 }} />
        ))}
        <div style={{ position: 'absolute', left: `calc(${barPct(GVF_wellbore_pct)}% - 2px)`, top: 0, width: 4, height: '100%', background: C.blue, borderRadius: 2, zIndex: 2 }} />
        <div style={{ position: 'absolute', left: `calc(${barPct(GVF_pump_pct)}% - 4px)`, top: 2, width: 8, height: 16, background: pumpColor, borderRadius: 4, zIndex: 3 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 8 }}>
        <span>0%</span><span style={{ color: C.warning }}>5%</span><span style={{ color: '#F97316' }}>10%</span><span style={{ color: C.danger }}>15%</span><span>30%</span>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', color: '#CBD5E1' }}>
        <div><span style={{ color: C.blue }}>▌</span> GVF wellbore: <span style={{ color: C.blue, fontWeight: 700 }}>{GVF_wellbore_pct.toFixed(1)}%</span></div>
        <div><span style={{ color: pumpColor }}>▌</span> GVF bomba: <span style={{ color: pumpColor, fontWeight: 700 }}>{GVF_pump_pct.toFixed(1)}%</span></div>
      </div>
    </div>
  );
}

// ─── Tab Teoría ───────────────────────────────────────────────────
function TabTeoria() {
  const [open, setOpen] = useState(null);
  const sections = [
    { key:'gvf', title:'① GVF — Gas Volume Fraction', content:(
      <div style={{fontSize:13,lineHeight:1.8,color:C.text}}>
        <p>El GVF es la fracción volumétrica de gas libre en la succión de la bomba a condiciones de fondo:</p>
        <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px',margin:'12px 0',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>
          <div style={{color:C.purple}}>GVF = Q_gas / (Q_gas + Q_líquido)</div>
          <div style={{color:C.muted,marginTop:8}}>GOR libre = GOR × (1 − Ps/Pb)  [Standing simplificado]<br/>Bg = 0.02829 × z × T_R / Ps  [ft³/scf — gas ideal]<br/>Q_gas = GOR_libre × Bg<br/>Q_líquido = 5.615 ft³/STB</div>
        </div>
        <p style={{color:C.muted,fontSize:12}}>Para Ps ≥ Pb: GVF = 0. Cuando la presión de succión cae bajo Pb, el gas se libera proporcionalmente al drawdown sobre la presión de burbuja.</p>
      </div>
    )},
    { key:'gaslock', title:'② Gas Lock — umbral de operación', content:(
      <div style={{fontSize:13,lineHeight:1.8,color:C.text}}>
        <p>El <strong style={{color:C.danger}}>gas lock</strong> ocurre cuando el GVF en la succión supera la capacidad hidráulica de los impulsores centrífugos:</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,margin:'12px 0'}}>
          {[['GVF < 10%','Operación normal',C.ok],['10–15%','Zona de precaución',C.warning],['>15%','Gas Lock inminente',C.danger]].map(([r,d,col])=>(
            <div key={r} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:'8px 10px',borderLeft:`3px solid ${col}`}}>
              <div style={{color:col,fontWeight:700,fontFamily:'IBM Plex Mono, monospace'}}>{r}</div>
              <div style={{color:C.muted,fontSize:11,marginTop:4}}>{d}</div>
            </div>
          ))}
        </div>
        <p style={{color:C.muted,fontSize:12}}>El umbral del 15% viene de datos empíricos de fabricantes. Sin separador, el GVF wellbore llega completo a la bomba.</p>
      </div>
    )},
    { key:'degradacion', title:'③ Degradación de la curva H-Q', content:(
      <div style={{fontSize:13,lineHeight:1.8,color:C.text}}>
        <p>El gas compresible no transfiere presión como los líquidos. A mayor GVF, menor eficiencia hidráulica:</p>
        <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px',margin:'12px 0',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>
          <div style={{color:C.red}}>H_degradada(Q) = f_H × H_limpia(Q)</div>
          <div style={{color:C.muted,marginTop:6}}>GVF ≤ 5%:   f_H = 1.00 (sin degradación)<br/>GVF 5–10%:  f_H = 0.90–1.00 (leve)<br/>GVF 10–15%: f_H = 0.70–0.90 (moderado)<br/>GVF &gt;15%: f_H &lt; 0.70 (severo → gas lock)</div>
        </div>
        <p style={{color:C.muted,fontSize:12}}>[SIMPLIFIED: factor uniforme sobre la curva. Datos reales varían por fabricante y geometría del impulsor.]</p>
      </div>
    )},
    { key:'separadores', title:'④ Separadores AGS y Gas Handler', content:(
      <div style={{fontSize:13,lineHeight:1.8,color:C.text}}>
        <p>Instalados entre el intake y la bomba para reducir el GVF que llega a los impulsores:</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'12px 0'}}>
          {[{name:'AGS Pasivo (Rotary)',eff:'65%',desc:'Separación centrífuga pasiva. Para GVF < 25%.',color:C.warning},{name:'Gas Handler Activo',eff:'82%',desc:'Mecanismo activo de dispersión de gas. Mayor rango.',color:C.purple}].map(s=>(
            <div key={s.name} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:'10px 12px',borderLeft:`3px solid ${s.color}`}}>
              <div style={{color:s.color,fontWeight:700,fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>{s.name}</div>
              <div style={{color:C.yellow,fontSize:12,margin:'4px 0'}}>Eficiencia: {s.eff}</div>
              <div style={{color:C.muted,fontSize:11}}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:'10px 14px',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>
          <div style={{color:C.purple}}>GVF_bomba = GVF_wellbore × (1 − η_separador)</div>
        </div>
      </div>
    )},
    { key:'viscosidad', title:'⑤ Corrección de Viscosidad (HI)', content:(
      <div style={{fontSize:13,lineHeight:1.8,color:C.text}}>
        <p>El método HI (ANSI/HI 9.6.7) calcula factores correctivos para crudos viscosos:</p>
        <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:'12px 16px',margin:'12px 0',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>
          <div style={{color:C.yellow}}>B = √Q_bep × H_bep^0.25 / √ν</div>
          <div style={{color:C.muted,marginTop:6}}>B ≥ 40 → sin corrección (μ leve)<br/>B 10–40 → CQ = 0.85–1.0, CH = 0.92–1.0<br/>B &lt; 10 → corrección severa</div>
        </div>
        <p style={{color:C.muted,fontSize:12}}>Para crudos {'>'} 30 cP, la reducción de eficiencia puede llegar al 25–40%. La bomba debe sobredimensionarse en caudal y altura.</p>
      </div>
    )},
    { key:'glosario', title:'⑥ Glosario del Módulo', content:(
      <div style={{fontSize:12,fontFamily:'IBM Plex Mono, monospace'}}>
        {[['GVF','Gas Volume Fraction — fracción volumétrica de gas en succión (0–1)'],['GOR','Gas-Oil Ratio superficial (scf/STB)'],['Pb','Presión de burbuja — inicio de liberación de gas (psi)'],['Ps','Presión de succión de la bomba — pump intake pressure (psi)'],['Bg','Factor volumétrico del gas — expansión a condiciones de fondo (ft³/scf)'],['Rs','GOR en solución a Ps — gas que permanece disuelto (scf/STB)'],['AGS','Automatic Gas Separator — separador rotativo pasivo'],['f_H','Factor de degradación de altura por gas (empírico)'],['CQ/CH','Factores de corrección HI por viscosidad']].map(([t,d])=>(
          <div key={t} style={{display:'flex',gap:12,padding:'6px 0',borderBottom:`1px solid ${C.border}`}}>
            <span style={{color:C.purple,minWidth:60}}>{t}</span>
            <span style={{color:C.muted}}>{d}</span>
          </div>
        ))}
      </div>
    )},
  ];

  return (
    <div>
      <div style={{color:C.purple,fontWeight:700,fontSize:15,fontFamily:'IBM Plex Mono, monospace',marginBottom:16}}>TEORÍA — GAS Y FLUJO MULTIFÁSICO</div>
      {sections.map(s=>(
        <div key={s.key} style={{marginBottom:8}}>
          <button onClick={()=>setOpen(open===s.key?null:s.key)} style={{width:'100%',background:open===s.key?C.surfaceAlt:C.surface,border:`1px solid ${open===s.key?C.purple:C.border}`,borderRadius:8,padding:'12px 16px',cursor:'pointer',textAlign:'left',color:open===s.key?C.purple:C.text,fontFamily:'IBM Plex Mono, monospace',fontSize:13,fontWeight:700,display:'flex',justifyContent:'space-between'}}>
            <span>{s.title}</span><span style={{color:C.muted}}>{open===s.key?'▲':'▼'}</span>
          </button>
          {open===s.key&&<div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderTop:'none',borderRadius:'0 0 8px 8px',padding:'16px 20px'}}>{s.content}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Tab Simulador ────────────────────────────────────────────────
function TabSimulador() {
  const [GOR,  setGOR]  = useState(27);   // m³/m³ (≈150 scf/STB)
  const [Pb,   setPb]   = useState(2000);
  const [Ps,   setPs]   = useState(900);
  const [T_F,  setTF]   = useState(82);   // °C (≈180°F)
  const [sep,  setSep]  = useState('none');
  const [mu,   setMu]   = useState(5);
  const [freq, setFreq] = useState(60);

  const sim = useMemo(() => {
    const GOR_scf    = GOR * 5.6146;                 // m³/m³ → scf/STB
    const T_F_phys   = T_F * 9 / 5 + 32;            // °C → °F
    const gvfResult  = gasVolumeFraction(GOR_scf, Pb, Ps, T_F_phys);
    const GVF_wb     = gvfResult.GVF;
    const sepResult  = gasSeparatorEfficiency(GVF_wb, sep);
    const GVF_pump   = GVF_wb * (1 - sepResult.separation_eff);
    const gasDeg     = hqGasDegradation(GVF_pump);
    const H_bep_ft   = SYS.H0_stage * (1 - Math.pow(0.5, 1.85)) * (freq / 60) ** 2;
    const Q_bep_gpm  = 2100 * (freq / 60) * 0.029166;
    const viscCorr   = hiViscosityCorrection(mu, Q_bep_gpm, H_bep_ft);
    const f_H_total  = gasDeg.head_factor * viscCorr.CH;

    const nStages   = computeRequiredStages(SYS.depth, SYS.Pwh, SYS.D_in, mu, SYS.densidad, freq, SYS.H0_stage);
    const Qmax_m3d  = 4200 * (freq / 60) * STB_TO_M3 * 1.15;
    const Q_bep_m3d = 2100 * (freq / 60) * STB_TO_M3;

    const chartData = [];
    for (let i = 0; i <= 120; i++) {
      const Q       = (Qmax_m3d * i) / 120;
      const H_clean = pumpHeadTotalM(Q, freq, nStages, SYS.H0_stage);
      const H_deg   = H_clean * f_H_total;
      const { TDH_m: TDH } = tdhComponents(Q, SYS.depth, SYS.Pwh, SYS.D_in, mu, SYS.densidad);
      chartData.push({ Q: +Q.toFixed(1), Limpia: +Math.max(0,H_clean).toFixed(1), Degradada: +Math.max(0,H_deg).toFixed(1), Sistema: +TDH.toFixed(1) });
    }

    const opClean = findHydraulicOpPoint(SYS.depth, SYS.Pwh, SYS.D_in, mu, SYS.densidad, freq, nStages, SYS.H0_stage);
    let opDeg = null;
    { let prev=null;
      for (let i=0;i<=2000;i++){
        const Q=(Qmax_m3d*i)/2000;
        const H_deg=pumpHeadTotalM(Q,freq,nStages,SYS.H0_stage)*f_H_total;
        const {TDH_m:tdh}=tdhComponents(Q,SYS.depth,SYS.Pwh,SYS.D_in,mu,SYS.densidad);
        const diff=H_deg-tdh;
        if(prev!==null&&prev.diff*diff<0){const t=prev.diff/(prev.diff-diff);const Q_op=prev.Q+t*(Q-prev.Q);const {TDH_m:TDH_op}=tdhComponents(Q_op,SYS.depth,SYS.Pwh,SYS.D_in,mu,SYS.densidad);opDeg={Q_m3d:+Q_op.toFixed(1),TDH_m:+TDH_op.toFixed(1)};break;}
        prev={Q,diff};
      }
    }

    const alerts = [];
    if (GVF_pump*100 >= 15) alerts.push({ type:'danger',  msg:`Gas lock inminente: GVF bomba = ${(GVF_pump*100).toFixed(1)}%. Instalar separador AGS o Gas Handler.` });
    else if (GVF_pump*100 >= 10) alerts.push({ type:'warning', msg:`GVF = ${(GVF_pump*100).toFixed(1)}% en zona de riesgo. Monitorear vibración y corriente.` });
    if (f_H_total < 0.80) alerts.push({ type:'warning', msg:`Degradación total = ${Math.round((1-f_H_total)*100)}%. Bomba opera al ${Math.round(f_H_total*100)}% de su altura nominal.` });
    if (mu > 30) alerts.push({ type:'warning', msg:`Viscosidad alta (${mu} cP). Corrección HI activa: CQ=${viscCorr.CQ.toFixed(2)}, CH=${viscCorr.CH.toFixed(2)}.` });
    if (!opDeg) alerts.push({ type:'danger', msg:'Sin punto de operación con curva degradada. Bomba no supera TDH del sistema.' });
    if (alerts.length === 0) alerts.push({ type:'ok', msg:`Operación normal. GVF bomba = ${(GVF_pump*100).toFixed(1)}%. Degradación H = ${Math.round((1-f_H_total)*100)}%.` });

    return { gvfResult, GVF_wb, GVF_pump, gasDeg, viscCorr, f_H_total, nStages, chartData, opClean, opDeg, Q_bep_m3d, alerts };
  }, [GOR, Pb, Ps, T_F, sep, mu, freq]);

  const SEP_OPTIONS = [
    { id:'none',        label:'Sin separador' },
    { id:'ags_passive', label:'AGS Pasivo 65%' },
    { id:'gas_handler', label:'Gas Handler 82%' },
  ];

  return (
    <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:20}}>
      <div>
        <div style={{color:C.muted,fontSize:10,fontFamily:'IBM Plex Mono, monospace',marginBottom:10,textTransform:'uppercase',letterSpacing:1}}>Gas del Yacimiento</div>
        <Slider label="GOR superficial" unit="m³/m³" value={GOR}  min={0}   max={5000} step={25}  dec={0} onChange={setGOR}  tooltip="Gas-Oil Ratio superficial. Alto GOR + baja Ps = mayor GVF. Típico: 9–890 m³/m³ (50–5000 scf/STB)." />
        <Slider label="Presión de burbuja (Pb)" unit="psi" value={Pb} min={300} max={4000} step={50}  dec={0} onChange={setPb}  tooltip="Pb: presión a la que el gas empieza a liberarse. Si Ps > Pb, no hay gas libre." />
        <Slider label="Presión de succión (Ps)" unit="psi" value={Ps} min={50}  max={3000} step={25}  dec={0} onChange={setPs}  tooltip="Pump intake pressure. Si Ps < Pb hay gas libre. Mayor drawdown → menor Ps → mayor GVF." />
        <Slider label="Temperatura de fondo" unit="°C"    value={T_F} min={27}  max={121}  step={2}   dec={0} onChange={setTF}  tooltip="Temperatura en la profundidad de la bomba. Afecta el Bg (expansión del gas). BES típico: 65–104°C." />

        <div style={{color:C.muted,fontSize:10,fontFamily:'IBM Plex Mono, monospace',marginBottom:8,marginTop:12,textTransform:'uppercase',letterSpacing:1}}>Separador de Gas</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:14}}>
          {SEP_OPTIONS.map(o=>(
            <button key={o.id} onClick={()=>setSep(o.id)} style={{padding:'8px 12px',background:sep===o.id?C.purple:C.surfaceAlt,color:sep===o.id?'#000':C.muted,border:`1px solid ${sep===o.id?C.purple:C.border}`,borderRadius:6,cursor:'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:11,fontWeight:sep===o.id?700:400,textAlign:'left'}}>
              {o.label}
            </button>
          ))}
        </div>

        <div style={{color:C.muted,fontSize:10,fontFamily:'IBM Plex Mono, monospace',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Fluido</div>
        <Slider label="Viscosidad" unit="cP"  value={mu}   min={0.5} max={100} step={0.5} dec={1} onChange={setMu}  tooltip="Viscosidad dinámica. Activa corrección HI sobre H, Q y eficiencia. Crudo liviano: 2–10 cP. Pesado: 50+ cP." />
        <Slider label="Frecuencia VSD" unit="Hz" value={freq} min={30}  max={70}  step={1}   dec={0} onChange={setFreq} tooltip="Frecuencia del VSD. Escala BEP y altura de la bomba según Leyes de Afinidad." />
      </div>

      <div>
        {sim.alerts.map((a,i) => <Alert key={i} {...a} />)}
        <GVFGauge GVF_wellbore_pct={sim.GVF_wb*100} GVF_pump_pct={sim.GVF_pump*100} />

        <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 8px 8px',marginTop:12}}>
          <div style={{color:C.muted,fontSize:10,fontFamily:'IBM Plex Mono, monospace',paddingLeft:16,marginBottom:4}}>
            H-Q LIMPIA (azul) vs. DEGRADADA (rojo) — f_H total = {sim.f_H_total.toFixed(3)} · {sim.nStages} etapas
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sim.chartData} margin={{top:8,right:20,left:0,bottom:10}}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="Q" stroke={C.muted} tick={{fontSize:10,fontFamily:'IBM Plex Mono, monospace',fill:C.muted}} tickFormatter={v => Math.round(v)} />
              <YAxis stroke={C.muted} tick={{fontSize:10,fontFamily:'IBM Plex Mono, monospace',fill:C.muted}} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{fontFamily:'IBM Plex Mono, monospace',fontSize:11}} />
              <Line type="monotone" dataKey="Sistema"   stroke={C.orange} strokeWidth={2}   dot={false} name="TDH sistema" />
              <Line type="monotone" dataKey="Limpia"    stroke={C.blue}   strokeWidth={2.5} dot={false} name="H-Q limpia" />
              <Line type="monotone" dataKey="Degradada" stroke={C.red}    strokeWidth={2.5} dot={false} name="H-Q degradada" strokeDasharray="5 3" />
              <ReferenceLine x={+sim.Q_bep_m3d.toFixed(1)} stroke={C.pink} strokeDasharray="4 3" strokeWidth={1} />
              {sim.opClean && <ReferenceDot x={sim.opClean.Q_m3d} y={sim.opClean.TDH_m} r={5} fill={C.blue} stroke="none" />}
              {sim.opDeg   && <ReferenceDot x={sim.opDeg.Q_m3d}   y={sim.opDeg.TDH_m}   r={5} fill={C.red}  stroke="none" />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{display:'flex',gap:10,marginTop:12,flexWrap:'wrap'}}>
          <Metric label="GVF wellbore"  value={`${(sim.GVF_wb*100).toFixed(1)}%`}   unit={sim.gvfResult.gas_lock_risk==='danger'?'🔴 PELIGRO':sim.gvfResult.gas_lock_risk==='warning'?'⚠️ ATENCIÓN':'✅ SEGURO'} color={sim.GVF_wb*100>=15?C.danger:sim.GVF_wb*100>=10?C.warning:C.ok} />
          <Metric label="GVF bomba"     value={`${(sim.GVF_pump*100).toFixed(1)}%`}  unit="tras separador" color={sim.GVF_pump*100>=15?C.danger:sim.GVF_pump*100>=10?C.warning:C.ok} />
          <Metric label="f_H gas"       value={sim.gasDeg.head_factor.toFixed(3)}     unit={sim.gasDeg.severity} color={sim.gasDeg.severity==='none'?C.ok:sim.gasDeg.severity==='mild'?C.yellow:C.warning} />
          <Metric label="CH visc. (HI)" value={sim.viscCorr.CH.toFixed(3)}            unit={`CQ=${sim.viscCorr.CQ.toFixed(2)}`} color={sim.viscCorr.CH<0.85?C.warning:C.text} />
          <Metric label="f_H TOTAL"     value={sim.f_H_total.toFixed(3)}              unit="gas + viscosidad" color={sim.f_H_total<0.75?C.danger:sim.f_H_total<0.90?C.warning:C.ok} />
        </div>
        <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
          <Metric label="Q operativo limpio"     value={sim.opClean?sim.opClean.Q_m3d.toFixed(1):'—'} unit="m³/d" color={C.blue} />
          <Metric label="Q operativo degradado"  value={sim.opDeg?sim.opDeg.Q_m3d.toFixed(1):'—'}     unit="m³/d" color={C.red} />
          <Metric label="ΔQ pérdida"             value={sim.opClean&&sim.opDeg?`${Math.round((1-sim.opDeg.Q_m3d/sim.opClean.Q_m3d)*100)}%`:'—'} unit="reducción" color={C.muted} />
          <Metric label="Free GOR"               value={((sim.gvfResult.free_GOR??0)*0.17811).toFixed(1)} unit="m³/m³ libre" color={C.muted} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab Caso Práctico ─────────────────────────────────────────────
const CASO_STEPS = [
  { title:'Paso 1 — Diagnóstico: alta producción de gas', desc:'El Pozo Ibis-12 presenta caída de caudal y vibración elevada. Registros de fondo: GOR=53 m³/m³, Pb=2500 psi, Ps=800 psi, T=71°C. Sin separador instalado.', params:{GOR:300,Pb:2500,Ps:800,T_F:160,sep:'none',mu:5}, task:'¿El GVF calculado explica los síntomas de gas lock observados?', hint:'Con Ps=800 psi y Pb=2500 psi el drawdown es grande. Observa el medidor de GVF.' },
  { title:'Paso 2 — Instalar AGS Pasivo (η=65%)', desc:'El equipo instala un AGS Pasivo sin cambiar el tubing. Los demás parámetros se mantienen iguales.', params:{GOR:300,Pb:2500,Ps:800,T_F:160,sep:'ags_passive',mu:5}, task:'¿El AGS resuelve el gas lock? ¿Cuál es el GVF efectivo en la bomba?', hint:'GVF_bomba = GVF_wellbore × (1 − 0.65). Verifica si quedamos bajo el umbral del 15%.' },
  { title:'Paso 3 — Gas Handler + reducción de drawdown', desc:'Se reemplaza el AGS por un Gas Handler (η=82%) y se ajusta el VSD para reducir el drawdown, elevando Ps a 1200 psi.', params:{GOR:300,Pb:2500,Ps:1200,T_F:160,sep:'gas_handler',mu:5}, task:'¿Cuánto mejora el GVF y la degradación de la curva H-Q respecto al paso 1?', hint:'Al elevar Ps el GOR libre se reduce. Combinado con el Gas Handler, el GVF bomba debe caer a zona segura.' },
];

function TabCaso() {
  const [step, setStep] = useState(0);
  const s = CASO_STEPS[step];
  const { GOR, Pb, Ps, T_F, sep, mu } = s.params;
  const freq = 60;

  const sim = useMemo(() => {
    const gvfResult = gasVolumeFraction(GOR, Pb, Ps, T_F);
    const GVF_wb    = gvfResult.GVF;
    const sepResult = gasSeparatorEfficiency(GVF_wb, sep);
    const GVF_pump  = GVF_wb * (1 - sepResult.separation_eff);
    const gasDeg    = hqGasDegradation(GVF_pump);
    const viscCorr  = hiViscosityCorrection(mu);
    const f_H_total = gasDeg.head_factor * viscCorr.CH;
    const nStages   = computeRequiredStages(SYS.depth, SYS.Pwh, SYS.D_in, mu, SYS.densidad, freq, SYS.H0_stage);
    const Qmax_m3d  = 4200 * (freq / 60) * STB_TO_M3 * 1.15;
    const chartData = [];
    for (let i = 0; i <= 100; i++) {
      const Q       = (Qmax_m3d * i) / 100;
      const H_clean = pumpHeadTotalM(Q, freq, nStages, SYS.H0_stage);
      const H_deg   = H_clean * f_H_total;
      const { TDH_m: TDH } = tdhComponents(Q, SYS.depth, SYS.Pwh, SYS.D_in, mu, SYS.densidad);
      chartData.push({ Q: +Q.toFixed(1), Limpia: +Math.max(0,H_clean).toFixed(1), Degradada: +Math.max(0,H_deg).toFixed(1), Sistema: +TDH.toFixed(1) });
    }
    return { gvfResult, GVF_wb, GVF_pump, gasDeg, f_H_total, chartData };
  }, [step]);

  return (
    <div>
      <div style={{color:C.purple,fontWeight:700,fontSize:14,fontFamily:'IBM Plex Mono, monospace',marginBottom:12}}>CASO PRÁCTICO — POZO IBIS-12 · DIAGNÓSTICO DE GAS LOCK</div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {CASO_STEPS.map((cs,i)=>(
          <button key={i} onClick={()=>setStep(i)} style={{flex:1,padding:'10px 12px',background:step===i?C.purple:C.surfaceAlt,color:step===i?'#000':C.muted,border:`1px solid ${step===i?C.purple:C.border}`,borderRadius:8,cursor:'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:11,fontWeight:step===i?700:400}}>Paso {i+1}</button>
        ))}
      </div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 20px',marginBottom:14}}>
        <div style={{color:C.purple,fontWeight:700,fontSize:13,fontFamily:'IBM Plex Mono, monospace',marginBottom:8}}>{s.title}</div>
        <div style={{color:C.text,fontSize:13,lineHeight:1.6,marginBottom:10}}>{s.desc}</div>
        <div style={{background:C.surfaceAlt,borderRadius:6,padding:'8px 12px',color:C.blue,fontSize:12,fontFamily:'IBM Plex Mono, monospace',marginBottom:8}}>📋 {s.task}</div>
        <div style={{color:C.muted,fontSize:11,fontFamily:'IBM Plex Mono, monospace'}}>💡 {s.hint}</div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}>
        {[['GOR',GOR,'scf/STB'],['Pb',Pb,'psi'],['Ps',Ps,'psi'],['T',T_F,'°F'],['Separador',sep,''],['mu',mu,'cP']].map(([k,v,u])=>(
          <div key={k} style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:'6px 10px',fontFamily:'IBM Plex Mono, monospace',fontSize:11}}>
            <span style={{color:C.muted}}>{k} = </span><span style={{color:C.purple,fontWeight:700}}>{v}</span><span style={{color:C.muted}}> {u}</span>
          </div>
        ))}
      </div>
      <GVFGauge GVF_wellbore_pct={sim.GVF_wb*100} GVF_pump_pct={sim.GVF_pump*100} />
      <div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 8px 8px',marginTop:12,marginBottom:14}}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={sim.chartData} margin={{top:8,right:20,left:0,bottom:10}}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
            <XAxis dataKey="Q" stroke={C.muted} tick={{fontSize:10,fontFamily:'IBM Plex Mono, monospace',fill:C.muted}} />
            <YAxis stroke={C.muted} tick={{fontSize:10,fontFamily:'IBM Plex Mono, monospace',fill:C.muted}} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{fontFamily:'IBM Plex Mono, monospace',fontSize:11}} />
            <Line type="monotone" dataKey="Sistema"   stroke={C.orange} strokeWidth={2}   dot={false} name="TDH sistema" />
            <Line type="monotone" dataKey="Limpia"    stroke={C.blue}   strokeWidth={2.5} dot={false} name="H-Q limpia" />
            <Line type="monotone" dataKey="Degradada" stroke={C.red}    strokeWidth={2.5} dot={false} name="H-Q degradada" strokeDasharray="5 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
        <Metric label="GVF wellbore" value={`${(sim.GVF_wb*100).toFixed(1)}%`}  unit="antes del sep." color={sim.GVF_wb*100>=15?C.danger:sim.GVF_wb*100>=10?C.warning:C.ok} />
        <Metric label="GVF bomba"    value={`${(sim.GVF_pump*100).toFixed(1)}%`} unit="tras separador" color={sim.GVF_pump*100>=15?C.danger:sim.GVF_pump*100>=10?C.warning:C.ok} />
        <Metric label="f_H gas"      value={sim.gasDeg.head_factor.toFixed(3)}   unit={sim.gasDeg.severity} color={sim.gasDeg.severity==='none'?C.ok:C.warning} />
        <Metric label="f_H total"    value={sim.f_H_total.toFixed(3)}            unit="degradación" color={sim.f_H_total<0.80?C.danger:C.ok} />
      </div>
      <div style={{display:'flex',gap:12,marginTop:20,justifyContent:'space-between'}}>
        <button onClick={()=>setStep(Math.max(0,step-1))} disabled={step===0} style={{padding:'10px 20px',background:step===0?C.surface:C.surfaceAlt,color:step===0?C.muted:C.text,border:`1px solid ${C.border}`,borderRadius:8,cursor:step===0?'not-allowed':'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>← Paso anterior</button>
        <button onClick={()=>setStep(Math.min(CASO_STEPS.length-1,step+1))} disabled={step===CASO_STEPS.length-1} style={{padding:'10px 20px',background:step===CASO_STEPS.length-1?C.surface:C.purple,color:step===CASO_STEPS.length-1?C.muted:'#000',border:'none',borderRadius:8,cursor:step===CASO_STEPS.length-1?'not-allowed':'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:12,fontWeight:700}}>Siguiente paso →</button>
      </div>
    </div>
  );
}

// ─── Tab Evaluación ───────────────────────────────────────────────
function TabEvaluacion() {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);
  const handleSelect = (qid, opt) => { if (!submitted) setAnswers(p=>({...p,[qid]:opt})); };
  const handleSubmit = () => { const ans=M3_QUESTIONS.map(q=>({id:q.id,selected:answers[q.id]||''}));setResult(gradeM3(ans));setSubmitted(true); };
  const handleReset  = () => { setAnswers({});setSubmitted(false);setResult(null); };
  const allAnswered  = M3_QUESTIONS.every(q=>answers[q.id]);
  return (
    <div>
      <div style={{color:C.purple,fontWeight:700,fontSize:14,fontFamily:'IBM Plex Mono, monospace',marginBottom:16}}>EVALUACIÓN — GAS Y FLUJO MULTIFÁSICO</div>
      {submitted&&result&&(
        <div style={{background:result.pct>=80?'#052e16':result.pct>=60?'#431407':'#450a0a',border:`1px solid ${result.pct>=80?'#166534':result.pct>=60?'#92400e':'#991b1b'}`,borderRadius:10,padding:'16px 20px',marginBottom:20}}>
          <div style={{fontFamily:'IBM Plex Mono, monospace',fontSize:18,fontWeight:700,color:result.pct>=80?C.ok:result.pct>=60?C.warning:C.danger}}>{result.score}/{result.total} correctas — {result.pct}%</div>
          <div style={{color:C.muted,fontSize:12,marginTop:4}}>{result.pct>=80?'✅ Excelente. Puedes avanzar al Módulo 4.':result.pct>=60?'⚠️ Bien, repasa las respuestas incorrectas.':'🔴 Repasa la teoría antes de continuar.'}</div>
        </div>
      )}
      {M3_QUESTIONS.map((q,qi)=>{
        const sel=answers[q.id];const res=result?.results?.find(r=>r.id===q.id);
        return (
          <div key={q.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:'16px 20px',marginBottom:14}}>
            <div style={{color:C.text,fontWeight:700,fontSize:13,fontFamily:'IBM Plex Mono, monospace',marginBottom:12}}>{qi+1}. {q.text}</div>
            {q.options.map(opt=>{
              let bg=C.surfaceAlt,bd=C.border,col=C.muted;
              if(sel===opt.id&&!submitted){bg='#2e1065';bd=C.purple;col=C.purple;}
              if(submitted&&opt.id===q.correct){bg='#052e16';bd=C.ok;col=C.ok;}
              if(submitted&&sel===opt.id&&sel!==q.correct){bg='#450a0a';bd=C.danger;col=C.danger;}
              return <button key={opt.id} onClick={()=>handleSelect(q.id,opt.id)} style={{display:'block',width:'100%',textAlign:'left',background:bg,border:`1px solid ${bd}`,borderRadius:7,padding:'10px 14px',marginBottom:6,cursor:submitted?'default':'pointer',color:col,fontFamily:'IBM Plex Mono, monospace',fontSize:12,lineHeight:1.5}}><span style={{fontWeight:700,marginRight:8}}>{opt.id.toUpperCase()})</span>{opt.text}</button>;
            })}
            {submitted&&res&&<div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:6,padding:'10px 14px',marginTop:8,fontSize:11,color:C.muted,fontFamily:'IBM Plex Mono, monospace',lineHeight:1.6}}>💬 {res.explanation}</div>}
          </div>
        );
      })}
      <div style={{display:'flex',gap:12,justifyContent:'flex-end',marginTop:8}}>
        {submitted&&<button onClick={handleReset} style={{padding:'10px 24px',background:C.surfaceAlt,color:C.text,border:`1px solid ${C.border}`,borderRadius:8,cursor:'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:12}}>Reintentar</button>}
        {!submitted&&<button onClick={handleSubmit} disabled={!allAnswered} style={{padding:'10px 28px',background:allAnswered?C.purple:C.surface,color:allAnswered?'#000':C.muted,border:'none',borderRadius:8,cursor:allAnswered?'pointer':'not-allowed',fontFamily:'IBM Plex Mono, monospace',fontSize:13,fontWeight:700}}>Calificar →</button>}
      </div>
    </div>
  );
}

// ─── Raíz ─────────────────────────────────────────────────────────
const TABS = ['A. Teoría', 'B. Simulador', 'C. Caso Práctico', 'D. Evaluación'];
export default function Module3() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:'IBM Plex Mono, monospace',padding:'0 0 60px'}}>
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'20px 32px',position:'sticky',top:40,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:6}}>
          <div style={{background:C.purple,color:'#000',fontWeight:800,borderRadius:8,padding:'4px 12px',fontSize:13}}>M3</div>
          <div style={{color:C.purple,fontWeight:800,fontSize:24}}>Gas y Flujo Multifásico</div>
          <div style={{color:C.muted,fontSize:12}}>GVF · Gas Lock · AGS · Corrección HI de Viscosidad</div>
        </div>
        <div style={{display:'flex',gap:4,marginTop:12}}>
          {TABS.map((t,i)=>(
            <button key={t} onClick={()=>setActiveTab(i)} style={{padding:'8px 18px',background:activeTab===i?C.purple:'transparent',color:activeTab===i?'#000':C.muted,border:`1px solid ${activeTab===i?C.purple:C.border}`,borderRadius:8,cursor:'pointer',fontFamily:'IBM Plex Mono, monospace',fontSize:12,fontWeight:activeTab===i?700:400}}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:'28px 32px'}}>
        {activeTab===0&&<TabTeoria />}
        {activeTab===1&&<TabSimulador />}
        {activeTab===2&&<TabCaso />}
        {activeTab===3&&<TabEvaluacion />}
      </div>
    </div>
  );
}
