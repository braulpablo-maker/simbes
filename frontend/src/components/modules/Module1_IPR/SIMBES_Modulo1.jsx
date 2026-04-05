import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ReferenceLine, ResponsiveContainer
} from "recharts";
import { M1_EVALUATION, gradeM1 } from "../../../pedagogy/evaluations/m1.js";
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M1 } from './teoria-data';
import { C } from '../../../theme';
import ModuleLayout from '../../ui/ModuleLayout';
import { colebrookWhite, reynoldsNumber } from '../../../physics/hydraulics';
import { Slider } from '../../ui';

// ═══════════════════════════════════════════════════════
//  UNIT CONVERSIONS  (physics engine runs in STB/d + ft)
// ═══════════════════════════════════════════════════════
const M3D_PER_STB = 0.158987;   // 1 STB ≈ 0.159 m³
const FT_PER_M    = 3.28084;    // 1 m   ≈ 3.281 ft

// ═══════════════════════════════════════════════════════
//  PHYSICS ENGINE  (pure functions, no side effects)
// ═══════════════════════════════════════════════════════

// AOF: Absolute Open Flow (max rate at Pwf = 0)
// @ref Vogel 1968 + Darcy composite
function calcAOF(Pr, Pb, IP) {
  const qb = IP * Math.max(Pr - Pb, 0);
  return qb + (IP * Pb) / 1.8;
}

// IPR forward: given Pwf → Q  (Darcy above Pb, Vogel below)
// @ref Darcy 1856, Vogel SPE-1476 1968
function iprPwfToQ(Pwf, Pr, Pb, IP) {
  const qb = IP * Math.max(Pr - Pb, 0);
  if (Pwf >= Pb) return Math.max(0, IP * (Pr - Pwf));
  const qVogelMax = (IP * Pb) / 1.8;
  const vogel = 1 - 0.2 * (Pwf / Pb) - 0.8 * Math.pow(Pwf / Pb, 2);
  return qb + qVogelMax * Math.max(0, vogel);
}

// IPR inverse: given Q → Pwf
function iprQtoPwf(Q, Pr, Pb, IP) {
  const qb = IP * Math.max(Pr - Pb, 0);
  if (Q <= qb) return Pr - Q / IP;
  const qVogelMax = (IP * Pb) / 1.8;
  const f   = Math.min(1, (Q - qb) / qVogelMax);
  const disc = 0.04 + 3.2 * (1 - f);
  if (disc < 0) return 0;
  return Math.max(0, ((-0.2 + Math.sqrt(disc)) / 1.6) * Pb);
}

// Pump H-Q: representative multistage ESP at reference conditions (60 Hz)
// [SIMPLIFIED: generic curve, H0=8500 ft, Qmax=4200 STB/d — no specific manufacturer]
function pumpHeadFt(Q, freq, H0 = 8500, Qmax = 4200) {
  const ratio = freq / 60;
  const Qref  = Q / ratio;
  const Href  = H0 * Math.max(0, 1 - Math.pow(Qref / Qmax, 1.85));
  return Href * ratio * ratio;
}

// VLP: minimum Pwf to sustain rate Q
// Fricción: Darcy-Weisbach + Colebrook-White
// [SIMPLIFIED: viscosidad = 1 cP (crude ligero), D = 2.992" (3.5" tubing)]
// @ref Darcy-Weisbach (1845), Colebrook & White (1937)
function vlpPwf(Q, depth, Pwh, freq, grad, D_in = 2.992) {
  const staticPsi = grad * depth;
  const pumpPsi   = pumpHeadFt(Q, freq) * grad;

  const Q_m3d   = Q * M3D_PER_STB;
  const depth_m = depth / FT_PER_M;
  const rho_kgL = grad / 0.4335;
  const Re      = reynoldsNumber(Q_m3d, D_in, rho_kgL, 1.0);
  const D_m     = D_in * 0.0254;
  const f       = colebrookWhite(Re, D_m);
  const A_m2    = Math.PI * D_m * D_m / 4;
  const v_ms    = Q_m3d > 0 ? (Q_m3d / 86400) / A_m2 : 0;
  const h_f_m   = f * (depth_m / D_m) * (v_ms * v_ms) / (2 * 9.81);
  const frictionPsi = (h_f_m * FT_PER_M) * grad;

  return Math.max(0, Pwh + staticPsi - pumpPsi + frictionPsi);
}

// Operating point: IPR ∩ VLP  (bisection scan, 2000 steps)
function findOpPoint(Pr, Pb, IP, depth, Pwh, freq, grad) {
  const aof   = calcAOF(Pr, Pb, IP);
  const maxQ  = aof * 1.2;
  const steps = 2000;
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const Q    = (maxQ * i) / steps;
    const diff = iprQtoPwf(Q, Pr, Pb, IP) - vlpPwf(Q, depth, Pwh, freq, grad);
    if (prev !== null && prev.diff * diff < 0) {
      const t    = prev.diff / (prev.diff - diff);
      const Qop  = prev.Q + t * (Q - prev.Q);
      const Pwfop = (iprQtoPwf(Qop, Pr, Pb, IP) + vlpPwf(Qop, depth, Pwh, freq, grad)) / 2;
      return { Q: Math.round(Qop), Pwf: Math.round(Pwfop) };
    }
    prev = { Q, diff };
  }
  return null;
}

