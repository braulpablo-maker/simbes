/**
 * SIMBES — Módulo 5: Sensores y Monitoreo
 * =========================================
 * Física: cartas amperimétricas, P/T downhole, vibración, diagnóstico integrado.
 * @ref API RP 11S5 | ISO 10816-3 | CLAUDE.md §2.6
 */
import { useState, useMemo } from "react";
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  simulateCurrentPattern,
  simulateVibration,
  bottomholeTemperature,
  integratedDiagnosis,
} from "../../../physics/sensors";
import { M5_QUESTIONS, gradeM5, sampleQuestions as sampleM5 } from "../../../pedagogy/evaluations/m5";
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M5 } from './teoria-data';
import { Slider } from '../../ui';
import { C } from '../../../theme';
import ModuleLayout from '../../ui/ModuleLayout';

// ─── Constantes ──────────────────────────────────────────────────────────────
const ACCENT = "#FB923C";

const CURRENT_CONDITIONS = [
  { key: "normal",    label: "Normal",    color: C.ok },
  { key: "surging",   label: "Surging",   color: C.warn },
  { key: "underload", label: "Subcarga",  color: "#60A5FA" },
  { key: "overload",  label: "Sobrecarga",color: "#FB923C" },
  { key: "gas_lock",  label: "Gas Lock",  color: C.danger },
];

const VIBE_CONDITIONS = [
  { key: "normal",      label: "Normal",     color: C.ok },
  { key: "desbalanceo", label: "Desbalanceo",color: C.warn },
  { key: "rodamiento",  label: "Rodamiento", color: "#FB923C" },
  { key: "cavitacion",  label: "Cavitación", color: C.danger },
];

const INSULATION_CLASSES = [
  { label: "Clase F (155°C)", T: 155 },
  { label: "Clase H (180°C)", T: 180 },
  { label: "Clase C (220°C)", T: 220 },
];

const TOOLTIP_STYLE = {
  background: "#0D1424", border: "1px solid #1E293B",
  fontSize: 10, color: "#CBD5E1", fontFamily: "JetBrains Mono, monospace",
};

// ─── Micro-componentes ───────────────────────────────────────────────────────
function Param({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 9, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{hint}</div>}
    </div>
  );
}

