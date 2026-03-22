/**
 * SIMBES — Módulo 2: Diseño Hidráulico
 * =====================================
 * Física: TDH (estático + Darcy-Weisbach/Colebrook-White + contrapresión),
 *         velocidad específica (Ns), número de etapas, curva de sistema vs H-Q.
 */
import { useState, useMemo } from 'react';
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M2 } from './teoria-data';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceDot,
} from 'recharts';
import {
  tdhComponents, pumpHeadTotalM, pumpSpecificSpeed,
  computeRequiredStages, findHydraulicOpPoint,
  STB_TO_M3, FT_TO_M,
} from '../../../physics/hydraulics';
import { M2_QUESTIONS, gradeM2 } from '../../../pedagogy/evaluations/m2';

// ─── Paleta ────────────────────────────────────────────────────────
import { C } from '../../../theme';

// ─── Tamaños de tubing estándar (OD → ID) ─────────────────────────
const TUBING_SIZES = [
  { label: '2⅜"',  od: '2-3/8"',  D_in: 1.995 },
  { label: '2⅞"',  od: '2-7/8"',  D_in: 2.441 },
  { label: '3½"',  od: '3-1/2"',  D_in: 2.992 },
  { label: '4½"',  od: '4-1/2"',  D_in: 3.958 },
];

// ─── Componentes UI locales ────────────────────────────────────────

function Slider({ label, unit, value, min, max, step, dec = 0, onChange, tooltip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.text, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
          {tooltip && (
            <span
              style={{ cursor: 'pointer', color: C.muted, fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 5px', lineHeight: '16px' }}
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
            >?</span>
          )}
        </div>
        <span style={{ color: C.green, fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>
          {Number(value).toFixed(dec)} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>{unit}</span>
        </span>
      </div>
      {showTip && tooltip && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', marginBottom: 6, fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
          {tooltip}
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: C.green, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, unit, color = C.green, sub }) {
  return (
    <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', flex: 1, minWidth: 110 }}>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>{label}</div>
      <div style={{ color, fontWeight: 700, fontSize: 18, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>{unit}{sub && <> · <span style={{ color: C.muted }}>{sub}</span></>}</div>
    </div>
  );
}

function Alert({ type, msg }) {
  const styles = {
    ok:      { bg: '#052e16', border: '#166534', icon: '✅', color: C.ok },
    warning: { bg: '#431407', border: '#92400e', icon: '⚠️', color: C.warning },
    danger:  { bg: '#450a0a', border: '#991b1b', icon: '🔴', color: C.danger },
  };
  const s = styles[type] || styles.warning;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 8, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: s.color }}>
      {s.icon} {msg}
    </div>
  );
}

// ─── Tooltip del gráfico ───────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ color: C.muted, marginBottom: 4 }}>Q = {Number(label).toFixed(1)} m³/d</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {Number(p.value).toFixed(1)} m
        </div>
      ))}
    </div>
  );
}