// BEP linear approximation with frequency
// [SIMPLIFIED: BEP ∝ f — valid ±5% for pedagogical purposes]
function bepQ(freq) { return 2100 * (freq / 60); }

// ── Compute simulation results for given inputs ──────────
function computeSim(Pr, safePb, safeIP_m3dpsi, depth_m, Pwh, freq, densidad, GOR = 0) {
  const depth_ft = depth_m * FT_PER_M;
  const IP_stbd  = safeIP_m3dpsi / M3D_PER_STB;
  // [SIMPLIFIED: gas correction to VLP gradient — avg GVF in tubing proportional to GOR]
  // Lighter mixture (gas+liquid) in tubing → lower hydrostatic head → lower Pwf required → VLP shifts DOWN
  // At GOR=250 m³/m³ → f_gas≈10% → grad reduces 10% → VLP curve drops, Q_op increases
  const f_gas = Math.min(GOR * 0.0004, 0.30);
  const grad  = densidad * 0.4335 * (1 - f_gas);
  const aof_stbd = calcAOF(Pr, safePb, IP_stbd);
  const aof      = aof_stbd * M3D_PER_STB;
  const qb       = IP_stbd * Math.max(Pr - safePb, 0) * M3D_PER_STB;
  const maxQ_stbd = aof_stbd * 1.18;
  const N = 150;
  const data = [];
  for (let i = 0; i <= N; i++) {
    const Q_stbd = (maxQ_stbd * i) / N;
    data.push({
      Q:   parseFloat((Q_stbd * M3D_PER_STB).toFixed(1)),
      IPR: Math.max(0, iprQtoPwf(Q_stbd, Pr, safePb, IP_stbd)),
      VLP: Math.round(vlpPwf(Q_stbd, depth_ft, Pwh, freq, grad)),
    });
  }
  const opRaw   = findOpPoint(Pr, safePb, IP_stbd, depth_ft, Pwh, freq, grad);
  const opPoint = opRaw
    ? { Q: parseFloat((opRaw.Q * M3D_PER_STB).toFixed(1)), Pwf: Math.round(opRaw.Pwf) }
    : null;
  const alerts = [];
  if (!opPoint) {
    alerts.push({ type: "danger", msg: "Sin punto de operación. La bomba no puede vencer el TDH requerido. Aumenta la frecuencia del VSD o reduce la profundidad." });
  } else {
    const dd      = (Pr - opPoint.Pwf) / Pr;
    const bep_m3d = bepQ(freq) * M3D_PER_STB;
    const r       = opPoint.Q / bep_m3d;
    if (opPoint.Pwf < safePb * 0.25)
      alerts.push({ type: "warning", msg: `Pwf (${opPoint.Pwf.toLocaleString()} psi) muy inferior a Pb. Alta liberación de gas libre → evaluar separador AGS.` });
    if (dd > 0.82)
      alerts.push({ type: "danger", msg: `Drawdown ${Math.round(dd*100)}% — riesgo de producción de arena y colapso de formación.` });
    if (r < 0.68)
      alerts.push({ type: "warning", msg: `Operando al ${Math.round(r*100)}% del BEP (${bep_m3d.toFixed(1)} m³/d) → recirculación interna y sobrecalentamiento.` });
    if (r > 1.32)
      alerts.push({ type: "warning", msg: `Operando al ${Math.round(r*100)}% del BEP → surging (cavitación). Reduce frecuencia o abre choke.` });
    if (alerts.length === 0)
      alerts.push({ type: "ok", msg: `Sistema en rango óptimo. Q = ${Math.round(r*100)}% del BEP (${bep_m3d.toFixed(1)} m³/d) · Drawdown ${Math.round(dd*100)}%.` });
  }
  return { chartData: data, aof, qb, opPoint, alerts, bep_m3d: bepQ(freq) * M3D_PER_STB };
}

// ═══════════════════════════════════════════════════════
//  UI ATOMS
// ═══════════════════════════════════════════════════════