function SeverityBadge({ severity, title, desc }) {
  const col = severity === "danger" ? C.danger : severity === "warning" ? C.warn : C.ok;
  const icon = severity === "danger" ? "🔴" : severity === "warning" ? "🟡" : "🟢";
  return (
    <div style={{
      background: col + "10", border: `1px solid ${col}35`,
      borderRadius: 6, padding: "8px 12px",
    }}>
      <div style={{ fontSize: 10, color: col, fontWeight: 700, fontFamily: "JetBrains Mono, monospace", marginBottom: 2 }}>
        {icon} {title}
      </div>
      <div style={{ fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

function VibeMeter({ rms }) {
  const zones = [
    { label: "A OK",  max: 4.0,  color: C.ok },
    { label: "B ⚠️",  max: 6.3,  color: C.warn },
    { label: "C 🔴",  max: 10.0, color: C.danger },
  ];
  const totalMax = 10.0;
  const col = rms > 6.3 ? C.danger : rms > 4.0 ? C.warn : C.ok;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
        <span>RMS Vibración</span>
        <span style={{ color: col, fontWeight: 700 }}>{rms} mm/s</span>
      </div>
      <div style={{ position: "relative", height: 12, borderRadius: 6, overflow: "hidden", background: "#1E293B" }}>
        {zones.map((z, i) => {
          const prev = i === 0 ? 0 : zones[i - 1].max;
          const left = (prev / totalMax) * 100;
          const width = ((z.max - prev) / totalMax) * 100;
          return (
            <div key={i} style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "100%", background: z.color, opacity: 0.25 }} />
          );
        })}
        <div style={{
          position: "absolute", left: 0, height: "100%",
          width: `${Math.min(100, (rms / totalMax) * 100)}%`,
          background: col, borderRadius: 6, transition: "width 0.3s",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
        <span>0</span><span>4 mm/s</span><span>6.3 mm/s</span><span>10 mm/s</span>
      </div>
    </div>
  );
}

// ─── Tab A: Teoría ────────────────────────────────────────────────────────────
function TabTeoria() {
  return <TheoryLayout sections={TEORIA_M5} accentColor="#FB923C" />;
}

// ─── Tab B: Simulador ────────────────────────────────────────────────────────
function TabSimulador() {
  const [currentCond, setCurrentCond] = useState("normal");
  const [I_rated,     setIRated]      = useState(80);
  const [vibeCond,    setVibeCond]    = useState("normal");
  const [depth_m,     setDepth]       = useState(1800);
  const [T_surface,   setTSurf]       = useState(25);
  const [gradient,    setGradient]    = useState(3.0);
  const [Ps_psi,      setPs]          = useState(900);
  const [Pb_psi,      setPb]          = useState(1800);
  const [T_rated,     setTRated]      = useState(180);

  const sim = useMemo(() => {
    const current = simulateCurrentPattern(currentCond, I_rated);
    const vibe    = simulateVibration(vibeCond, 3600);
    const pt      = bottomholeTemperature(T_surface, depth_m, gradient);
    const T_motor = pt.T_bottomhole_C;

    const diagnosis = integratedDiagnosis({
      currentCondition: currentCond,
      rms_mm_s: vibe.rms_mm_s,
      Ps_psi,
      Pb_psi,
      T_motor_C: T_motor,
      T_rated_C: T_rated,
    });

    const currentMeta = CURRENT_CONDITIONS.find(c => c.key === currentCond);
    const vibeMeta    = VIBE_CONDITIONS.find(v => v.key === vibeCond);

    return { current, vibe, pt, T_motor, diagnosis, currentMeta, vibeMeta };
  }, [currentCond, I_rated, vibeCond, depth_m, T_surface, gradient, Ps_psi, Pb_psi, T_rated]);

  const currentColor = sim.currentMeta?.color ?? C.ok;
  const vibeColor    = sim.vibe.alert === "danger" ? C.danger : sim.vibe.alert === "warning" ? C.warn : C.ok;
  const T_motorColor = sim.T_motor > T_rated ? C.danger : sim.T_motor > T_rated - 10 ? C.warn : C.ok;
  const PsColor      = Ps_psi < Pb_psi * 0.5 ? C.danger : Ps_psi < Pb_psi ? C.warn : C.ok;

  return (
    <div style={{ display: "flex", gap: 20, minWidth: 780, overflowX: 'auto' }}>
      {/* ── Controls ── */}
      <div style={{ width: 230, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Carta amperimérica */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>CARTA AMPERIMÉRICA</div>
          <Param label="Condición operativa">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {CURRENT_CONDITIONS.map(c => (
                <button key={c.key} onClick={() => setCurrentCond(c.key)} style={{
                  padding: "5px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: currentCond === c.key ? c.color + "22" : "transparent",
                  border: `1px solid ${currentCond === c.key ? c.color : C.border}`,
                  color: currentCond === c.key ? c.color : C.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>{c.label}</button>
              ))}
            </div>
          </Param>
          <Slider label="Corriente nominal" unit="A"
            value={I_rated} min={30} max={200} step={5}
            onChange={v => setIRated(v)} accentColor={ACCENT}
            tooltip="Corriente nominal del motor al 100% de carga. Las cartas muestran variaciones como % de este valor de referencia." />
        </div>

        {/* Vibración */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, color: "#A78BFA", letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>VIBRACIÓN</div>
          <Param label="Condición de vibración">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {VIBE_CONDITIONS.map(v => (
                <button key={v.key} onClick={() => setVibeCond(v.key)} style={{
                  padding: "5px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: vibeCond === v.key ? v.color + "22" : "transparent",
                  border: `1px solid ${vibeCond === v.key ? v.color : C.border}`,
                  color: vibeCond === v.key ? v.color : C.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>{v.label}</button>
              ))}
            </div>
          </Param>
        </div>

        {/* P/T Downhole */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, color: "#38BDF8", letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>P/T DOWNHOLE</div>
          <Slider label="Profundidad" unit="m"
            value={depth_m} min={500} max={5000} step={50}
            onChange={v => setDepth(v)} accentColor="#38BDF8"
            tooltip="Profundidad de instalación de la bomba BES. Determina T_BH = T_sup + (gradiente × profundidad)." />
          <Slider label="T° superficie" unit="°C"
            value={T_surface} min={10} max={50} step={1}
            onChange={v => setTSurf(v)} accentColor="#38BDF8"
            tooltip="Temperatura superficial. Base para el cálculo de T_BH. Valor típico: 20–35°C en campo." />
          <Slider label="Gradiente geotérmico" unit="°C/100m"
            value={gradient} min={1.5} max={5.0} step={0.1} dec={1}
            onChange={v => setGradient(v)} accentColor="#38BDF8"
            tooltip="Variación de temperatura con profundidad. Típico: 2.5–4.0°C cada 100 m. Zonas volcánicas pueden superar 5°C/100m." />
          <Slider label="Ps — Presión succión" unit="psi"
            value={Ps_psi} min={100} max={3000} step={50}
            onChange={v => setPs(v)} accentColor={PsColor}
            tooltip="Pump intake pressure. Si Ps < Pb → gas libre en la bomba. Ps/Pb < 0.5 → riesgo alto de gas lock." />
          <Slider label="Pb — Presión de burbuja" unit="psi"
            value={Pb_psi} min={200} max={4000} step={50}
            onChange={v => setPb(v)} accentColor={C.muted}
            tooltip="Presión de burbuja del crudo. Por debajo de Pb el gas sale de solución. Definida por el PVT del yacimiento." />
          <Param label="Clase de aislamiento">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {INSULATION_CLASSES.map(c => (
                <button key={c.T} onClick={() => setTRated(c.T)} style={{
                  padding: "4px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: T_rated === c.T ? "#38BDF822" : "transparent",
                  border: `1px solid ${T_rated === c.T ? "#38BDF8" : C.border}`,
                  color: T_rated === c.T ? "#38BDF8" : C.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>{c.label}</button>
              ))}
            </div>
          </Param>
        </div>
      </div>

      {/* ── Charts + Results ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Corriente promedio",  value: sim.current.avg_I,          unit: "A",     color: currentColor },
            { label: "% Nominal",           value: sim.current.pct_nominal,     unit: "%",     color: currentColor },
            { label: "Vibración RMS",       value: sim.vibe.rms_mm_s,          unit: "mm/s",  color: vibeColor },
            { label: "T° Motor estimada",   value: sim.T_motor,                unit: "°C",    color: T_motorColor },
          ].map((m, i) => (
            <div key={i} style={{ background: C.surface, border: `1px solid ${m.color}30`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: "JetBrains Mono, monospace" }}>
                {m.value}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Carta amperimérica chart */}
        <div style={{ background: C.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
              Carta Amperimérica — {sim.currentMeta?.label} · I_rated={I_rated} A
            </div>
            <div style={{ fontSize: 9, color: currentColor, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
              {sim.current.diagnosis.split(".")[0]}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={sim.current.data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                label={{ value: "t [s]", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} domain={[0, I_rated * 1.5]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} A`, "Corriente"]} labelFormatter={v => `t=${v}s`} />
              <ReferenceLine y={I_rated}         stroke={C.muted}   strokeDasharray="4 2" label={{ value: "I_rated", fill: C.muted,  fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
              <ReferenceLine y={I_rated * 1.15}  stroke={C.warn}    strokeDasharray="3 2" label={{ value: "+15%",  fill: C.warn,    fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
              <ReferenceLine y={I_rated * 0.70}  stroke="#60A5FA"   strokeDasharray="3 2" label={{ value: "−30%",  fill: "#60A5FA", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
              <Line type="monotone" dataKey="I" stroke={currentColor} strokeWidth={1.8} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Vibración chart */}
        <div style={{ background: C.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
              Señal de Vibración — {sim.vibeMeta?.label} · 3600 RPM
            </div>
            <div style={{ fontSize: 9, color: vibeColor, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
              RMS {sim.vibe.rms_mm_s} mm/s · Pico {sim.vibe.peak_mm_s} mm/s
            </div>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={sim.vibe.signal} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                label={{ value: "t [s]", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
              <YAxis tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} mm/s`, "Velocidad"]} />
              <Line type="monotone" dataKey="v" stroke={vibeColor} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 10 }}>
            <VibeMeter rms={sim.vibe.rms_mm_s} />
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
            <span style={{ color: vibeColor }}>Causa probable: </span>{sim.vibe.cause} · {sim.vibe.recommendation}
          </div>
        </div>

        {/* P/T summary + Diagnóstico */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 14 }}>
          <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: "#38BDF8", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 10 }}>P/T DOWNHOLE</div>
            {[
              { label: "T° fondo", value: `${sim.T_motor}°C`, color: T_motorColor },
              { label: "T° cable avg", value: `${sim.pt.T_cable_avg_C}°C`, color: C.text },
              { label: "Ps / Pb", value: `${Ps_psi} / ${Pb_psi} psi`, color: PsColor },
              { label: "Ps/Pb ratio", value: `${(Ps_psi / Pb_psi * 100).toFixed(0)}%`, color: PsColor },
            ].map((r, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{r.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "JetBrains Mono, monospace" }}>{r.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 9, color: ACCENT, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>DIAGNÓSTICO INTEGRADO</div>
            {sim.diagnosis.map((d, i) => <SeverityBadge key={i} {...d} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab C: Caso Práctico ────────────────────────────────────────────────────
const CASO_STEPS = [
  {
    id: 1,
    title: "Paso 1 — Carta Amperimérica: Identificar Anomalía",
    context: "Pozo Cóndor-8: BES instalado a 2200 m. El operador registra la carta amperimérica durante el turno nocturno y nota un patrón inusual en la corriente del motor (I_rated = 95 A).",
    task: "Seleccioná la condición 'Surging' en la carta amperimérica y determiná qué acción operativa corresponde.",
    hint: "El surging se manifiesta como oscilaciones periódicas de corriente ±15–25% alrededor del nominal. Indica operación fuera del BEP.",
    condition: "surging", I_rated: 95,
    conclusion: "Corriente oscilando entre 76–114 A a ~0.4 Hz. Diagnóstico: Surging. Acción: ajustar frecuencia VSD para acercar el punto de operación al BEP.",
  },
  {
    id: 2,
    title: "Paso 2 — Vibración: Evaluar Severidad",
    context: "Tras ajustar el VSD, la corriente se estabiliza. Sin embargo, el sensor de vibración registra un patrón con impactos de alta frecuencia. El RMS es 5.8 mm/s.",
    task: "Seleccioná la condición 'Rodamiento' en el panel de vibración y evaluá la zona operativa según ISO 10816-3.",
    hint: "Rodamiento: impactos periódicos a 4–6× f_rot. Con RMS 5.8 mm/s estamos en zona B. No requiere paro inmediato, pero debe planificarse la extracción.",
    vibeCondition: "rodamiento",
    conclusion: "RMS 5.8 mm/s → Zona B (4.0–6.3 mm/s). Causa: defecto de rodamiento en falla progresiva. Planificar extracción preventiva en próximo ciclo de mantenimiento.",
  },
  {
    id: 3,
    title: "Paso 3 — Diagnóstico Integrado: P/T + Sensores",
    context: "El DPTS reporta: Ps = 650 psi, Pb = 1800 psi, T_motor = 188°C. El aislamiento es clase H (límite 180°C). Combinando todos los sensores.",
    task: "Ingresá Ps=650, Pb=1800, T_motor≈188°C (gradiente 4.5°C/100m a 2200m desde 25°C superficial) y analizá el diagnóstico integrado.",
    depth_m: 2200, T_surface: 25, gradient: 4.5, Ps_psi: 650, Pb_psi: 1800, T_rated: 180,
    conclusion: "Diagnóstico integrado: (1) Ps=650 < Pb=1800 → gas libre en succión, (2) T_motor=188°C > 180°C → Arrhenius activo, vida ~67%. Prioridad: instalar AGS + reducir drawdown + monitorear temperatura.",
  },
];

function TabCaso() {
  const [step, setStep] = useState(0);
  const s = CASO_STEPS[step];

  const result = useMemo(() => {
    if (step === 0) {
      return simulateCurrentPattern(s.condition, s.I_rated);
    }
    if (step === 1) {
      return simulateVibration(s.vibeCondition, 3600);
    }
    if (step === 2) {
      const pt = bottomholeTemperature(s.T_surface, s.depth_m, s.gradient);
      const diagnosis = integratedDiagnosis({
        currentCondition: "normal",
        rms_mm_s: 5.8,
        Ps_psi: s.Ps_psi,
        Pb_psi: s.Pb_psi,
        T_motor_C: pt.T_bottomhole_C,
        T_rated_C: s.T_rated,
      });
      return { pt, diagnosis };
    }
  }, [step]);

  const currentMeta = CURRENT_CONDITIONS.find(c => c.key === (s.condition || "normal"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {CASO_STEPS.map((c, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 10, cursor: "pointer",
            background: step === i ? ACCENT + "22" : "transparent",
            border: `1px solid ${step === i ? ACCENT : C.border}`,
            color: step === i ? ACCENT : C.muted,
            fontFamily: "JetBrains Mono, monospace",
          }}>Paso {i + 1}</button>
        ))}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>POZO CÓNDOR-8 · Caso integrador M5</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>{s.title}</div>
            <div style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7, marginBottom: 12 }}>{s.context}</div>
            <div style={{ background: ACCENT + "10", border: `1px solid ${ACCENT}30`, borderRadius: 6, padding: "10px 14px", fontSize: 10, color: ACCENT, fontFamily: "JetBrains Mono, monospace" }}>
              📋 {s.task}
            </div>
          </div>
          <div style={{ background: "#0D1424", borderRadius: 6, padding: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>💡 PISTA</div>
            <div style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", marginTop: 4, lineHeight: 1.6 }}>{s.hint}</div>
          </div>
          <div style={{ background: C.ok + "08", border: `1px solid ${C.ok}25`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 9, color: C.ok, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 6 }}>CONCLUSIÓN</div>
            <div style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>{s.conclusion}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {step === 0 && result && (
            <>
              <div style={{ background: C.surfAlt, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>Carta amperimérica — Surging</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={result.data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="t" tick={{ fontSize: 8, fill: C.muted }} />
                    <YAxis tick={{ fontSize: 8, fill: C.muted }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} A`, "I"]} />
                    <ReferenceLine y={s.I_rated} stroke={C.muted} strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="I" stroke={C.warn} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <SeverityBadge severity="warning" title="Surging detectado" desc={result.diagnosis} />
            </>
          )}
          {step === 1 && result && (
            <>
              <div style={{ background: C.surfAlt, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>Señal de vibración — Rodamiento</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={result.signal} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="t" tick={{ fontSize: 8, fill: C.muted }} />
                    <YAxis tick={{ fontSize: 8, fill: C.muted }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v} mm/s`, "v"]} />
                    <Line type="monotone" dataKey="v" stroke={C.warn} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 10 }}><VibeMeter rms={result.rms_mm_s} /></div>
              </div>
              <SeverityBadge severity="warning" title={`RMS ${result.rms_mm_s} mm/s — Zona B`} desc={`${result.cause}. ${result.recommendation}`} />
            </>
          )}
          {step === 2 && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: "#38BDF8", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 8 }}>DPTS — Lecturas</div>
                {[
                  { label: "T° motor (fondo)", value: `${result.pt.T_bottomhole_C}°C`, color: result.pt.T_bottomhole_C > 180 ? C.danger : C.ok },
                  { label: "Ps / Pb", value: `${s.Ps_psi} / ${s.Pb_psi} psi`, color: C.danger },
                  { label: "Ps/Pb ratio", value: `${(s.Ps_psi / s.Pb_psi * 100).toFixed(0)}%`, color: C.danger },
                ].map((r, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{r.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: r.color, fontFamily: "JetBrains Mono, monospace" }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.diagnosis.map((d, i) => <SeverityBadge key={i} {...d} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
          padding: "8px 20px", borderRadius: 6, border: `1px solid ${C.border}`,
          background: "transparent", color: C.muted, cursor: step === 0 ? "not-allowed" : "pointer",
          fontSize: 10, fontFamily: "JetBrains Mono, monospace",
        }}>← Anterior</button>
        <button onClick={() => setStep(s => Math.min(CASO_STEPS.length - 1, s + 1))} disabled={step === CASO_STEPS.length - 1} style={{
          padding: "8px 20px", borderRadius: 6, border: `1px solid ${ACCENT}`,
          background: ACCENT + "22", color: ACCENT,
          cursor: step === CASO_STEPS.length - 1 ? "not-allowed" : "pointer",
          fontSize: 10, fontFamily: "JetBrains Mono, monospace",
        }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── Tab D: Evaluación ───────────────────────────────────────────────────────
function TabEvaluacion() {
  const [questions] = useState(() => sampleM5(5));
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const select = (qId, optId) => { if (!result) setAnswers(p => ({ ...p, [qId]: optId })); };
  const submit = () => {
    const r = gradeM5(questions.map(q => ({ id: q.id, selected: answers[q.id] || "" })));
    try { localStorage.setItem('simbes_eval_m5', JSON.stringify({ score_pct: r.pct, passed: r.pct >= 70, ts: Date.now() })); } catch {}
    setResult(r);
  };
  const reset  = () => { setAnswers({}); setResult(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {result && (
        <div style={{
          background: result.pct >= 80 ? C.ok + "12" : result.pct >= 60 ? C.warn + "12" : C.danger + "12",
          border: `1px solid ${result.pct >= 80 ? C.ok : result.pct >= 60 ? C.warn : C.danger}40`,
          borderRadius: 8, padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: result.pct >= 80 ? C.ok : result.pct >= 60 ? C.warn : C.danger, fontFamily: "JetBrains Mono, monospace" }}>
              {result.score}/{result.total} — {result.pct}%
            </div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
              {result.pct >= 80 ? "Excelente. Dominás la interpretación de sensores BES." : result.pct >= 60 ? "Buena base. Revisá los patrones de corriente y vibración." : "Revisá los conceptos de cartas amperimétricas, vibración y diagnóstico integrado."}
            </div>
          </div>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>Reintentar</button>
        </div>
      )}
      {questions.map((q, qi) => {
        const res = result?.results.find(r => r.id === q.id);
        return (
          <div key={q.id} style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.text, fontFamily: "JetBrains Mono, monospace", marginBottom: 12, lineHeight: 1.6 }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>{qi + 1}. </span>{q.text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map(opt => {
                const selected   = answers[q.id] === opt.id;
                const isCorrect  = res && opt.id === q.correct;
                const isWrong    = res && !isCorrect;
                const color = isCorrect ? C.ok : isWrong ? C.danger : selected ? ACCENT : C.border;
                return (
                  <button key={opt.id} onClick={() => select(q.id, opt.id)} style={{
                    textAlign: "left", padding: "8px 12px", borderRadius: 6,
                    background: selected ? color + "12" : "transparent",
                    border: `1px solid ${color}`,
                    color: selected ? color : C.muted,
                    cursor: result ? "default" : "pointer",
                    fontSize: 10, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5,
                  }}>
                    <span style={{ fontWeight: 700 }}>{opt.id.toUpperCase()})</span> {opt.text}
                  </button>
                );
              })}
            </div>
            {res && (
              <div style={{ marginTop: 10, background: C.ok + "08", border: `1px solid ${C.ok}25`, borderRadius: 6, padding: "10px 14px", fontSize: 10, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
                💡 {res.isOk ? res.explanation : (res.incorrect_feedback?.[res.selected] || res.explanation)}
              </div>
            )}
          </div>
        );
      })}
      {!result && (
        <button onClick={submit} disabled={Object.keys(answers).length < questions.length} style={{
          padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT,
          cursor: Object.keys(answers).length < questions.length ? "not-allowed" : "pointer",
          opacity: Object.keys(answers).length < questions.length ? 0.5 : 1,
          fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
        }}>
          CALIFICAR ({Object.keys(answers).length}/{questions.length} respondidas)
        </button>
      )}
    </div>
  );
}

// ─── Root Module5 ────────────────────────────────────────────────────────────
const TABS = [
  { id: "teoria", label: "A — Teoría" },
  { id: "sim",    label: "B — Simulador" },
  { id: "caso",   label: "C — Caso Práctico" },
  { id: "eval",   label: "D — Evaluación" },
];

export default function Module5({ onBack }) {
  const [tab, setTab] = useState("teoria");
  return (
    <ModuleLayout
      moduleId="M05"
      title="Sensores y Monitoreo"
      subtitle="Cartas Amperimétricas · P/T Downhole · Vibración · Diagnóstico"
      accentColor={ACCENT}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      onBack={onBack}
    >
      {tab === "teoria" && <TabTeoria />}
      {tab === "sim"    && <TabSimulador />}
      {tab === "caso"   && <TabCaso />}
      {tab === "eval"   && <TabEvaluacion />}
    </ModuleLayout>
  );
}
