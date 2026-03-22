/**
 * SIMBES — Módulo 4: Eléctrico y VSD
 * =====================================
 * Física: caída de voltaje en cable, Arrhenius, THD por topología VSD, NACE MR0175.
 * @ref IEEE 519-2014 | NACE MR0175 / ISO 15156 | Arrhenius (1889) | ABB TN060
 */
import { useState, useMemo } from "react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";
import {
  cableVoltageDrop,
  arrheniusLifeFactor,
  thdEstimate,
  materialRecommendation,
  VSD_THD,
  IEEE519_LIMIT,
} from "../../../physics/electrical";
import { M4_QUESTIONS, gradeM4 } from "../../../pedagogy/evaluations/m4";
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M4 } from './teoria-data';

import { C } from '../../../theme';

// ─── Constantes ─────────────────────────────────────────────────────────────
const ACCENT   = "#F472B6";   // M4 rosa
// Alias de compatibilidad para referencias internas
const COLORS   = {
  ...C,
  surfAlt: C.surfaceAlt,
  warn:    C.warning,
};

const AWG_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 14];

const VSD_TOPOLOGIES = [
  { key: "standard_6pulse", label: "6P" },
  { key: "12pulse",         label: "12P" },
  { key: "18pulse",         label: "18P" },
  { key: "afe",             label: "AFE" },
  { key: "active_filter",   label: "Filtro Activo" },
];

const INSULATION_CLASSES = [
  { label: "Clase F  (155°C)", T: 155 },
  { label: "Clase H  (180°C)", T: 180 },
  { label: "Clase C  (220°C)", T: 220 },
];

// ─── Utilidades visuales ─────────────────────────────────────────────────────
function Param({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 9, color: "#475569", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Metric({ label, value, unit, color = COLORS.text, size = 20 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: size, fontWeight: 800, color, fontFamily: "JetBrains Mono, monospace" }}>
        {value}<span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

function Alert({ type, msg }) {
  const c = type === "danger" ? COLORS.danger : type === "warn" ? COLORS.warn : COLORS.ok;
  const icon = type === "danger" ? "🔴" : type === "warn" ? "🟡" : "🟢";
  return (
    <div style={{
      background: c + "12", border: `1px solid ${c}40`,
      borderRadius: 6, padding: "8px 12px",
      fontSize: 10, color: c, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6,
    }}>
      {icon} {msg}
    </div>
  );
}

function ProgressBar({ pct, label, color = COLORS.ok, max = 100 }) {
  const w = Math.min(100, (pct / max) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>
        <span>{label}</span><span style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: 4, transition: "width 0.2s" }} />
      </div>
    </div>
  );
}