function ControlGroup({ title, accent, children }) {
  return (
    <div style={{ background: "#334155", borderRadius: 10, border: `1px solid ${accent}33`, padding: "14px 16px" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: accent, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{children}</div>
    </div>
  );
}


function Metric({ label, value, unit, color = "#E2E8F0", glow }) {
  return (
    <div style={{ background: "#334155", borderRadius: 8, border: `1px solid ${glow ? color + "55" : "#334155"}`, padding: "10px 12px", flex: 1 }}>
      <div style={{ fontSize: 9, color: "#94A3B8", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, textShadow: glow ? `0 0 12px ${color}88` : "none", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{unit}</div>
    </div>
  );
}

function Alert({ type, msg }) {
  const cfg = { ok: { border: "#22C55E", text: "#4ADE80", dot: "#22C55E" }, warning: { border: "#F59E0B", text: "#FCD34D", dot: "#F59E0B" }, danger: { border: "#EF4444", text: "#FCA5A5", dot: "#EF4444" } };
  const c = cfg[type];
  return (
    <div style={{ border: `1px solid ${c.border}33`, borderLeft: `3px solid ${c.border}`, background: "#0F172A", borderRadius: "0 6px 6px 0", padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 9 }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, marginTop: 4, flexShrink: 0, boxShadow: `0 0 8px ${c.dot}` }} />
      <span style={{ fontSize: 11, color: c.text, lineHeight: 1.6 }}>{msg}</span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1C2333", border: "1px solid #2D3748", borderRadius: 6, padding: "10px 14px", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ color: "#718096", marginBottom: 6 }}>Q = {Number(label).toFixed(1)} m³/d</div>
      {payload.map(p => p.value != null && (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{Math.round(p.value).toLocaleString()} psi</strong>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
//  TAB BAR
// ═══════════════════════════════════════════════════════
const TABS = [
  { id: "teoria",    label: "A — Teoría" },
  { id: "simulador", label: "B — Simulador" },
  { id: "caso",      label: "C — Caso Práctico" },
  { id: "evaluacion",label: "D — Evaluación" },
];

// ═══════════════════════════════════════════════════════
//  NODAL CHART (reusable)
// ═══════════════════════════════════════════════════════
function NodalChart({ chartData, opPoint, safePb, bep_m3d, Pr }) {
  return (
    <div style={{ background: "#162032", border: "1px solid #334155", borderRadius: 10, padding: "18px 16px 14px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>GRÁFICA NODAL · IPR vs. VLP</span>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["#38BDF8","IPR (Yacimiento)"],["#34D399","VLP (Bomba)"],["#FBBF24","Presión de Burbuja Pb"],["#FB7185","Punto de Operación"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, height: 2, background: color, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "#94A3B8" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 4, right: 30, bottom: 28, left: 24 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#334155" />
          <XAxis dataKey="Q" type="number" domain={[0, "dataMax"]}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Number(v).toFixed(0)}
            label={{ value: "Caudal Q (m³/d)", position: "insideBottom", offset: -16, fill: "#475569", fontSize: 11 }}
          />
          <YAxis domain={[0, Math.ceil(Pr * 1.08 / 500) * 500]}
            tick={{ fill: "#475569", fontSize: 10 }}
            tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            label={{ value: "Pwf (psi)", angle: -90, position: "insideLeft", offset: 14, fill: "#475569", fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={safePb} stroke="#FBBF24" strokeDasharray="8 4" strokeWidth={1.5}
            label={{ value: `Pb = ${safePb.toLocaleString()} psi`, fill: "#FBBF24", fontSize: 9, position: "insideTopRight" }}
          />
          {opPoint && (
            <ReferenceLine x={bep_m3d} stroke="#F472B6" strokeDasharray="4 4" strokeWidth={1}
              label={{ value: "BEP", fill: "#F472B6", fontSize: 9, position: "insideTopLeft" }}
            />
          )}
          <Line dataKey="IPR" stroke="#38BDF8" strokeWidth={2.5} dot={false} name="IPR" connectNulls={false} activeDot={{ r: 4, fill: "#38BDF8" }} />
          <Line dataKey="VLP" stroke="#34D399" strokeWidth={2.5} dot={false} name="VLP" strokeDasharray="10 4" activeDot={{ r: 4, fill: "#34D399" }} />
          {opPoint && (
            <ReferenceDot x={opPoint.Q} y={opPoint.Pwf} r={8} fill="#FB7185" stroke="#0F172A" strokeWidth={2}
              label={{ value: `(${opPoint.Q} m³/d, ${opPoint.Pwf.toLocaleString()} psi)`, fill: "#FB7185", fontSize: 10, position: "right", offset: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  TAB A — TEORÍA
// ═══════════════════════════════════════════════════════
function TabTeoria() {
  return <TheoryLayout sections={TEORIA_M1} accentColor="#38BDF8" />;
}

// ═══════════════════════════════════════════════════════
//  TAB B — SIMULADOR (with tooltips)
// ═══════════════════════════════════════════════════════
function TabSimulador({ Pr, setPr, Pb, setPb, IP, setIP, depth, setDepth, Pwh, setPwh, densidad, setDensidad, freq, setFreq, BSW, setBSW, GOR, setGOR, onReset }) {
  const safePb = Math.min(Pb, Pr - 50);
  const safeIP = Math.max(0.02, IP);

  // [SIMPLIFIED: ρ_mix = BSW-weighted average of oil and saline water densities]
  // ρ_agua ≈ 1.074 kg/L (saline water at reservoir conditions, average)
  const RHO_AGUA = 1.074;
  const densidadEfectiva = (1 - BSW / 100) * densidad + (BSW / 100) * RHO_AGUA;

  const { chartData, aof, qb, opPoint, alerts, bep_m3d } = useMemo(
    () => computeSim(Pr, safePb, safeIP, depth, Pwh, freq, densidadEfectiva, GOR),
    [Pr, safePb, safeIP, depth, Pwh, freq, densidadEfectiva, GOR]
  );
  const dd = opPoint ? Math.round((Pr - opPoint.Pwf) / Pr * 100) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onReset} style={{ background: "transparent", border: "1px solid #1E293B", borderRadius: 5, color: "#64748B", fontSize: 9, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", letterSpacing: 1 }}>↺ Restablecer</button>
        </div>
        <ControlGroup title="■ Yacimiento" accent="#60A5FA">
          <Slider label="Pr — Presión Reservorio" unit="psi"
            value={Pr} min={500} max={7000} step={50} onChange={setPr} accentColor="#60A5FA"
            tooltip="Presión estática del reservorio. Campo: 500–10,000 psi. Mayor Pr = más energía disponible." />
          <Slider label="Pb — Presión de Burbuja" unit="psi"
            value={safePb} min={100} max={Pr - 50} step={50}
            onChange={v => setPb(Math.min(v, Pr - 50))} accentColor="#60A5FA"
            tooltip="Por encima de Pb: fluido monofásico (Darcy). Por debajo: gas libre (Vogel). Campo: 500–4,000 psi." />
          <Slider label="IP — Índice Productividad" unit="m³/d/psi"
            value={IP} min={0.02} max={1.60} step={0.02} dec={2}
            onChange={setIP} accentColor="#60A5FA"
            tooltip="Pendiente de la IPR. Mide la facilidad del yacimiento. BES típico: 0.05–1.5 m³/d/psi." />
        </ControlGroup>

        <ControlGroup title="■ Geometría del Pozo" accent="#34D399">
          <Slider label="Profundidad de Bomba" unit="m"
            value={depth} min={300} max={4300} step={50} onChange={setDepth} accentColor="#34D399"
            tooltip="Profundidad de la bomba BES. Campo típico: 600–3,500 m. Mayor profundidad → mayor TDH." />
          <Slider label="Pwh — Presión Cabezal" unit="psi"
            value={Pwh} min={50} max={1000} step={25} onChange={setPwh} accentColor="#34D399"
            tooltip="Contrapresión en cabeza de pozo (choke + flowline + separador). Campo: 50–500 psi." />
          <Slider label="Densidad del Petróleo" unit="kg/L"
            value={densidad} min={0.70} max={1.00} step={0.01} dec={3}
            onChange={setDensidad} accentColor="#34D399"
            tooltip="Densidad del crudo puro (sin agua). 30°API ≈ 0.876 kg/L · 20°API ≈ 0.934 kg/L. La mezcla efectiva depende del BSW." />
          <Slider label="BSW — Corte de Agua" unit="%"
            value={BSW} min={0} max={80} step={5} dec={0}
            onChange={setBSW} accentColor="#60A5FA"
            tooltip={`Basic Sediment & Water. ρ_mezcla = (1−BSW)·ρ_petróleo + BSW·1.074 kg/L → grad efectivo ≈ ${(densidadEfectiva * 0.4335).toFixed(3)} psi/ft. [SIMPLIFIED]`} />
          <Slider label="GOR — Relación Gas-Petróleo" unit="m³/m³"
            value={GOR} min={0} max={500} step={25} dec={0}
            onChange={setGOR} accentColor="#34D399"
            tooltip={`Gas-Oil Ratio en condiciones de superficie. Aligerana la columna de fluido en el tubing → VLP baja → Q_op sube. Reducción de gradiente: ${(Math.min(GOR * 0.0004, 0.30) * 100).toFixed(0)}%. [SIMPLIFIED — no modela gas lock ni degradación H-Q]`} />
        </ControlGroup>

        <ControlGroup title="■ VSD — Variador de Frecuencia" accent="#F472B6">
          <Slider label="Frecuencia" unit="Hz"
            value={freq} min={30} max={70} step={1} onChange={setFreq} accentColor="#F472B6"
            tooltip="60 Hz = velocidad nominal. Rango campo BES: 40–70 Hz. Afecta Q (lineal), H (cuadrático) y potencia (cúbico)." />
          <div style={{ fontSize: 10, color: "#475569", background: "#0F172A", padding: "8px 10px", borderRadius: 6, lineHeight: 1.8 }}>
            BEP estimado a {freq} Hz<br />
            <span style={{ color: "#F472B6" }}>≈ {bep_m3d.toFixed(1)} m³/d</span><br />
            H ref. escala × {((freq/60)**2).toFixed(2)}
          </div>
        </ControlGroup>

        {/* IPR composition */}
        <div style={{ background: "#334155", border: "1px solid #334155", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Composición IPR</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#60A5FA" }}>Zona Darcy (Q ≤ Qb)</span>
              <span style={{ color: "#E2E8F0" }}>{qb.toFixed(1)} m³/d</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#818CF8" }}>Zona Vogel (Q &gt; Qb)</span>
              <span style={{ color: "#E2E8F0" }}>{(aof - qb).toFixed(1)} m³/d</span>
            </div>
            <div style={{ borderTop: "1px solid #334155", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
              <span style={{ color: "#A5B4FC" }}>AOF Total</span>
              <span style={{ color: "#A5B4FC" }}>{aof.toFixed(1)} m³/d</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart + metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <Metric label="Q Operativo" unit="m³/d" value={opPoint ? opPoint.Q.toLocaleString() : "—"} color="#38BDF8" glow />
          <Metric label="Pwf Operativo" unit="psi" value={opPoint ? opPoint.Pwf.toLocaleString() : "—"} color="#60A5FA" />
          <Metric label="Drawdown" unit="% de Pr" value={dd !== null ? `${dd}%` : "—"} color={dd > 80 ? "#EF4444" : dd > 60 ? "#F59E0B" : "#34D399"} />
          <Metric label="AOF" unit="m³/d" value={aof.toFixed(1)} color="#94A3B8" />
          <Metric label="BEP @ VSD" unit="m³/d" value={bep_m3d.toFixed(1)} color="#F472B6" />
        </div>
        <NodalChart chartData={chartData} opPoint={opPoint} safePb={safePb} bep_m3d={bep_m3d} Pr={Pr} />
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>▶ DIAGNÓSTICO OPERATIVO</div>
          {alerts.map((a, i) => <Alert key={i} {...a} />)}
        </div>
        <div style={{ background: "#0F172A", border: "1px solid #33415533", borderLeft: "3px solid #0EA5E9", borderRadius: "0 8px 8px 0", padding: "10px 14px", fontSize: 11, color: "#94A3B8", lineHeight: 1.8 }}>
          <span style={{ color: "#38BDF8", fontWeight: 700 }}>PUNTO DE OPERACIÓN · </span>
          Intersección de la curva <span style={{ color: "#38BDF8" }}>IPR</span> y la curva <span style={{ color: "#34D399" }}>VLP</span>.
          Modifica la <span style={{ color: "#F472B6" }}>frecuencia del VSD</span> para mover el punto de operación.
          {` Petróleo: ${densidad.toFixed(3)} kg/L · BSW: ${BSW}% → ρ_mezcla: ${densidadEfectiva.toFixed(3)} kg/L · GOR: ${GOR} m³/m³ → grad_eff: ${(densidadEfectiva * 0.4335 * (1 - Math.min(GOR * 0.0004, 0.30))).toFixed(3)} psi/ft.`}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  TAB C — CASO PRÁCTICO: Pozo Colibrí-3
// ═══════════════════════════════════════════════════════
const COLIBRI = { Pr: 3200, Pb: 1600, IP: 0.30, depth: 2400, Pwh: 120, densidad: 0.876 };

const CASO_STEPS = [
  {
    title: "Paso 1 · Diagnóstico inicial (60 Hz)",
    freq: 60,
    context: "El Pozo Colibrí-3 opera a 60 Hz desde hace 6 meses. La producción objetivo del campo es 450 m³/d. El supervisor reporta que el amperímetro muestra consumo estable pero las alarmas de vibración son frecuentes.",
    question: "Con los parámetros del pozo, ¿el sistema opera dentro del rango óptimo del BEP (68%–132%)? ¿Qué explica las alarmas de vibración?",
    hint: "Identifica el % del BEP en las métricas de la gráfica y clasifica el tipo de alerta operativa.",
  },
  {
    title: "Paso 2 · Ajuste de frecuencia a 55 Hz",
    freq: 55,
    context: "El jefe de ingeniería sugiere bajar a 55 Hz para proteger la bomba. El contratista teme que la producción caiga demasiado. Se decide hacer una prueba.",
    question: "Al reducir a 55 Hz, ¿el punto de operación mejora o empeora respecto al BEP? ¿Cuánto cambia el drawdown?",
    hint: "Compara el Q operativo y el % del BEP entre 60 Hz y 55 Hz usando los valores de las métricas.",
  },
  {
    title: "Paso 3 · Optimización a 65 Hz",
    freq: 65,
    context: "Con nuevas mediciones, el equipo determina que Pr es mayor de lo estimado. Se propone subir a 65 Hz para maximizar producción sin superar el 130% del BEP.",
    question: "A 65 Hz, ¿se alcanza el objetivo de 450 m³/d? ¿El riesgo de surging aumenta o disminuye respecto a 60 Hz?",
    hint: "Compara el Q operativo con el objetivo y evalúa el % del BEP a 65 Hz.",
  },
  {
    title: "Paso 4 · Conclusión y acción correctiva",
    freq: 60,
    isConclusionStep: true,
    context: "Después de probar 60, 55 y 65 Hz, el equipo concluye que la bomba opera consistentemente por encima del 130% del BEP en todos los escenarios. El surging no es un problema de frecuencia, sino de dimensionamiento.",
    question: "¿Cuál es la acción correctiva? ¿Qué módulo usarías para calcular el nuevo equipo?",
    hint: "Piensa en la causa raíz: ¿es el BEP de la bomba actual compatible con el caudal del pozo?",
    conclusion: {
      diagnostico: "La bomba instalada tiene un BEP nominal de ~420 m³/d a 60 Hz. El pozo Colibrí-3 entrega ~514 m³/d — siempre por encima del 130% del BEP (surging). Cambiar la frecuencia no resuelve el problema de raíz.",
      accion: "Se requiere reemplazar la bomba por una con BEP ≥ 460 m³/d. Usa M02 · Diseño Hidráulico para calcular el nuevo TDH y número de etapas, y M09 · Flujo de Diseño BES para seleccionar el equipo correcto.",
    },
  },
];

function TabCaso({ step, showDiagnosis, goToStep, setShowDiagnosis }) {
  const s = CASO_STEPS[step];
  const safePb = Math.min(COLIBRI.Pb, COLIBRI.Pr - 50);
  const { chartData, opPoint, alerts, bep_m3d } = useMemo(
    () => computeSim(COLIBRI.Pr, safePb, COLIBRI.IP, COLIBRI.depth, COLIBRI.Pwh, s.freq, COLIBRI.densidad),
    [step]
  );
  const dd = opPoint ? Math.round((COLIBRI.Pr - opPoint.Pwf) / COLIBRI.Pr * 100) : null;

  return (
    <div>
      {/* Scenario header */}
      <div style={{ background: "#334155", border: "1px solid #34D39940", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>
              ESCENARIO — CAMPO OPERATIVO
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Pozo Colibrí-3</div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>
              Pr {COLIBRI.Pr.toLocaleString()} psi · Pb {COLIBRI.Pb.toLocaleString()} psi · IP {COLIBRI.IP} m³/d/psi · Prof. {COLIBRI.depth.toLocaleString()} m · Densidad {COLIBRI.densidad} kg/L
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {CASO_STEPS.map((_, i) => (
              <button key={i} onClick={() => goToStep(i)} style={{
                background: step === i ? "#34D399" : "#334155",
                border: `1px solid ${step === i ? "#34D399" : "#334155"}`,
                borderRadius: 6, color: step === i ? "#0F172A" : "#94A3B8",
                fontSize: 10, padding: "6px 14px", cursor: "pointer",
                fontFamily: "inherit", fontWeight: step === i ? 700 : 400,
              }}>Paso {i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Paso 4 — Conclusión (sin gráfica, layout especial) */}
      {s.isConclusionStep ? (
        <div>
          <div style={{ fontSize: 11, color: "#34D399", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{s.title}</div>
          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.8, margin: "0 0 14px" }}>{s.context}</p>
          <div style={{ background: "#0F172A", border: "1px solid #34D39933", borderLeft: "3px solid #34D399", borderRadius: "0 6px 6px 0", padding: "10px 12px", marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>PREGUNTA GUIADA</div>
            <p style={{ fontSize: 11, color: "#F1F5F9", lineHeight: 1.7, margin: "0 0 8px" }}>{s.question}</p>
            <p style={{ fontSize: 10, color: "#475569", margin: 0, fontStyle: "italic" }}>Pista: {s.hint}</p>
          </div>

          {!showDiagnosis ? (
            <button onClick={() => setShowDiagnosis(true)} style={{
              background: "transparent", border: "1px solid #34D399", borderRadius: 6,
              color: "#34D399", fontSize: 10, padding: "8px 18px", cursor: "pointer",
              fontFamily: "inherit", letterSpacing: 1,
            }}>▶ Revelar conclusión</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "#EF444415", border: "1px solid #EF444455", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, color: "#EF4444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>🔴 DIAGNÓSTICO</div>
                <p style={{ fontSize: 11, color: "#F1F5F9", lineHeight: 1.7, margin: 0 }}>{s.conclusion.diagnostico}</p>
              </div>
              <div style={{ background: "#34D39915", border: "1px solid #34D39955", borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>✅ ACCIÓN CORRECTIVA</div>
                <p style={{ fontSize: 11, color: "#F1F5F9", lineHeight: 1.7, margin: 0 }}>{s.conclusion.accion}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Pasos 1–3 — layout con gráfica */
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, color: "#34D399", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{s.title}</div>
            <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.8, margin: "0 0 14px" }}>{s.context}</p>
            <div style={{ background: "#0F172A", border: "1px solid #34D39933", borderLeft: "3px solid #34D399", borderRadius: "0 6px 6px 0", padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>PREGUNTA GUIADA</div>
              <p style={{ fontSize: 11, color: "#F1F5F9", lineHeight: 1.7, margin: "0 0 8px" }}>{s.question}</p>
              <p style={{ fontSize: 10, color: "#475569", margin: 0, fontStyle: "italic" }}>Pista: {s.hint}</p>
            </div>

            {/* Key metrics for this step */}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <Metric label="Frecuencia" unit="Hz" value={s.freq} color="#F472B6" />
              <Metric label="Q Operativo" unit="m³/d" value={opPoint ? opPoint.Q.toFixed(1) : "—"} color="#38BDF8" glow />
              <Metric label="Drawdown" unit="%" value={dd !== null ? `${dd}%` : "—"} color={dd > 80 ? "#EF4444" : dd > 60 ? "#F59E0B" : "#34D399"} />
            </div>

            {/* Reveal diagnosis button */}
            {!showDiagnosis ? (
              <button onClick={() => setShowDiagnosis(true)} style={{
                marginTop: 14, background: "transparent", border: "1px solid #34D399",
                borderRadius: 6, color: "#34D399", fontSize: 10, padding: "8px 18px",
                cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
              }}>▶ Revelar análisis</button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 14 }}>
                {alerts.map((a, i) => <Alert key={i} {...a} />)}
              </div>
            )}
          </div>

          <NodalChart chartData={chartData} opPoint={opPoint} safePb={safePb} bep_m3d={bep_m3d} Pr={COLIBRI.Pr} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  TAB D — EVALUACIÓN
// ═══════════════════════════════════════════════════════
function TabEvaluacion() {
  const questions = M1_EVALUATION.questions;
  const [answers,   setAnswers]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  const result = submitted ? gradeM1(answers) : null;
  const allAnswered = questions.every(q => answers[q.id]);

  function handleSelect(qId, optId) {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optId }));
  }

  function handleReset() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 9, color: "#F472B6", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>EVALUACIÓN · MÓDULO 1</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9" }}>Análisis Nodal / IPR</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>5 preguntas · 100 puntos · Mínimo aprobatorio: 70%</div>
        </div>
        {submitted && (
          <button onClick={handleReset} style={{
            background: "transparent", border: "1px solid #334155", borderRadius: 6,
            color: "#94A3B8", fontSize: 10, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
          }}>↺ Reintentar</button>
        )}
      </div>

      {/* Score banner (if submitted) */}
      {submitted && result && (
        <div style={{
          background: result.passed ? "#22C55E18" : "#EF444418",
          border: `1px solid ${result.passed ? "#22C55E44" : "#EF444444"}`,
          borderRadius: 10, padding: "16px 20px", marginBottom: 24,
          display: "flex", alignItems: "center", gap: 20,
        }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: result.passed ? "#22C55E" : "#EF4444" }}>
            {result.score_pct}%
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: result.passed ? "#4ADE80" : "#FCA5A5", marginBottom: 4 }}>
              {result.passed ? "APROBADO" : "NO APROBADO"} — {result.earned_points} / {result.total_points} puntos
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>
              {result.passed
                ? "Dominas los conceptos fundamentales del Análisis Nodal. Puedes avanzar al Módulo 2."
                : `Puntaje mínimo: ${M1_EVALUATION.passing_score}%. Revisa la teoría e intenta de nuevo.`}
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q, qi) => {
          const fb = result?.feedback.find(f => f.question_id === q.id);
          return (
            <div key={q.id} style={{
              background: "#334155", borderRadius: 10, padding: "16px 18px",
              border: `1px solid ${fb ? (fb.correct ? "#22C55E44" : "#EF444444") : "#334155"}`,
            }}>
              {/* Question */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 10, color: "#F472B6", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q{qi + 1}</span>
                <div style={{ fontSize: 12, color: "#E2E8F0", lineHeight: 1.6, fontWeight: 500 }}>{q.question}</div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 22 }}>
                {q.options.map(opt => {
                  const selected = answers[q.id] === opt.id;
                  const isCorrect = opt.id === q.correct;
                  let borderColor = "#334155";
                  let bgColor     = "#0F172A";
                  let textColor   = "#94A3B8";
                  if (selected && !submitted) { borderColor = "#F472B6"; bgColor = "#F472B618"; textColor = "#F9A8D4"; }
                  if (submitted) {
                    if (isCorrect) { borderColor = "#22C55E"; bgColor = "#22C55E18"; textColor = "#4ADE80"; }
                    else if (selected && !isCorrect) { borderColor = "#EF4444"; bgColor = "#EF444418"; textColor = "#FCA5A5"; }
                  }
                  return (
                    <div key={opt.id} onClick={() => handleSelect(q.id, opt.id)} style={{
                      background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 6,
                      padding: "8px 12px", cursor: submitted ? "default" : "pointer",
                      display: "flex", gap: 10, alignItems: "flex-start",
                      transition: "all 0.1s",
                    }}>
                      <span style={{ fontSize: 10, color: borderColor, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{opt.id.toUpperCase()}</span>
                      <span style={{ fontSize: 11, color: textColor, lineHeight: 1.5 }}>{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {/* Feedback */}
              {fb && (
                <div style={{ marginTop: 12, marginLeft: 22, background: "#0F172A", border: `1px solid ${fb.correct ? "#22C55E33" : "#EF444433"}`, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 9, color: fb.correct ? "#22C55E" : "#EF4444", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 5 }}>
                    {fb.correct ? `✓ Correcto — ${q.points} pts` : `✗ Incorrecto — 0 pts`}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.7 }}>{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <button
            disabled={!allAnswered}
            onClick={() => {
              const r = gradeM1(answers);
              try { localStorage.setItem('simbes_eval_m1', JSON.stringify({ score_pct: r.score_pct, passed: r.passed, ts: Date.now() })); } catch {}
              setSubmitted(true);
            }}
            style={{
              background: allAnswered ? "#F472B6" : "#334155",
              border: "none", borderRadius: 8,
              color: allAnswered ? "#0F172A" : "#334155",
              fontSize: 11, fontWeight: 700, padding: "10px 24px",
              cursor: allAnswered ? "pointer" : "not-allowed",
              fontFamily: "inherit", letterSpacing: 1,
              transition: "all 0.15s",
            }}
          >
            {allAnswered ? "ENVIAR EVALUACIÓN →" : `Responde ${questions.length - Object.keys(answers).length} pregunta(s) más`}
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function SIMBES_M1({ onBack }) {
  // Tab navigation
  const [activeTab,     setActiveTab]     = useState("simulador");
  const [teoriaSection, setTeoriaSection] = useState(0);

  // Caso Práctico state — lifted so switching tabs doesn't reset progress
  const [casoStep,     setCasoStep]     = useState(0);
  const [casoShowDiag, setCasoShowDiag] = useState(false);
  function casoGoToStep(i) { setCasoStep(i); setCasoShowDiag(false); }

  // Simulator state (shared between tabs B and C uses fixed COLIBRI params)
  const SIM_DEFAULTS = { Pr: 3500, Pb: 1800, IP: 0.24, depth: 2100, Pwh: 150, freq: 60, densidad: 0.876, BSW: 0, GOR: 0 };
  const [Pr,       setPr]       = useState(SIM_DEFAULTS.Pr);
  const [Pb,       setPb]       = useState(SIM_DEFAULTS.Pb);
  const [IP,       setIP]       = useState(SIM_DEFAULTS.IP);
  const [depth,    setDepth]    = useState(SIM_DEFAULTS.depth);
  const [Pwh,      setPwh]      = useState(SIM_DEFAULTS.Pwh);
  const [freq,     setFreq]     = useState(SIM_DEFAULTS.freq);
  const [densidad, setDensidad] = useState(SIM_DEFAULTS.densidad);
  const [BSW,      setBSW]      = useState(SIM_DEFAULTS.BSW);
  const [GOR,      setGOR]      = useState(SIM_DEFAULTS.GOR);
  function resetSim() {
    setPr(SIM_DEFAULTS.Pr); setPb(SIM_DEFAULTS.Pb); setIP(SIM_DEFAULTS.IP);
    setDepth(SIM_DEFAULTS.depth); setPwh(SIM_DEFAULTS.Pwh); setFreq(SIM_DEFAULTS.freq);
    setDensidad(SIM_DEFAULTS.densidad); setBSW(SIM_DEFAULTS.BSW); setGOR(SIM_DEFAULTS.GOR);
  }

  return (
    <ModuleLayout
      moduleId="M01"
      title="Análisis Nodal — IPR · VLP"
      subtitle="Curva de Afluencia (Darcy / Vogel) · Levantamiento BES · Punto de Operación"
      accentColor="#0EA5E9"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onBack={onBack}
    >
      {activeTab === "teoria" && (
        <TabTeoria section={teoriaSection} setSection={setTeoriaSection} />
      )}
      {activeTab === "simulador" && (
        <TabSimulador
          Pr={Pr} setPr={setPr} Pb={Pb} setPb={setPb}
          IP={IP} setIP={setIP} depth={depth} setDepth={setDepth}
          Pwh={Pwh} setPwh={setPwh} densidad={densidad} setDensidad={setDensidad}
          freq={freq} setFreq={setFreq}
          BSW={BSW} setBSW={setBSW}
          GOR={GOR} setGOR={setGOR}
          onReset={resetSim}
        />
      )}
      {activeTab === "caso" && <TabCaso step={casoStep} showDiagnosis={casoShowDiag} goToStep={casoGoToStep} setShowDiagnosis={setCasoShowDiag} />}
      {activeTab === "evaluacion" && <TabEvaluacion />}
    </ModuleLayout>
  );
}