// ─── Barra Ns ─────────────────────────────────────────────────────
function NsBar({ Ns }) {
  const pct = Math.min(100, Math.max(0, (Ns / 6000) * 100));
  const zones = [
    { label: 'Radial', from: 0, to: 1500 / 6000 * 100, color: '#818CF8' },
    { label: 'Mixto',  from: 1500 / 6000 * 100, to: 4500 / 6000 * 100, color: C.green },
    { label: 'Axial',  from: 4500 / 6000 * 100, to: 100, color: '#F59E0B' },
  ];
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ position: 'relative', height: 16, background: C.surfaceAlt, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
        {zones.map(z => (
          <div key={z.label} style={{ position: 'absolute', left: `${z.from}%`, width: `${z.to - z.from}%`, height: '100%', background: z.color, opacity: 0.25 }} />
        ))}
        <div style={{ position: 'absolute', left: `calc(${pct}% - 4px)`, top: 0, width: 8, height: '100%', background: C.red, borderRadius: 4, zIndex: 2 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 9, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>0</span><span style={{ color: '#818CF8' }}>Radial ← 1500</span>
        <span style={{ color: C.green }}>Mixto → 4500</span><span style={{ color: '#F59E0B' }}>Axial</span>
      </div>
    </div>
  );
}

// ─── Tab Teoría ───────────────────────────────────────────────────
function TabTeoria() {
  // Gráfico comparativo de curvas H-Q por tipo de impulsor (se inyecta en sección Ns)
  const nsChartData = Array.from({ length: 41 }, (_, i) => {
    const q = i / 40;
    return {
      Q: Math.round(q * 100),
      Radial:       +Math.max(0, (1 - Math.pow(q, 1.0))  * 100).toFixed(1),
      'Flujo Mixto':+Math.max(0, (1 - Math.pow(q, 1.85)) * 100).toFixed(1),
      Axial:        +Math.max(0, (1 - Math.pow(q, 3.5))  * 100).toFixed(1),
    };
  });

  // El gráfico de Ns se inyecta como `extra` en la sección correspondiente
  const nsExtra = (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 10px 8px' }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font, marginBottom: 8, marginLeft: 8 }}>
        Curvas H-Q comparativas — normalizadas (H/H₀ vs Q/Qmax)
      </div>
      <ResponsiveContainer width="100%" height={190}>
        <LineChart data={nsChartData} margin={{ top: 4, right: 24, left: -10, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="Q"
            tick={{ fill: C.muted, fontSize: 9, fontFamily: C.font }}
            tickFormatter={v => Math.round(v)}
            label={{ value: 'Q / Qmax (%)', position: 'insideBottom', offset: -16, fill: C.muted, fontSize: 10 }}
          />
          <YAxis domain={[0, 100]}
            tick={{ fill: C.muted, fontSize: 9, fontFamily: C.font }}
            label={{ value: 'H / H₀ (%)', angle: -90, position: 'insideLeft', offset: 16, fill: C.muted, fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, fontSize: 10, fontFamily: C.font, color: C.text }}
            formatter={(v, n) => [`${v}%`, n]}
            labelFormatter={v => `Q = ${v}% de Qmax`}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: C.font, paddingTop: 4 }} />
          <Line dataKey="Radial"       stroke="#38BDF8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line dataKey="Flujo Mixto"  stroke="#34D399" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          <Line dataKey="Axial"        stroke="#FBBF24" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const sections = TEORIA_M2.map(s =>
    s.id === 'ns' ? { ...s, extra: nsExtra } : s
  );

  return <TheoryLayout sections={sections} accentColor={C.green} />;
}

// ─── Tab Simulador ────────────────────────────────────────────────
function TabSimulador() {
  const [depth,    setDepth]    = useState(1800);   // m
  const [Pwh,      setPwh]      = useState(150);    // psi
  const [densidad, setDensidad] = useState(0.876);  // kg/L
  const [D_in,     setDIn]      = useState(2.441);  // pulgadas
  const [mu,       setMu]       = useState(3);      // cP
  const [freq,     setFreq]     = useState(60);     // Hz
  const [H0stage,  setH0stage]  = useState(45);     // ft/etapa

  const sim = useMemo(() => {
    const Q_bep_stbd = 2100 * (freq / 60);
    const Q_bep_m3d  = Q_bep_stbd * STB_TO_M3;
    const Qmax_m3d   = 4200 * (freq / 60) * STB_TO_M3;

    // TDH components en BEP
    const comps  = tdhComponents(Q_bep_m3d, depth, Pwh, D_in, mu, densidad);
    const nStages = computeRequiredStages(depth, Pwh, D_in, mu, densidad, freq, H0stage);
    const { Ns, type: nsType } = pumpSpecificSpeed(H0stage);

    // Curvas para gráfico (120 puntos, Q de 0 a 1.15×Qmax)
    const N_pts     = 120;
    const Q_max_plt = Qmax_m3d * 1.15;
    const chartData = [];
    for (let i = 0; i <= N_pts; i++) {
      const Q = (Q_max_plt * i) / N_pts;
      const { TDH_m }  = tdhComponents(Q, depth, Pwh, D_in, mu, densidad);
      const H_pump = pumpHeadTotalM(Q, freq, nStages, H0stage);
      chartData.push({ Q: +Q.toFixed(1), Sistema: +TDH_m.toFixed(1), Bomba: +Math.max(0, H_pump).toFixed(1) });
    }

    // Punto de operación
    const opPoint = findHydraulicOpPoint(depth, Pwh, D_in, mu, densidad, freq, nStages, H0stage);

    // BEP en m³/d
    const Q_bep_plot = Q_bep_m3d;

    // Alertas
    const alerts = [];
    if (comps.v_ms > 3.5)
      alerts.push({ type: 'danger', msg: `Velocidad de erosión: ${comps.v_ms} m/s > 3.5 m/s. Aumentar diámetro del tubing.` });
    if (comps.regime === 'laminar')
      alerts.push({ type: 'warning', msg: `Flujo laminar (Re = ${comps.Re.toLocaleString()}). Se usa f = 64/Re en lugar de Colebrook-White.` });
    if (comps.TDH_m > 0 && comps.H_friction_m / comps.TDH_m > 0.40)
      alerts.push({ type: 'warning', msg: `Fricción = ${Math.round(comps.H_friction_m / comps.TDH_m * 100)}% del TDH. Evaluar tubing de mayor diámetro.` });
    if (nStages > 150)
      alerts.push({ type: 'warning', msg: `${nStages} etapas requeridas. Considerar bomba con mayor H por etapa o reducir profundidad de asiento.` });
    if (!opPoint)
      alerts.push({ type: 'danger', msg: 'Sin punto de operación. La bomba no supera el TDH del sistema. Aumentar H₀ por etapa o número de etapas.' });
    if (alerts.length === 0 && opPoint)
      alerts.push({ type: 'ok', msg: `Sistema dimensionado correctamente. ${nStages} etapas. Q operativo ≈ ${opPoint.Q_m3d} m³/d. TDH = ${opPoint.TDH_m} m.` });

    return { comps, nStages, Ns, nsType, chartData, opPoint, Q_bep_plot, Qmax_m3d, alerts };
  }, [depth, Pwh, D_in, mu, freq, H0stage, densidad]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
      {/* ── Controles ── */}
      <div>
        <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Parámetros del Pozo</div>
        <Slider label="Profundidad de la bomba" unit="m"    value={depth}    min={300}  max={4300} step={50}  dec={0} onChange={setDepth}
          tooltip="Profundidad de asiento de la bomba. Determina H_estático = depth. BES típico: 600–3 500 m." />
        <Slider label="Presión de cabezal (Pwh)" unit="psi" value={Pwh}      min={50}   max={1000} step={10}  dec={0} onChange={setPwh}
          tooltip="Contrapresión en la superficie. H_back = Pwh / gradiente. Campo: 50–500 psi." />
        <Slider label="Densidad del fluido"   unit="kg/L"  value={densidad} min={0.70} max={1.15} step={0.01} dec={3} onChange={setDensidad}
          tooltip="Densidad del fluido. Afecta gradiente (grad = densidad × 0.4335 psi/ft) y número de Reynolds." />

        <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Tubing</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {TUBING_SIZES.map(t => (
            <button key={t.D_in} onClick={() => setDIn(t.D_in)}
              style={{ flex: 1, padding: '6px 0', background: D_in === t.D_in ? C.green : C.surfaceAlt, color: D_in === t.D_in ? '#000' : C.muted, border: `1px solid ${D_in === t.D_in ? C.green : C.border}`, borderRadius: 6, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: D_in === t.D_in ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ color: C.muted, fontSize: 10, marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
          ID = {D_in}" → A = {(Math.PI * (D_in * 0.0254) ** 2 / 4 * 10000).toFixed(2)} cm²
        </div>
        <Slider label="Viscosidad del fluido" unit="cP"  value={mu}    min={0.5} max={100} step={0.5} dec={1} onChange={setMu}
          tooltip="Viscosidad dinámica. Afecta Re y régimen de flujo. Agua ≈ 1 cP. Crudo liviano: 2–20 cP. Crudo pesado: 20–500 cP." />

        <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Bomba BES</div>
        <Slider label="Altura por etapa (H₀) a Q=0" unit="ft/etapa" value={H0stage} min={15} max={100} step={1} dec={0} onChange={setH0stage}
          tooltip="Altura de cierre (shutoff) por etapa a 60 Hz. Define Ns y tipo de impulsor. BES típico: 20–80 ft/etapa." />
        <Slider label="Frecuencia VSD" unit="Hz" value={freq} min={30} max={70} step={1} dec={0} onChange={setFreq}
          tooltip="Frecuencia del variador. Q ∝ f, H ∝ f², P ∝ f³ (Leyes de Afinidad). Rango campo: 45–65 Hz." />
      </div>

      {/* ── Gráfico + métricas ── */}
      <div>
        {/* Alertas */}
        <div style={{ marginBottom: 12 }}>
          {sim.alerts.map((a, i) => <Alert key={i} {...a} />)}
        </div>

        {/* Gráfico curva sistema vs H-Q bomba */}
        <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 8px 8px' }}>
          <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', paddingLeft: 16, marginBottom: 4 }}>
            CURVA DE SISTEMA vs. H-Q BOMBA ({sim.nStages} etapas · {freq} Hz)
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={sim.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
              <XAxis dataKey="Q" stroke={C.muted} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: C.muted }}
                tickFormatter={v => Math.round(v)}
                label={{ value: 'Q (m³/d)', position: 'insideBottom', offset: -4, fill: C.muted, fontSize: 11 }} />
              <YAxis stroke={C.muted} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: C.muted }}
                label={{ value: 'Altura (m)', angle: -90, position: 'insideLeft', offset: 12, fill: C.muted, fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, paddingTop: 8 }} />
              {/* Curva de sistema */}
              <Line type="monotone" dataKey="Sistema" stroke={C.orange} strokeWidth={2.5} dot={false} name="TDH sistema" />
              {/* Curva H-Q bomba */}
              <Line type="monotone" dataKey="Bomba" stroke={C.blue} strokeWidth={2.5} dot={false} name="H-Q bomba" />
              {/* BEP */}
              <ReferenceLine x={+sim.Q_bep_plot.toFixed(1)} stroke={C.pink} strokeDasharray="4 3" strokeWidth={1.2} label={{ value: 'BEP', fill: C.pink, fontSize: 9 }} />
              {/* Punto de operación */}
              {sim.opPoint && (
                <ReferenceDot x={sim.opPoint.Q_m3d} y={sim.opPoint.TDH_m} r={6} fill={C.red} stroke="none" label={{ value: '⊙ OP', fill: C.red, fontSize: 10, dy: -10 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Métricas principales */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <Metric label="TDH total" value={sim.comps.TDH_m.toFixed(0)} unit="m" color={C.orange} />
          <Metric label="H estático" value={sim.comps.H_static_m.toFixed(0)} unit="m" color={C.blue} />
          <Metric label="H fricción" value={sim.comps.H_friction_m.toFixed(0)} unit="m"
            color={sim.comps.H_friction_m / sim.comps.TDH_m > 0.35 ? C.warning : C.text}
            sub={`${Math.round(sim.comps.H_friction_m / sim.comps.TDH_m * 100)}% TDH`} />
          <Metric label="H contrapres." value={sim.comps.H_back_m.toFixed(0)} unit="m" color={C.muted} />
          <Metric label="Etapas req." value={sim.nStages} unit="etapas" color={sim.nStages > 150 ? C.warning : C.green} />
        </div>

        {/* Métricas secundarias */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <Metric label="Reynolds (BEP)" value={sim.comps.Re.toLocaleString()} unit={sim.comps.regime}
            color={sim.comps.regime === 'turbulento' ? C.green : sim.comps.regime === 'transición' ? C.warning : C.blue} />
          <Metric label="Factor f (C-W)" value={sim.comps.f.toFixed(4)} unit="Darcy" color={C.text} />
          <Metric label="Velocidad" value={sim.comps.v_ms} unit="m/s" color={sim.comps.v_ms > 3.5 ? C.danger : C.text} />
          <Metric label="Q operativo" value={sim.opPoint ? sim.opPoint.Q_m3d.toFixed(1) : '—'} unit="m³/d" color={C.red} />
        </div>

        {/* Velocidad específica */}
        <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>VELOCIDAD ESPECÍFICA</div>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 20, fontFamily: 'JetBrains Mono, monospace' }}>Ns = {sim.Ns.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>TIPO DE IMPULSOR</div>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{sim.nsType}</div>
            </div>
          </div>
          <NsBar Ns={sim.Ns} />
        </div>
      </div>
    </div>
  );
}

// ─── Tab Caso Práctico ─────────────────────────────────────────────
const CASO_STEPS = [
  {
    title: 'Paso 1 — Diagnóstico inicial',
    desc:  'El Pozo Garza-7 ha sido reactivado tras un workover. Se necesita seleccionar la bomba BES adecuada. Parámetros actuales: tubing de 2-7/8" (D = 2.441"), profundidad 2 100 m.',
    params: { depth: 2100, Pwh: 200, densidad: 0.891, D_in: 2.441, mu: 5, freq: 60, H0stage: 45 },
    task: '¿Cuántas etapas requiere la bomba? ¿Las pérdidas por fricción son significativas?',
    hint: 'Observa el porcentaje de fricción sobre el TDH. Si supera el 20%, evaluar un tubing mayor.',
  },
  {
    title: 'Paso 2 — Optimización de tubing',
    desc:  'El equipo de ingeniería propone cambiar al tubing de 3-1/2" (D = 2.992") disponible en almacén.',
    params: { depth: 2100, Pwh: 200, densidad: 0.891, D_in: 2.992, mu: 5, freq: 60, H0stage: 45 },
    task: '¿Cuánto se reducen las pérdidas por fricción? ¿Cambia el número de etapas requerido?',
    hint: 'La reducción de D de 2.441" a 2.992" equivale a un factor ~(2.441/2.992)⁵ ≈ 0.36 en fricción.',
  },
  {
    title: 'Paso 3 — Ajuste de frecuencia',
    desc:  'Con el tubing de 3-1/2" instalado, se ajusta la frecuencia del VSD a 55 Hz para optimizar el punto de operación respecto al BEP de la bomba seleccionada.',
    params: { depth: 2100, Pwh: 200, densidad: 0.891, D_in: 2.992, mu: 5, freq: 55, H0stage: 45 },
    task: '¿Cómo cambia el número de etapas y el TDH? ¿Se acerca el punto de operación al BEP?',
    hint: 'Las Leyes de Afinidad escalan: H_BEP ∝ (f/60)². A 55 Hz la altura disponible por etapa se reduce, lo que puede requerir más etapas.',
  },
];

function TabCaso() {
  const [step, setStep] = useState(0);
  const s = CASO_STEPS[step];
  const { depth, Pwh, densidad, D_in, mu, freq, H0stage } = s.params;

  const sim = useMemo(() => {
    const Q_bep_m3d = 2100 * (freq / 60) * STB_TO_M3;
    const comps     = tdhComponents(Q_bep_m3d, depth, Pwh, D_in, mu, densidad);
    const nStages   = computeRequiredStages(depth, Pwh, D_in, mu, densidad, freq, H0stage);
    const { Ns, type } = pumpSpecificSpeed(H0stage);
    const Qmax_m3d  = 4200 * (freq / 60) * STB_TO_M3;
    const N_pts     = 100;
    const chartData = [];
    for (let i = 0; i <= N_pts; i++) {
      const Q = (Qmax_m3d * 1.15 * i) / N_pts;
      const { TDH_m } = tdhComponents(Q, depth, Pwh, D_in, mu, densidad);
      const H_pump    = pumpHeadTotalM(Q, freq, nStages, H0stage);
      chartData.push({ Q: +Q.toFixed(1), Sistema: +TDH_m.toFixed(1), Bomba: +Math.max(0, H_pump).toFixed(1) });
    }
    const opPoint = findHydraulicOpPoint(depth, Pwh, D_in, mu, densidad, freq, nStages, H0stage);
    return { comps, nStages, Ns, nsType: type, chartData, opPoint, Q_bep_m3d };
  }, [step]);

  return (
    <div>
      <div style={{ color: C.green, fontWeight: 700, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
        CASO PRÁCTICO — POZO GARZA-7 · REACTIVACIÓN POST-WORKOVER
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginBottom: 16, lineHeight: 1.6 }}>
        El pozo Garza-7 fue reactivado tras workover. Objetivo: seleccionar la configuración óptima de bomba BES (etapas + tubing + frecuencia).
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {CASO_STEPS.map((cs, i) => (
          <button key={i} onClick={() => setStep(i)}
            style={{ flex: 1, padding: '10px 12px', background: step === i ? C.green : C.surfaceAlt, color: step === i ? '#000' : C.muted, border: `1px solid ${step === i ? C.green : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: step === i ? 700 : 400 }}>
            Paso {i + 1}
          </button>
        ))}
      </div>

      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ color: C.green, fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>{s.title}</div>
        <div style={{ color: C.text, fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}>{s.desc}</div>
        <div style={{ background: C.surfaceAlt, borderRadius: 6, padding: '8px 12px', color: C.blue, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
          📋 {s.task}
        </div>
        <div style={{ color: C.muted, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          💡 {s.hint}
        </div>
      </div>

      {/* Parámetros del paso */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[['depth', depth, 'm'], ['Pwh', Pwh, 'psi'], ['densidad', densidad, 'kg/L'], [`D_in`, D_in, '"'], ['mu', mu, 'cP'], ['freq', freq, 'Hz'], ['H₀', H0stage, 'ft/etapa']].map(([k, v, u]) => (
          <div key={k} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
            <span style={{ color: C.muted }}>{k} = </span>
            <span style={{ color: C.green, fontWeight: 700 }}>{v}</span>
            <span style={{ color: C.muted }}> {u}</span>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 8px 8px', marginBottom: 14 }}>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={sim.chartData} margin={{ top: 8, right: 20, left: 0, bottom: 10 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" />
            <XAxis dataKey="Q" stroke={C.muted} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: C.muted }} tickFormatter={v => Math.round(v)} />
            <YAxis stroke={C.muted} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fill: C.muted }} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }} />
            <Line type="monotone" dataKey="Sistema" stroke={C.orange} strokeWidth={2.5} dot={false} name="TDH sistema" />
            <Line type="monotone" dataKey="Bomba"   stroke={C.blue}   strokeWidth={2.5} dot={false} name="H-Q bomba" />
            <ReferenceLine x={+sim.Q_bep_m3d.toFixed(1)} stroke={C.pink} strokeDasharray="4 3" strokeWidth={1} />
            {sim.opPoint && <ReferenceDot x={sim.opPoint.Q_m3d} y={sim.opPoint.TDH_m} r={6} fill={C.red} stroke="none" />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resultados */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Metric label="TDH total" value={sim.comps.TDH_m.toFixed(0)} unit="m" color={C.orange} />
        <Metric label="H fricción" value={sim.comps.H_friction_m.toFixed(0)} unit="m"
          sub={`${Math.round(sim.comps.H_friction_m / sim.comps.TDH_m * 100)}% TDH`}
          color={sim.comps.H_friction_m / sim.comps.TDH_m > 0.2 ? C.warning : C.text} />
        <Metric label="Etapas req." value={sim.nStages} unit="etapas" color={C.green} />
        <Metric label="Re (BEP)" value={sim.comps.Re.toLocaleString()} unit={sim.comps.regime} color={C.blue} />
        <Metric label="Ns" value={sim.Ns.toLocaleString()} unit={sim.nsType} color={C.yellow} />
        <Metric label="Q operativo" value={sim.opPoint ? sim.opPoint.Q_m3d.toFixed(0) : '—'} unit="m³/d" color={C.red} />
      </div>

      {/* Botones navegación */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'space-between' }}>
        <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
          style={{ padding: '10px 20px', background: step === 0 ? C.surface : C.surfaceAlt, color: step === 0 ? C.muted : C.text, border: `1px solid ${C.border}`, borderRadius: 8, cursor: step === 0 ? 'not-allowed' : 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
          ← Paso anterior
        </button>
        <button onClick={() => setStep(Math.min(CASO_STEPS.length - 1, step + 1))} disabled={step === CASO_STEPS.length - 1}
          style={{ padding: '10px 20px', background: step === CASO_STEPS.length - 1 ? C.surface : C.green, color: step === CASO_STEPS.length - 1 ? C.muted : '#000', border: 'none', borderRadius: 8, cursor: step === CASO_STEPS.length - 1 ? 'not-allowed' : 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700 }}>
          Siguiente paso →
        </button>
      </div>
    </div>
  );
}

// ─── Tab Evaluación ───────────────────────────────────────────────
function TabEvaluacion() {
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result,    setResult]    = useState(null);

  const handleSelect = (qid, opt) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  };

  const handleSubmit = () => {
    const ans = M2_QUESTIONS.map(q => ({ id: q.id, selected: answers[q.id] || '' }));
    const r = gradeM2(ans);
    try { localStorage.setItem('simbes_eval_m2', JSON.stringify({ score_pct: r.pct, passed: r.pct >= 70, ts: Date.now() })); } catch {}
    setResult(r);
    setSubmitted(true);
  };

  const handleReset = () => {
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  };

  const allAnswered = M2_QUESTIONS.every(q => answers[q.id]);

  return (
    <div>
      <div style={{ color: C.green, fontWeight: 700, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', marginBottom: 16 }}>
        EVALUACIÓN — DISEÑO HIDRÁULICO BES
      </div>

      {submitted && result && (
        <div style={{ background: result.pct >= 80 ? '#052e16' : result.pct >= 60 ? '#431407' : '#450a0a', border: `1px solid ${result.pct >= 80 ? '#166534' : result.pct >= 60 ? '#92400e' : '#991b1b'}`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: result.pct >= 80 ? C.ok : result.pct >= 60 ? C.warning : C.danger }}>
            {result.score}/{result.total} correctas — {result.pct}%
          </div>
          <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
            {result.pct >= 80 ? '✅ Excelente. Puedes avanzar al Módulo 3.' : result.pct >= 60 ? '⚠️ Bien, pero repasa las respuestas incorrectas.' : '🔴 Repasa la teoría antes de continuar.'}
          </div>
        </div>
      )}

      {M2_QUESTIONS.map((q, qi) => {
        const sel     = answers[q.id];
        const res     = result?.results?.find(r => r.id === q.id);
        return (
          <div key={q.id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 14 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
              {qi + 1}. {q.text}
            </div>
            {q.options.map(opt => {
              let bg = C.surfaceAlt, border = C.border, color = C.muted;
              if (sel === opt.id && !submitted) { bg = '#1e3a5f'; border = C.blue; color = C.blue; }
              if (submitted && opt.id === q.correct) { bg = '#052e16'; border = C.ok; color = C.ok; }
              if (submitted && sel === opt.id && sel !== q.correct) { bg = '#450a0a'; border = C.danger; color = C.danger; }
              return (
                <button key={opt.id} onClick={() => handleSelect(q.id, opt.id)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: bg, border: `1px solid ${border}`, borderRadius: 7, padding: '10px 14px', marginBottom: 6, cursor: submitted ? 'default' : 'pointer', color, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, marginRight: 8 }}>{opt.id.toUpperCase()})</span>{opt.text}
                </button>
              );
            })}
            {submitted && res && (
              <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 14px', marginTop: 8, fontSize: 11, color: C.muted, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.6 }}>
                💬 {res.explanation}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
        {submitted && (
          <button onClick={handleReset}
            style={{ padding: '10px 24px', background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
            Reintentar
          </button>
        )}
        {!submitted && (
          <button onClick={handleSubmit} disabled={!allAnswered}
            style={{ padding: '10px 28px', background: allAnswered ? C.green : C.surface, color: allAnswered ? '#000' : C.muted, border: 'none', borderRadius: 8, cursor: allAnswered ? 'pointer' : 'not-allowed', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700 }}>
            Calificar →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Componente raíz Módulo 2 ─────────────────────────────────────
const TABS = ['A. Teoría', 'B. Simulador', 'C. Caso Práctico', 'D. Evaluación'];

export default function Module2() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '20px 32px', position: 'sticky', top: 40, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
          <div style={{ background: C.green, color: '#000', fontWeight: 800, borderRadius: 8, padding: '4px 12px', fontSize: 13, fontFamily: C.font }}>M2</div>
          <div style={{ color: C.green, fontWeight: 800, fontSize: 24, fontFamily: C.fontUI }}>Diseño Hidráulico</div>
          <div style={{ color: C.muted, fontSize: 12, fontFamily: C.fontUI }}>TDH · Colebrook-White · Ns · Etapas</div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
              style={{ padding: '8px 18px', background: activeTab === i ? C.green : 'transparent', color: activeTab === i ? '#000' : C.muted, border: `1px solid ${activeTab === i ? C.green : C.border}`, borderRadius: 8, cursor: 'pointer', fontFamily: C.fontUI, fontSize: 12, fontWeight: activeTab === i ? 700 : 400 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '28px 32px' }}>
        {activeTab === 0 && <TabTeoria />}
        {activeTab === 1 && <TabSimulador />}
        {activeTab === 2 && <TabCaso />}
        {activeTab === 3 && <TabEvaluacion />}
      </div>
    </div>
  );
}