// ─── Tab A: Teoría ────────────────────────────────────────────────────────────
const TEORIA_SECTIONS = [
  {
    id: "cable", title: "Cable Eléctrico · Caída de Voltaje",
    body: `El cable del motor BES transporta la energía eléctrica desde superficie hasta el motor en el fondo. La resistencia aumenta con la temperatura, incrementando las pérdidas.

Resistencia corregida por temperatura:
  R_T = R_20 × (1 + α × (T_avg − 20))   [Ω]

  α_cobre = 0.00393 /°C

Caída de voltaje (trifásico):
  V_drop = I × R_T × 3   [V]

Límites operativos:
  • < 5% del voltaje nominal → OK
  • 5–10% → ADVERTENCIA (calentamiento adicional)
  • > 10% → PELIGRO (pérdida de eficiencia severa)

Calibres AWG: a menor número → mayor diámetro → menor resistencia.
  AWG #1 (R ≈ 0.124 Ω/1000ft)  vs.  AWG #14 (R ≈ 2.525 Ω/1000ft)`,
  },
  {
    id: "arrhenius", title: "Regla de Arrhenius · Degradación de Aislamiento",
    body: `El aislamiento del motor es el componente más sensible a la temperatura. La regla de los 10°C (Arrhenius simplificado) establece:

  τ₂/τ₁ = 2^((T₁ − T₂) / 10)

Interpretación: por cada 10°C sobre el límite nominal del aislamiento, la vida útil se REDUCE A LA MITAD.

Ejemplo (motor clase H, límite 180°C):
  T_op = 180°C → vida = 100% (nominal)
  T_op = 190°C → vida = 50%
  T_op = 200°C → vida = 25%
  T_op = 220°C → vida = 6.25%

Clases de aislamiento típicas en BES:
  • Clase F: 155°C   • Clase H: 180°C   • Clase C: 220°C`,
  },
  {
    id: "thd", title: "THD · Distorsión Armónica Total",
    body: `El VSD (Variable Speed Drive) convierte frecuencia de red y genera armónicos de corriente que degradan la calidad de la red eléctrica.

THD por topología (representativo — ABB TN060):
  6 pulsos estándar  → THD ≈ 30%   ❌
  12 pulsos          → THD ≈ 17.5% ❌
  18 pulsos          → THD ≈ 4%    ✅
  Active Front End   → THD ≈ 2.5%  ✅
  Filtro Activo      → THD ≈ 1.5%  ✅

IEEE 519-2014: límite THDv < 5% en el Punto de Acoplamiento Común (PCC).

Impactos del THD alto:
  • Calentamiento de transformadores y motores
  • Errores en instrumentación y medición
  • Interferencia en comunicaciones y SCADA`,
  },
  {
    id: "nace", title: "Selección de Materiales · NACE MR0175",
    body: `La norma NACE MR0175 / ISO 15156 rige la selección de materiales para ambientes con H₂S (gas amargo), donde existe riesgo de SSC (Sulfide Stress Cracking).

Condición → Material requerido:
  T > 140°C                → EPDM o PEEK (no NBR)
  H₂S presente             → Lead Sheath + Monel 400
  Inyección de solventes    → PEEK mandatorio

Consecuencia de incumplimiento:
  El H₂S difunde a través de los elastómeros NBR a alta temperatura,
  causando descompresión explosiva al detener el pozo y pérdida de
  hermeticidad del sello del motor (invasión de fluidos → falla).`,
  },
  {
    id: "glosario", title: "Glosario M4",
    body: `AWG — American Wire Gauge: escala inversa de calibre de conductor.
VSD — Variable Speed Drive: variador de frecuencia que controla la velocidad del motor.
THD — Total Harmonic Distortion: distorsión armónica total de voltaje o corriente.
PCC — Point of Common Coupling: punto de conexión común en la red eléctrica.
IEEE 519-2014 — norma para control de armónicos en sistemas de potencia eléctrica.
AFE — Active Front End: rectificador IGBT activo de muy bajo THD.
SSC — Sulfide Stress Cracking: fisuración por tensión en presencia de H₂S.
NACE MR0175 — norma de materiales para ambientes con gas amargo (H₂S).
Lead Sheath — camisa de plomo usada en cables para pozos con H₂S.
Monel 400 — aleación Ni-Cu resistente a la corrosión por H₂S.
Clase H — clase de aislamiento con límite de 180°C (la más común en BES profundos).`,
  },
];

function TabTeoria() {
  return <TheoryLayout sections={TEORIA_M4} accentColor="#F472B6" />;
}

// ─── Tab B: Simulador ────────────────────────────────────────────────────────
const TOOLTIP_STYLE = { background: "#0D1424", border: "1px solid #1E293B", fontSize: 10, color: "#CBD5E1", fontFamily: "JetBrains Mono, monospace" };

function TabSimulador() {
  // Controls
  const [awg,       setAwg]       = useState(6);
  const [depth_ft,  setDepth]     = useState(5000);
  const [I_amps,    setI]         = useState(80);
  const [T_bot,     setTBot]      = useState(160);
  const [T_rated,   setTRated]    = useState(180);
  const [topo,      setTopo]      = useState("standard_6pulse");
  const [h2s,       setH2S]       = useState(false);
  const [solvent,   setSolvent]   = useState(false);

  const sim = useMemo(() => {
    // Cable
    const cable = cableVoltageDrop(awg, depth_ft, I_amps, T_bot);

    // Arrhenius
    const arrh = arrheniusLifeFactor(T_bot, T_rated);

    // THD
    const thd = thdEstimate(topo);

    // NACE
    const nace = materialRecommendation(T_bot, h2s, solvent);

    // Sensibilidad AWG: V_drop% para cada calibre
    const awgChart = AWG_OPTIONS.map(a => {
      const r = cableVoltageDrop(a, depth_ft, I_amps, T_bot);
      return { name: `#${a}`, pct: +r.pct_drop.toFixed(2), awg: a };
    });

    // THD chart: todos los topologías
    const thdChart = VSD_TOPOLOGIES.map(t => {
      const r = thdEstimate(t.key);
      return { name: t.label, THD: r.THD_pct, key: t.key };
    });

    // Arrhenius curve: delta_T de 0 a 60°C
    const arrhCurve = Array.from({ length: 61 }, (_, i) => {
      const dT  = i;
      const lf  = Math.pow(2, -dT / 10) * 100;
      return { dT, life: +lf.toFixed(1) };
    });

    // Alerts
    const alerts = [];
    if (cable.danger_10pct)
      alerts.push({ type: "danger", msg: `Caída de voltaje CRÍTICA: ${cable.pct_drop.toFixed(1)}% (>${10}%). Riesgo de falla de motor. Usar AWG #${Math.max(1, awg - 4)} o reducir corriente.` });
    else if (cable.warning_5pct)
      alerts.push({ type: "warn", msg: `Caída de voltaje elevada: ${cable.pct_drop.toFixed(1)}% (>5%). Evaluar calibre de cable o rediseñar.` });
    else
      alerts.push({ type: "ok", msg: `Caída de voltaje ${cable.pct_drop.toFixed(1)}% dentro de límite. Cable AWG #${awg} adecuado para esta profundidad y corriente.` });

    if (arrh.warning) {
      const halvings = Math.round(arrh.delta_T_C / 10);
      alerts.push({ type: arrh.delta_T_C > 20 ? "danger" : "warn",
        msg: `Arrhenius: ${arrh.delta_T_C.toFixed(0)}°C sobre límite → vida = ${arrh.pct_life_remaining.toFixed(0)}% del nominal (${halvings}× reducción por factor 2).` });
    } else {
      alerts.push({ type: "ok", msg: `Temperatura dentro del límite de aislamiento. Vida útil = 100%.` });
    }

    if (!thd.complies_ieee519)
      alerts.push({ type: "warn", msg: `THD = ${thd.THD_pct}% supera IEEE 519-2014 (${IEEE519_LIMIT}%). ${thd.recommendation}` });
    else
      alerts.push({ type: "ok", msg: `THD = ${thd.THD_pct}% cumple IEEE 519-2014 (<${IEEE519_LIMIT}%). Topología ${thd.topology_desc} apta.` });

    if (nace.warnings.length > 0)
      alerts.push(...nace.warnings.map(w => ({ type: "warn", msg: w })));
    else
      alerts.push({ type: "ok", msg: "Materiales estándar adecuados para las condiciones del pozo." });

    return { cable, arrh, thd, nace, awgChart, thdChart, arrhCurve, alerts };
  }, [awg, depth_ft, I_amps, T_bot, T_rated, topo, h2s, solvent]);

  const arrhColor = !sim.arrh.warning ? COLORS.ok : sim.arrh.delta_T_C > 20 ? COLORS.danger : COLORS.warn;
  const cableColor = sim.cable.danger_10pct ? COLORS.danger : sim.cable.warning_5pct ? COLORS.warn : COLORS.ok;
  const thdColor   = sim.thd.complies_ieee519 ? COLORS.ok : COLORS.danger;

  return (
    <div style={{ display: "flex", gap: 20 }}>
      {/* ── Controls ── */}
      <div style={{ width: 230, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Cable group */}
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>CABLE</div>

          <Param label="Calibre AWG" hint="Menor número = más grueso">
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {AWG_OPTIONS.map(a => (
                <button key={a} onClick={() => setAwg(a)} style={{
                  padding: "3px 7px", fontSize: 10, borderRadius: 4,
                  background: awg === a ? ACCENT + "22" : "transparent",
                  border: `1px solid ${awg === a ? ACCENT : COLORS.border}`,
                  color: awg === a ? ACCENT : COLORS.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>#{a}</button>
              ))}
            </div>
          </Param>

          <Param label="Profundidad (ft)" hint="= longitud del cable">
            <input type="range" min={1000} max={14000} step={100} value={depth_ft} onChange={e => setDepth(+e.target.value)}
              style={{ accentColor: ACCENT, width: "100%" }} />
            <div style={{ fontSize: 11, color: ACCENT, fontFamily: "JetBrains Mono, monospace" }}>{depth_ft.toLocaleString()} ft</div>
          </Param>

          <Param label="Corriente motor (A)" hint="Corriente nominal de operación">
            <input type="range" min={20} max={200} step={5} value={I_amps} onChange={e => setI(+e.target.value)}
              style={{ accentColor: ACCENT, width: "100%" }} />
            <div style={{ fontSize: 11, color: ACCENT, fontFamily: "JetBrains Mono, monospace" }}>{I_amps} A</div>
          </Param>
        </div>

        {/* Thermal group */}
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 9, color: "#FB923C", letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>TEMPERATURA</div>

          <Param label="T° fondo del pozo (°C)" hint="Afecta resistencia cable y Arrhenius">
            <input type="range" min={60} max={220} step={5} value={T_bot} onChange={e => setTBot(+e.target.value)}
              style={{ accentColor: "#FB923C", width: "100%" }} />
            <div style={{ fontSize: 11, color: "#FB923C", fontFamily: "JetBrains Mono, monospace" }}>{T_bot}°C</div>
          </Param>

          <Param label="Clase de aislamiento" hint="T° nominal máxima del aislamiento">
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {INSULATION_CLASSES.map(c => (
                <button key={c.T} onClick={() => setTRated(c.T)} style={{
                  padding: "4px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: T_rated === c.T ? "#FB923C22" : "transparent",
                  border: `1px solid ${T_rated === c.T ? "#FB923C" : COLORS.border}`,
                  color: T_rated === c.T ? "#FB923C" : COLORS.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>{c.label}</button>
              ))}
            </div>
          </Param>
        </div>

        {/* VSD group */}
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 9, color: "#A78BFA", letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>VSD / THD</div>
          <Param label="Topología VSD" hint="IEEE 519-2014: THD < 5%">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {VSD_TOPOLOGIES.map(t => (
                <button key={t.key} onClick={() => setTopo(t.key)} style={{
                  padding: "5px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: topo === t.key ? "#A78BFA22" : "transparent",
                  border: `1px solid ${topo === t.key ? "#A78BFA" : COLORS.border}`,
                  color: topo === t.key ? "#A78BFA" : COLORS.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>{t.label} — {VSD_THD[t.key].THD_pct}% THD</button>
              ))}
            </div>
          </Param>
        </div>

        {/* NACE group */}
        <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 9, color: COLORS.warn, letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>MATERIALES</div>
          {[
            { key: "h2s", label: "H₂S presente (gas amargo)", val: h2s, set: setH2S },
            { key: "solv", label: "Inyección de solventes", val: solvent, set: setSolvent },
          ].map(({ key, label, val, set }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 10, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: COLORS.warn, width: 14, height: 14 }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          {[
            { label: "Caída voltaje", value: sim.cable.V_drop_V.toFixed(0), unit: "V", color: cableColor },
            { label: "% Caída", value: sim.cable.pct_drop.toFixed(1), unit: "%", color: cableColor },
            { label: "Vida aislamiento", value: sim.arrh.pct_life_remaining.toFixed(0), unit: "%", color: arrhColor },
            { label: "THD estimado", value: sim.thd.THD_pct, unit: "%", color: thdColor },
          ].map((m, i) => (
            <div key={i} style={{ background: COLORS.surface, border: `1px solid ${m.color}30`, borderRadius: 8, padding: "12px 16px" }}>
              <Metric {...m} size={22} />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* AWG sensitivity */}
          <div style={{ background: COLORS.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>
              Caída de voltaje por calibre AWG (prof. {depth_ft.toLocaleString()} ft · I={I_amps} A)
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sim.awgChart} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }} />
                <YAxis tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, "V_drop"]} />
                <ReferenceLine y={5}  stroke={COLORS.warn}   strokeDasharray="4 2" label={{ value: "5%", fill: COLORS.warn, fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
                <ReferenceLine y={10} stroke={COLORS.danger} strokeDasharray="4 2" label={{ value: "10%", fill: COLORS.danger, fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
                <Bar dataKey="pct" radius={[3, 3, 0, 0]}>
                  {sim.awgChart.map((d, i) => (
                    <Cell key={i} fill={d.awg === awg ? ACCENT : d.pct > 10 ? COLORS.danger : d.pct > 5 ? COLORS.warn : COLORS.ok} fillOpacity={d.awg === awg ? 1 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* THD comparison */}
          <div style={{ background: COLORS.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>
              THD por topología VSD — IEEE 519: límite 5%
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sim.thdChart} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }} />
                <YAxis tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, "THD"]} />
                <ReferenceLine y={IEEE519_LIMIT} stroke={COLORS.ok} strokeDasharray="4 2"
                  label={{ value: "IEEE 519 (5%)", fill: COLORS.ok, fontSize: 8, fontFamily: "JetBrains Mono, monospace", position: "right" }} />
                <Bar dataKey="THD" radius={[3, 3, 0, 0]}>
                  {sim.thdChart.map((d, i) => (
                    <Cell key={i} fill={d.key === topo ? "#A78BFA" : d.THD < IEEE519_LIMIT ? COLORS.ok : COLORS.danger} fillOpacity={d.key === topo ? 1 : 0.45} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Arrhenius curve */}
        <div style={{ background: COLORS.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>
            Curva de Arrhenius — Vida del aislamiento vs. exceso de temperatura (ΔT = T_op − T_límite)
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={sim.arrhCurve} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
              <XAxis dataKey="dT" tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}
                label={{ value: "ΔT [°C]", position: "insideBottomRight", offset: -5, fill: COLORS.muted, fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9, fill: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}
                domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, "Vida útil"]} labelFormatter={v => `ΔT = ${v}°C`} />
              <ReferenceLine x={Math.max(0, Math.round(sim.arrh.delta_T_C))} stroke={arrhColor} strokeWidth={2}
                label={{ value: `T_op actual (ΔT=${Math.max(0, sim.arrh.delta_T_C.toFixed(0))}°C)`, fill: arrhColor, fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
              <Line type="monotone" dataKey="life" stroke="#FB923C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* NACE materials + Alerts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 16, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 10, color: COLORS.warn, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 10 }}>
              NACE MR0175 — Materiales Recomendados
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Elastómero", value: sim.nace.elastomer_recommendation },
                { label: "Cubierta cable", value: sim.nace.cable_jacket },
                { label: "Normas", value: (sim.nace.applicable_standards ?? ["API RP 11S6 / NACE MR0175"]).join(", ") },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: sim.nace.compliant ? COLORS.text : COLORS.warn, fontFamily: "JetBrains Mono, monospace" }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sim.alerts.slice(0, 4).map((a, i) => <Alert key={i} {...a} />)}
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
    title: "Paso 1 — Diagnóstico inicial",
    context: "Pozo Flamingo-4: motor BES a 6500 ft. Cable AWG #8, corriente 95 A, T_fondo 175°C. El supervisor reporta arranques fallidos y voltaje bajo en el motor.",
    task: "Calculá la caída de voltaje y determiná si el cable es la causa.",
    hint: "AWG #8 tiene R ≈ 0.628 Ω/1000ft. V_drop = I × R_T × 3. Con 95 A a 6500 ft, esperá > 10%.",
    preset: { awg: 8, depth_ft: 6500, I_amps: 95, T_bot: 175, T_rated: 180, topo: "standard_6pulse", h2s: false, solvent: false },
    conclusion: "Con AWG #8 a 6500 ft y 95 A: V_drop ≈ 17.8% del nominal. El cable es la causa principal del bajo voltaje en el motor.",
  },
  {
    id: 2,
    title: "Paso 2 — Upgrade de cable y verificación Arrhenius",
    context: "Se decide cambiar a AWG #4 (mayor diámetro, menor resistencia). Además, el técnico nota que T_fondo = 175°C con aislamiento clase H (límite 180°C).",
    task: "Confirmá que el upgrade de cable resuelve la caída de voltaje. Evaluá el margen térmico del aislamiento.",
    hint: "AWG #4: R ≈ 0.249 Ω/1000ft. Para Arrhenius: ΔT = 175 − 180 = −5°C (dentro del límite).",
    preset: { awg: 4, depth_ft: 6500, I_amps: 95, T_bot: 175, T_rated: 180, topo: "standard_6pulse", h2s: false, solvent: false },
    conclusion: "AWG #4 reduce la caída a ≈ 7% (advertencia, pero operativo). El aislamiento clase H tiene ΔT = −5°C (dentro del límite — sin degradación Arrhenius).",
  },
  {
    id: 3,
    title: "Paso 3 — Cumplimiento IEEE 519 y condición de H₂S",
    context: "El laboratorio confirma H₂S = 50 ppm en el gas producido. El VSD de 6 pulsos estándar actual no cumple IEEE 519. La empresa eléctrica notifica incumplimiento.",
    task: "Seleccioná la topología VSD mínima para cumplir IEEE 519-2014 y definí los materiales correctos por NACE MR0175.",
    hint: "IEEE 519: THD < 5%. Solo 18P, AFE o filtro activo cumplen. NACE con H₂S requiere Lead Sheath.",
    preset: { awg: 4, depth_ft: 6500, I_amps: 95, T_bot: 175, T_rated: 180, topo: "18pulse", h2s: true, solvent: false },
    conclusion: "VSD 18 pulsos → THD ≈ 4% ✅ (cumple IEEE 519). NACE MR0175 requiere Lead Sheath + Monel 400 en presencia de H₂S.",
  },
];

function TabCaso({ onSetSim }) {
  const [step, setStep] = useState(0);
  const s = CASO_STEPS[step];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Steps nav */}
      <div style={{ display: "flex", gap: 8 }}>
        {CASO_STEPS.map((c, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 10, cursor: "pointer",
            background: step === i ? ACCENT + "22" : "transparent",
            border: `1px solid ${step === i ? ACCENT : COLORS.border}`,
            color: step === i ? ACCENT : COLORS.muted,
            fontFamily: "JetBrains Mono, monospace",
          }}>Paso {i + 1}</button>
        ))}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>POZO FLAMINGO-4 · Caso integrador M4</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: scenario */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: COLORS.surface, borderRadius: 8, padding: 18, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>{s.title}</div>
            <div style={{ fontSize: 10, color: COLORS.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7, marginBottom: 12 }}>{s.context}</div>
            <div style={{ background: ACCENT + "10", border: `1px solid ${ACCENT}30`, borderRadius: 6, padding: "10px 14px", fontSize: 10, color: ACCENT, fontFamily: "JetBrains Mono, monospace" }}>
              📋 {s.task}
            </div>
          </div>
          <div style={{ background: "#0D1424", borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 6 }}>PARÁMETROS DEL CASO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {Object.entries(s.preset).map(([k, v]) => (
                <div key={k} style={{ fontSize: 9, color: COLORS.text, fontFamily: "JetBrains Mono, monospace" }}>
                  <span style={{ color: COLORS.muted }}>{k}: </span>{String(v)}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: COLORS.ok + "08", border: `1px solid ${COLORS.ok}30`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 9, color: COLORS.ok, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 6 }}>CONCLUSIÓN</div>
            <div style={{ fontSize: 10, color: COLORS.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>{s.conclusion}</div>
          </div>
        </div>

        {/* Right: live results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 2 }}>RESULTADOS DEL CASO</div>
          {(() => {
            const p = s.preset;
            const cable  = cableVoltageDrop(p.awg, p.depth_ft, p.I_amps, p.T_bot);
            const arrh   = arrheniusLifeFactor(p.T_bot, p.T_rated);
            const thd    = thdEstimate(p.topo);
            const nace   = materialRecommendation(p.T_bot, p.h2s, p.solvent);
            const cCol   = cable.danger_10pct ? COLORS.danger : cable.warning_5pct ? COLORS.warn : COLORS.ok;
            const aCol   = !arrh.warning ? COLORS.ok : arrh.delta_T_C > 20 ? COLORS.danger : COLORS.warn;
            const tCol   = thd.complies_ieee519 ? COLORS.ok : COLORS.danger;
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}` }}>
                  <Metric label="Caída de voltaje" value={cable.pct_drop.toFixed(1)} unit="%" color={cCol} />
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar pct={cable.pct_drop} label="% Caída vs. 1000V" color={cCol} max={20} />
                  </div>
                </div>
                <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}` }}>
                  <Metric label="Vida aislamiento" value={arrh.pct_life_remaining.toFixed(0)} unit="%" color={aCol} />
                  <div style={{ marginTop: 6 }}>
                    <ProgressBar pct={arrh.pct_life_remaining} label="% vida útil relativa" color={aCol} max={100} />
                  </div>
                </div>
                <div style={{ background: COLORS.surface, borderRadius: 8, padding: 14, border: `1px solid ${COLORS.border}` }}>
                  <Metric label="THD" value={thd.THD_pct} unit="%" color={tCol} />
                  <div style={{ fontSize: 10, color: tCol, fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>
                    {thd.complies_ieee519 ? "✅ Cumple IEEE 519-2014" : "❌ No cumple IEEE 519-2014"}
                  </div>
                </div>
                {nace.warnings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {nace.warnings.map((w, i) => <Alert key={i} type="warn" msg={w} />)}
                  </div>
                )}
                {!arrh.warning && cable.pct_drop <= 10 && thd.complies_ieee519 && nace.warnings.length === 0 && (
                  <Alert type="ok" msg="Sistema eléctrico en parámetros óptimos." />
                )}
              </div>
            );
          })()}
          <div style={{ background: "#0D1424", borderRadius: 6, padding: 12, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>💡 PISTA</div>
            <div style={{ fontSize: 10, color: COLORS.text, fontFamily: "JetBrains Mono, monospace", marginTop: 4, lineHeight: 1.6 }}>{s.hint}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
          padding: "8px 20px", borderRadius: 6, border: `1px solid ${COLORS.border}`,
          background: "transparent", color: COLORS.muted, cursor: step === 0 ? "not-allowed" : "pointer",
          fontSize: 10, fontFamily: "JetBrains Mono, monospace",
        }}>← Anterior</button>
        <button onClick={() => setStep(s => Math.min(CASO_STEPS.length - 1, s + 1))} disabled={step === CASO_STEPS.length - 1} style={{
          padding: "8px 20px", borderRadius: 6, border: `1px solid ${ACCENT}`,
          background: ACCENT + "22", color: ACCENT, cursor: step === CASO_STEPS.length - 1 ? "not-allowed" : "pointer",
          fontSize: 10, fontFamily: "JetBrains Mono, monospace",
        }}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── Tab D: Evaluación ───────────────────────────────────────────────────────
function TabEvaluacion() {
  const [answers,  setAnswers]  = useState({});
  const [result,   setResult]   = useState(null);

  const select = (qId, optId) => {
    if (result) return;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  };

  const submit = () => {
    const arr = M4_QUESTIONS.map(q => ({ id: q.id, selected: answers[q.id] || "" }));
    setResult(gradeM4(arr));
  };

  const reset = () => { setAnswers({}); setResult(null); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {result && (
        <div style={{
          background: result.pct >= 80 ? COLORS.ok + "12" : result.pct >= 60 ? COLORS.warn + "12" : COLORS.danger + "12",
          border: `1px solid ${result.pct >= 80 ? COLORS.ok : result.pct >= 60 ? COLORS.warn : COLORS.danger}40`,
          borderRadius: 8, padding: "14px 20px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: result.pct >= 80 ? COLORS.ok : result.pct >= 60 ? COLORS.warn : COLORS.danger, fontFamily: "JetBrains Mono, monospace" }}>
              {result.score}/{result.total} — {result.pct}%
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: "JetBrains Mono, monospace" }}>
              {result.pct >= 80 ? "Excelente comprensión del módulo eléctrico." : result.pct >= 60 ? "Buena base. Revisá los conceptos de cable y Arrhenius." : "Revisá los conceptos de cable, Arrhenius y THD."}
            </div>
          </div>
          <button onClick={reset} style={{
            padding: "8px 16px", borderRadius: 6, border: `1px solid ${ACCENT}`, background: ACCENT + "22",
            color: ACCENT, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace",
          }}>Reintentar</button>
        </div>
      )}

      {M4_QUESTIONS.map((q, qi) => {
        const res = result?.results.find(r => r.id === q.id);
        return (
          <div key={q.id} style={{ background: COLORS.surface, borderRadius: 8, padding: 18, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, color: COLORS.text, fontFamily: "JetBrains Mono, monospace", marginBottom: 12, lineHeight: 1.6 }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>{qi + 1}. </span>{q.text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.id;
                const isCorrect = res && opt.id === q.correct;
                const isWrong   = res && selected && !isCorrect;
                const color = isCorrect ? COLORS.ok : isWrong ? COLORS.danger : selected ? ACCENT : COLORS.border;
                return (
                  <button key={opt.id} onClick={() => select(q.id, opt.id)} style={{
                    textAlign: "left", padding: "8px 12px", borderRadius: 6,
                    background: selected ? color + "12" : "transparent",
                    border: `1px solid ${color}`,
                    color: selected ? color : COLORS.muted,
                    cursor: result ? "default" : "pointer",
                    fontSize: 10, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5,
                  }}>
                    <span style={{ fontWeight: 700 }}>{opt.id.toUpperCase()})</span> {opt.text}
                  </button>
                );
              })}
            </div>
            {res && (
              <div style={{ marginTop: 10, background: COLORS.ok + "08", border: `1px solid ${COLORS.ok}25`, borderRadius: 6, padding: "10px 14px", fontSize: 10, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
                💡 {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!result && (
        <button
          onClick={submit}
          disabled={Object.keys(answers).length < M4_QUESTIONS.length}
          style={{
            padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
            border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT,
            cursor: Object.keys(answers).length < M4_QUESTIONS.length ? "not-allowed" : "pointer",
            opacity: Object.keys(answers).length < M4_QUESTIONS.length ? 0.5 : 1,
            fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
          }}
        >
          CALIFICAR ({Object.keys(answers).length}/{M4_QUESTIONS.length} respondidas)
        </button>
      )}
    </div>
  );
}

// ─── Root Module4 ────────────────────────────────────────────────────────────
const TABS = [
  { id: "teoria",   label: "A — Teoría" },
  { id: "sim",      label: "B — Simulador" },
  { id: "caso",     label: "C — Caso Práctico" },
  { id: "eval",     label: "D — Evaluación" },
];

export default function Module4({ onBack }) {
  const [tab, setTab] = useState("teoria");

  return (
    <div style={{
      fontFamily: C.font,
      background: COLORS.bg,
      minHeight: "100vh",
      color: COLORS.text,
      padding: "24px 32px 48px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{
          background: "transparent", border: `1px solid ${COLORS.border}`,
          borderRadius: 6, padding: "5px 12px", color: COLORS.muted,
          cursor: "pointer", fontSize: 10, fontFamily: C.fontUI,
        }}>← Hub</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: ACCENT, fontWeight: 800, fontFamily: C.font }}>M04</span>
            <span style={{ fontSize: 21, fontWeight: 800, color: "#F1F5F9", fontFamily: C.fontUI }}>Eléctrico y VSD</span>
          </div>
          <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1, fontFamily: C.fontUI }}>
            Cable · THD · Arrhenius · NACE MR0175 / ISO 15156
          </div>
        </div>
        <span style={{
          fontSize: 9, color: COLORS.ok, background: COLORS.ok + "18",
          padding: "2px 10px", borderRadius: 10, border: `1px solid ${COLORS.ok}30`,
          fontFamily: C.fontUI,
        }}>✅ Disponible</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0, position: "sticky", top: 40, zIndex: 100, background: "#0B0F1A", paddingTop: 8 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", border: "none", borderRadius: "6px 6px 0 0",
            background: tab === t.id ? ACCENT + "18" : "transparent",
            borderBottom: tab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
            color: tab === t.id ? ACCENT : COLORS.muted,
            cursor: "pointer", fontSize: 10, fontFamily: C.fontUI,
            fontWeight: tab === t.id ? 700 : 400, letterSpacing: 0.5,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      {tab === "teoria" && <TabTeoria />}
      {tab === "sim"    && <TabSimulador />}
      {tab === "caso"   && <TabCaso />}
      {tab === "eval"   && <TabEvaluacion />}
    </div>
  );
}
