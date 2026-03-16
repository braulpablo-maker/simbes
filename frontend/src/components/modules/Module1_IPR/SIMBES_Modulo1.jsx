import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ReferenceLine, ResponsiveContainer
} from "recharts";
import { M1_EVALUATION, gradeM1 } from "../../../pedagogy/evaluations/m1.js";

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
// [SIMPLIFIED: friction = 1.4e-5 × Q² valid for 2.875"–3.5" tubing, BES ranges]
function vlpPwf(Q, depth, Pwh, freq, grad) {
  const staticPsi   = grad * depth;
  const pumpPsi     = pumpHeadFt(Q, freq) * grad;
  const frictionPsi = 1.4e-5 * Q * Q;
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
function computeSim(Pr, safePb, safeIP_m3dpsi, depth_m, Pwh, freq, densidad) {
  const depth_ft = depth_m * FT_PER_M;
  const IP_stbd  = safeIP_m3dpsi / M3D_PER_STB;
  const grad     = densidad * 0.4335;
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
    <div style={{ background: "#111827", borderRadius: 10, border: `1px solid ${accent}33`, padding: "14px 16px" }}>
      <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: accent, fontWeight: 700, marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>{children}</div>
    </div>
  );
}

function Param({ label, unit, value, min, max, step, onChange, dec = 0, color = "#60A5FA", hint }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: "#94A3B8" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#E2E8F0", fontWeight: 700 }}>
          {dec ? value.toFixed(dec) : value.toLocaleString()}
          <span style={{ fontSize: 10, color: "#64748B", marginLeft: 4 }}>{unit}</span>
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer", height: 4 }}
      />
      {hint && <div style={{ fontSize: 9, color: "#475569", marginTop: 4, lineHeight: 1.5, fontStyle: "italic" }}>{hint}</div>}
    </div>
  );
}

function Metric({ label, value, unit, color = "#E2E8F0", glow }) {
  return (
    <div style={{ background: "#111827", borderRadius: 8, border: `1px solid ${glow ? color + "55" : "#1E293B"}`, padding: "10px 12px", flex: 1 }}>
      <div style={{ fontSize: 9, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
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
    <div style={{ background: "#1C2333", border: "1px solid #2D3748", borderRadius: 6, padding: "10px 14px", fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>
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
  { id: "teoria",    label: "A · Teoría",          color: "#60A5FA" },
  { id: "simulador", label: "B · Simulador",        color: "#38BDF8" },
  { id: "caso",      label: "C · Caso Práctico",    color: "#34D399" },
  { id: "evaluacion",label: "D · Evaluación",       color: "#F472B6" },
];

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #1E293B", marginBottom: 20, position: "sticky", top: 40, zIndex: 100, background: "#0B0F1A", paddingTop: 4 }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: active === t.id ? "#111827" : "transparent",
          border: "none",
          borderBottom: active === t.id ? `2px solid ${t.color}` : "2px solid transparent",
          color: active === t.id ? t.color : "#475569",
          fontSize: 11, padding: "10px 20px",
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: 1, fontWeight: active === t.id ? 700 : 400,
          transition: "all 0.15s",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  NODAL CHART (reusable)
// ═══════════════════════════════════════════════════════
function NodalChart({ chartData, opPoint, safePb, bep_m3d, Pr }) {
  return (
    <div style={{ background: "#0D1424", border: "1px solid #1E293B", borderRadius: 10, padding: "18px 16px 14px 8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginLeft: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textTransform: "uppercase" }}>GRÁFICA NODAL · IPR vs. VLP</span>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["#38BDF8","IPR (Yacimiento)"],["#34D399","VLP (Bomba)"],["#FBBF24","Presión de Burbuja Pb"],["#FB7185","Punto de Operación"]].map(([color, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 16, height: 2, background: color, borderRadius: 1 }} />
              <span style={{ fontSize: 9, color: "#64748B" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 4, right: 30, bottom: 28, left: 24 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#1E293B" />
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
            <ReferenceDot x={opPoint.Q} y={opPoint.Pwf} r={8} fill="#FB7185" stroke="#0B0F1A" strokeWidth={2}
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
const TEORIA_SECTIONS = [
  { idx: 0, label: "① Análisis Nodal",   color: "#94A3B8" },
  { idx: 1, label: "② IPR Darcy",        color: "#60A5FA" },
  { idx: 2, label: "③ Vogel + AOF",      color: "#818CF8" },
  { idx: 3, label: "④ VLP · Bomba BES",  color: "#34D399" },
  { idx: 4, label: "⑤ Leyes Afinidad",   color: "#F472B6" },
  { idx: 5, label: "⑥ Glosario",         color: "#FBBF24" },
];

function TabTeoria({ section, setSection }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 20, minHeight: 480 }}>
      {/* Sidebar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {TEORIA_SECTIONS.map(s => (
          <button key={s.idx} onClick={() => setSection(s.idx)} style={{
            background: section === s.idx ? `${s.color}18` : "transparent",
            border: `1px solid ${section === s.idx ? s.color + "44" : "transparent"}`,
            borderRadius: 6, color: section === s.idx ? s.color : "#475569",
            fontSize: 10, padding: "9px 12px", cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 1, textAlign: "left",
            fontWeight: section === s.idx ? 700 : 400,
          }}>{s.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.9, background: "#111827", borderRadius: 10, padding: "20px 22px", border: "1px solid #1E293B" }}>

        {section === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>¿Qué es el Análisis Nodal?</div>
              <p style={{ margin: "0 0 10px" }}>
                Técnica desarrollada por <strong style={{ color: "#CBD5E1" }}>Joe Mach (1979)</strong> que divide el sistema de producción en dos subsistemas que se equilibran en un nodo ubicado en el fondo del pozo.
              </p>
              <p style={{ margin: 0 }}>
                El punto donde ambas curvas se cruzan es el <strong style={{ color: "#FB7185" }}>Punto de Operación</strong>: el caudal y la presión real a la que produce el pozo.
              </p>
            </div>
            <div>
              <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Los dos subsistemas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ background: "#38BDF820", border: "1px solid #38BDF840", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "#38BDF8", fontWeight: 700, marginBottom: 4 }}>IPR — Inflow Performance Relationship</div>
                  Capacidad de entrega del <strong>yacimiento</strong>. A mayor drawdown (Pr − Pwf), mayor caudal. Depende de la roca, el fluido y la presión del reservorio.
                </div>
                <div style={{ background: "#34D39920", border: "1px solid #34D39940", borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ color: "#34D399", fontWeight: 700, marginBottom: 4 }}>VLP — Vertical Lift Performance</div>
                  Demanda energética de la <strong>infraestructura</strong>: columna de fluido, fricción en tubing y cabeza del pozo. La bomba BES reduce esta demanda.
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ color: "#60A5FA", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Modelo Darcy — Zona lineal</div>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 12, color: "#E2E8F0", fontSize: 14, letterSpacing: 1 }}>Q = IP × (Pr − Pwf)</div>
              <p style={{ margin: "0 0 8px" }}>
                Válido mientras <strong style={{ color: "#FBBF24" }}>Pwf ≥ Pb</strong>. Todo el gas permanece disuelto en el petróleo → fluido monofásico → relación caudal-presión lineal.
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>Ref: Darcy, 1856 — Ley de flujo en medios porosos</p>
            </div>
            <div>
              <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Variables</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {[
                  ["Q",   "m³/d",     "Caudal volumétrico en superficie"],
                  ["IP",  "m³/d/psi", "Índice de Productividad: pendiente de la IPR. Mide la facilidad del yacimiento para entregar fluido."],
                  ["Pr",  "psi",      "Presión estática del reservorio (yacimiento en reposo)"],
                  ["Pwf", "psi",      "Presión fluyente de fondo: presión en la bomba cuando el pozo produce"],
                  ["Pb",  "psi",      "Presión de burbuja: por debajo de ella el gas empieza a liberarse"],
                ].map(([v, u, desc]) => (
                  <div key={v} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#60A5FA", fontWeight: 700, minWidth: 30 }}>{v}</span>
                    <span style={{ color: "#475569", minWidth: 76 }}>[{u}]</span>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 2 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ color: "#818CF8", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Modelo Vogel — Zona bifásica</div>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 10, color: "#E2E8F0", fontSize: 12, lineHeight: 2 }}>
                Q / AOF = 1 − 0.2·(Pwf/Pb) − 0.8·(Pwf/Pb)²
              </div>
              <p style={{ margin: "0 0 8px" }}>
                Activo cuando <strong style={{ color: "#FBBF24" }}>Pwf &lt; Pb</strong>. El gas liberado reduce la movilidad del petróleo → la curva pierde linealidad y se vuelve cóncava.
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>Ref: Vogel, 1968 — SPE 1476</p>
            </div>
            <div>
              <div style={{ color: "#818CF8", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>AOF — Absolute Open Flow</div>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 10, color: "#E2E8F0", fontSize: 12, lineHeight: 2 }}>
                Qb = IP × max(Pr − Pb, 0)<br />
                AOF = Qb + (IP × Pb) / 1.8
              </div>
              <p style={{ margin: "0 0 8px" }}>
                El <strong style={{ color: "#A5B4FC" }}>AOF</strong> es el caudal máximo teórico a Pwf = 0. Define el techo del yacimiento. No es alcanzable en operación real.
              </p>
              <div style={{ background: "#1E3A5F", borderRadius: 6, padding: "8px 12px", fontSize: 10, color: "#93C5FD" }}>
                IPR compuesta = Darcy (Q ≤ Qb) + Vogel (Q &gt; Qb). Este simulador usa el modelo compuesto en todo momento.
              </div>
            </div>
          </div>
        )}

        {section === 3 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ color: "#34D399", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>VLP — ¿Qué expresa?</div>
              <p style={{ margin: "0 0 8px" }}>
                La VLP es la <strong style={{ color: "#34D399" }}>presión mínima de fondo</strong> que necesita el yacimiento para sostener un caudal Q dado. A mayor caudal, mayor demanda energética del sistema.
              </p>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 10, color: "#E2E8F0", fontSize: 12, lineHeight: 2.2 }}>
                Pwf = Pwh + grad·prof − H_bomba + H_fricción
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {[
                  ["Pwh + grad·prof", "Altura estática. Presión que requiere el fluido para subir desde la profundidad de la bomba hasta la superficie."],
                  ["− H_bomba",       "La bomba inyecta energía al fluido y reduce la presión que debe aportar el yacimiento. Mayor frecuencia = más aporte de la bomba."],
                  ["+ H_fricción",    "Pérdidas por fricción en el tubing. Crecen con Q² → a mayor caudal, mayor penalización. [Simplificado: calibrado para tubing 2.875\"–3.5\"]"],
                ].map(([term, desc]) => (
                  <div key={term} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#34D399", fontWeight: 700, minWidth: 110, flexShrink: 0, fontSize: 10 }}>{term}</span>
                    <span style={{ fontSize: 10 }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0D2B1D", border: "1px solid #34D39940", borderRadius: 6, padding: "8px 12px", fontSize: 10, color: "#6EE7B7", lineHeight: 1.7 }}>
                La curva VLP tiene forma de <strong>U</strong>: primero cae con Q (la bomba aporta más altura a mayor caudal) y luego sube (la fricción domina). El punto de operación es donde la IPR corta a la VLP.
              </div>
            </div>
            <div>
              <div style={{ color: "#34D399", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Curva H-Q de la bomba BES</div>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 10, color: "#E2E8F0", fontSize: 12, lineHeight: 2 }}>
                H(Q) = H₀ · [1 − (Q/Qmax)^1.85] · (f/60)²
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                {[
                  ["H₀",      "8.500 ft",  "Altura máxima a Q=0 y 60 Hz (bomba representativa)"],
                  ["Qmax",    "667 m³/d",  "Caudal al que la altura cae a cero (60 Hz)"],
                  ["BEP",     "334 m³/d",  "Best Efficiency Point a 60 Hz (≈ 50% de Qmax)"],
                  ["(f/60)²", "—",         "Factor de escala de las Leyes de Afinidad: la altura varía con el cuadrado de la frecuencia"],
                ].map(([v, val, desc]) => (
                  <div key={v} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: "#34D399", fontWeight: 700, minWidth: 46, flexShrink: 0 }}>{v}</span>
                    <span style={{ color: "#475569", minWidth: 64, flexShrink: 0 }}>{val}</span>
                    <span style={{ fontSize: 10 }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#1E293B", borderRadius: 6, padding: "10px 12px", fontSize: 10, color: "#94A3B8", lineHeight: 1.7 }}>
                <span style={{ color: "#34D399", fontWeight: 700 }}>Comportamiento: </span>
                La curva H-Q es <strong style={{ color: "#E2E8F0" }}>descendente</strong>. A Q=0 la bomba entrega su máxima altura; a medida que Q crece la altura cae hasta cero en Qmax. Al aumentar la frecuencia (VSD), toda la curva sube y se desplaza a la derecha — el BEP se mueve al mismo ritmo que Q (linealmente con f).
              </div>
            </div>
          </div>
        )}

        {section === 4 && (
          <div>
            {/* BEP banner */}
            <div style={{ background: "#F472B618", border: "1px solid #F472B640", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ color: "#F472B6", fontWeight: 700, marginBottom: 6, fontSize: 12 }}>BEP — Best Efficiency Point (Punto de Máxima Eficiencia)</div>
              <div style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.8 }}>
                El BEP es el caudal al que la bomba opera con su <strong style={{ color: "#F472B6" }}>mayor eficiencia hidráulica</strong>. En ese punto, la energía entregada al fluido es máxima respecto a la energía consumida. Fuera del BEP, la bomba convierte energía en vibración y calor en lugar de presión útil.
                <br /><strong style={{ color: "#F472B6" }}>¿Por qué importa?</strong> Opera por debajo del 68% del BEP → recirculación interna y sobrecalentamiento. Por encima del 132% → surging (cavitación). Ambas condiciones deterioran la bomba aceleradamente y pueden causar fallas en días.
                El BEP en SIMBES representa el 50% de Qmax. A 60 Hz: BEP ≈ 334 m³/d. El BEP <strong style={{ color: "#F472B6" }}>escala linealmente</strong> con la frecuencia: a 50 Hz → BEP ≈ 278 m³/d.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ color: "#F472B6", fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Leyes de Afinidad — VSD</div>
                <div style={{ background: "#1E293B", borderRadius: 6, padding: "12px 14px", marginBottom: 10, color: "#E2E8F0", fontSize: 13, lineHeight: 2.2 }}>
                  Q₂/Q₁ = f₂/f₁<br />
                  H₂/H₁ = (f₂/f₁)²<br />
                  P₂/P₁ = (f₂/f₁)³
                </div>
                <div style={{ background: "#1E293B", borderRadius: 6, padding: "10px 12px", marginBottom: 10, fontSize: 10, color: "#94A3B8", lineHeight: 1.9 }}>
                  <span style={{ color: "#F472B6", fontWeight: 700 }}>Ejemplo: 60 Hz → 50 Hz (ratio = 0.833)</span><br />
                  Q: × 0.833 → BEP pasa de 334 a <span style={{ color: "#F472B6", fontWeight: 700 }}>278 m³/d</span><br />
                  H: × 0.833² = × 0.694 → altura cae al <span style={{ color: "#FBBF24", fontWeight: 700 }}>69.4%</span><br />
                  P: × 0.833³ = × 0.579 → potencia cae al <span style={{ color: "#34D399", fontWeight: 700 }}>57.9%</span>
                </div>
                <p style={{ margin: 0, fontSize: 10, color: "#475569", lineHeight: 1.7 }}>
                  La ley cúbica de potencia es la clave del ahorro energético con VSD. Reducir la frecuencia un 17% recorta el consumo eléctrico casi a la mitad. Subir de 60 a 66 Hz aumenta la potencia un 33%.
                </p>
              </div>
              <div>
                <div style={{ color: "#E2E8F0", fontWeight: 700, marginBottom: 10, fontSize: 13 }}>Zonas de operación</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { color: "#EF4444", bg: "#EF444420", border: "#EF444440", range: "Q < 68% BEP", title: "Recirculación interna", text: "El fluido recircula dentro de los impulsores. Genera calor excesivo y desgaste acelerado. El amperímetro puede mostrar consumo bajo (señal engañosa)." },
                    { color: "#22C55E", bg: "#22C55E20", border: "#22C55E40", range: "68%–132% BEP", title: "Zona óptima", text: "Operación estable y eficiente. La bomba trabaja cerca de su diseño. Mínima vibración y máxima vida útil. Objetivo de operación." },
                    { color: "#F59E0B", bg: "#F59E0B20", border: "#F59E0B40", range: "Q > 132% BEP", title: "Surging / Cavitación", text: "La bomba trabaja sobre su límite hidráulico. La cavitación erosiona impulsores rápidamente. Reducir frecuencia o abrir choke de inmediato." },
                  ].map(item => (
                    <div key={item.range} style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 6, padding: "10px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ color: item.color, fontWeight: 700, fontSize: 10 }}>{item.title}</span>
                        <span style={{ color: item.color, fontSize: 9, background: item.border, padding: "1px 6px", borderRadius: 10 }}>{item.range}</span>
                      </div>
                      <span style={{ fontSize: 10 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {section === 5 && (
          <div style={{ columns: 2, gap: 20 }}>
            {[
              ["AOF",      "Absolute Open Flow. Caudal máximo teórico a Pwf = 0."],
              ["BEP",      "Best Efficiency Point. Caudal de mayor eficiencia hidráulica de la bomba."],
              ["Drawdown", "(Pr − Pwf) / Pr × 100%. Fracción de presión del reservorio consumida para producir."],
              ["GVF",      "Gas Volume Fraction. Fracción de gas libre en la succión de la bomba."],
              ["IP",       "Índice de Productividad [m³/d/psi]. Pendiente de la IPR lineal."],
              ["Densidad", "Densidad del fluido [kg/L]. Agua = 1.0. Crudo 30°API ≈ 0.876. grad = densidad × 0.4335 psi/ft."],
              ["IPR",      "Inflow Performance Relationship. Curva que relaciona Pwf con Q del yacimiento."],
              ["Pb",       "Presión de Burbuja [psi]. Por debajo de ella el gas se libera del petróleo."],
              ["Pr",       "Presión Estática del Reservorio [psi]. Presión sin producción."],
              ["Pwf",      "Presión Fluyente de Fondo [psi]. Presión en la intake de la bomba durante producción."],
              ["Pwh",      "Presión de Cabezal [psi]. Contrapresión en superficie (choke + flowline + separador)."],
              ["Surging",  "Cavitación por operación sobre el BEP. Daña impulsores y rodamientos."],
              ["TDH",      "Total Dynamic Head. Altura total dinámica que debe vencer la bomba."],
              ["VLP",      "Vertical Lift Performance. Curva de demanda del sistema de levantamiento."],
              ["VSD",      "Variable Speed Drive / Variador de Frecuencia. Controla RPM del motor BES."],
            ].map(([term, def]) => (
              <div key={term} style={{ breakInside: "avoid", marginBottom: 10, display: "flex", gap: 8 }}>
                <span style={{ color: "#FBBF24", fontWeight: 700, minWidth: 64, flexShrink: 0 }}>{term}</span>
                <span>{def}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  TAB B — SIMULADOR (with tooltips)
// ═══════════════════════════════════════════════════════
function TabSimulador({ Pr, setPr, Pb, setPb, IP, setIP, depth, setDepth, Pwh, setPwh, densidad, setDensidad, freq, setFreq }) {
  const safePb = Math.min(Pb, Pr - 50);
  const safeIP = Math.max(0.02, IP);
  const { chartData, aof, qb, opPoint, alerts, bep_m3d } = useMemo(
    () => computeSim(Pr, safePb, safeIP, depth, Pwh, freq, densidad),
    [Pr, safePb, safeIP, depth, Pwh, freq, densidad]
  );
  const dd = opPoint ? Math.round((Pr - opPoint.Pwf) / Pr * 100) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <ControlGroup title="■ Yacimiento" accent="#60A5FA">
          <Param label="Pr — Presión Reservorio" unit="psi"
            value={Pr} min={500} max={7000} step={50} onChange={setPr} color="#60A5FA"
            hint="Presión estática del reservorio. Campo: 500–10,000 psi. Mayor Pr = más energía disponible." />
          <Param label="Pb — Presión de Burbuja" unit="psi"
            value={safePb} min={100} max={Pr - 50} step={50}
            onChange={v => setPb(Math.min(v, Pr - 50))} color="#60A5FA"
            hint="Por encima de Pb: fluido monofásico (Darcy). Por debajo: gas libre (Vogel). Campo: 500–4,000 psi." />
          <Param label="IP — Índice Productividad" unit="m³/d/psi"
            value={IP} min={0.02} max={1.60} step={0.02} dec={2}
            onChange={setIP} color="#60A5FA"
            hint="Pendiente de la IPR. Mide la facilidad del yacimiento. BES típico: 0.05–1.5 m³/d/psi." />
        </ControlGroup>

        <ControlGroup title="■ Geometría del Pozo" accent="#34D399">
          <Param label="Profundidad de Bomba" unit="m"
            value={depth} min={300} max={4300} step={50} onChange={setDepth} color="#34D399"
            hint="Profundidad de la bomba BES. Campo típico: 600–3,500 m. Mayor profundidad → mayor TDH." />
          <Param label="Pwh — Presión Cabezal" unit="psi"
            value={Pwh} min={50} max={1000} step={25} onChange={setPwh} color="#34D399"
            hint="Contrapresión en cabeza de pozo (choke + flowline + separador). Campo: 50–500 psi." />
          <Param label="Densidad del Fluido" unit="kg/L"
            value={densidad} min={0.70} max={1.15} step={0.01} dec={3}
            onChange={setDensidad} color="#34D399"
            hint={`Agua = 1.0 kg/L · Crudo 30°API ≈ 0.876 kg/L. Gradiente = densidad × 0.4335 psi/ft (actual: ${(densidad * 0.4335).toFixed(4)} psi/ft).`} />
        </ControlGroup>

        <ControlGroup title="■ VSD — Variador de Frecuencia" accent="#F472B6">
          <Param label="Frecuencia" unit="Hz"
            value={freq} min={30} max={70} step={1} onChange={setFreq} color="#F472B6"
            hint="60 Hz = velocidad nominal. Rango campo BES: 40–70 Hz. Afecta Q (lineal), H (cuadrático) y potencia (cúbico)." />
          <div style={{ fontSize: 10, color: "#475569", background: "#0F172A", padding: "8px 10px", borderRadius: 6, lineHeight: 1.8 }}>
            BEP estimado a {freq} Hz<br />
            <span style={{ color: "#F472B6" }}>≈ {bep_m3d.toFixed(1)} m³/d</span><br />
            H ref. escala × {((freq/60)**2).toFixed(2)}
          </div>
        </ControlGroup>

        {/* IPR composition */}
        <div style={{ background: "#111827", border: "1px solid #1E293B", borderRadius: 8, padding: 12 }}>
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
            <div style={{ borderTop: "1px solid #1E293B", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
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
        <div style={{ background: "#0F172A", border: "1px solid #1E293B33", borderLeft: "3px solid #0EA5E9", borderRadius: "0 8px 8px 0", padding: "10px 14px", fontSize: 11, color: "#64748B", lineHeight: 1.8 }}>
          <span style={{ color: "#38BDF8", fontWeight: 700 }}>PUNTO DE OPERACIÓN · </span>
          Intersección de la curva <span style={{ color: "#38BDF8" }}>IPR</span> y la curva <span style={{ color: "#34D399" }}>VLP</span>.
          Modifica la <span style={{ color: "#F472B6" }}>frecuencia del VSD</span> para mover el punto de operación.
          {` Fluido: ${densidad.toFixed(3)} kg/L → grad ≈ ${(densidad * 0.4335).toFixed(3)} psi/ft.`}
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
    hint: "Observa el diagnóstico operativo debajo de la gráfica. Identifica el % del BEP y el tipo de alerta.",
  },
  {
    title: "Paso 2 · Ajuste de frecuencia a 55 Hz",
    freq: 55,
    context: "El jefe de ingeniería sugiere bajar a 55 Hz para proteger la bomba. El contratista teme que la producción caiga demasiado. Se decide hacer una prueba.",
    question: "Al reducir a 55 Hz, ¿el punto de operación mejora o empeora respecto al BEP? ¿Cuánto cambia el drawdown?",
    hint: "Compara el Q operativo y el % del BEP entre 60 Hz y 55 Hz.",
  },
  {
    title: "Paso 3 · Optimización a 65 Hz",
    freq: 65,
    context: "Con nuevas mediciones, el equipo determina que Pr es mayor de lo estimado. Se propone subir a 65 Hz para maximizar producción sin superar el 130% del BEP.",
    question: "A 65 Hz, ¿se alcanza el objetivo de 450 m³/d? ¿El riesgo de surging aumenta o disminuye respecto a 60 Hz?",
    hint: "Compara Q operativo con el objetivo (45 m³/d) y observa las alertas de diagnóstico.",
  },
];

function TabCaso() {
  const [step, setStep]   = useState(0);
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
      <div style={{ background: "#111827", border: "1px solid #34D39940", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>
              ESCENARIO — CAMPO OPERATIVO
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F5F9", marginBottom: 4 }}>Pozo Colibrí-3</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>
              Pr {COLIBRI.Pr.toLocaleString()} psi · Pb {COLIBRI.Pb.toLocaleString()} psi · IP {COLIBRI.IP} m³/d/psi · Prof. {COLIBRI.depth.toLocaleString()} m · Densidad {COLIBRI.densidad} kg/L
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {CASO_STEPS.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} style={{
                background: step === i ? "#34D399" : "#1E293B",
                border: `1px solid ${step === i ? "#34D399" : "#334155"}`,
                borderRadius: 6, color: step === i ? "#0B0F1A" : "#64748B",
                fontSize: 10, padding: "6px 14px", cursor: "pointer",
                fontFamily: "inherit", fontWeight: step === i ? 700 : 400,
              }}>Paso {i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Step context */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#34D399", fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{s.title}</div>
          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.8, margin: "0 0 14px" }}>{s.context}</p>
          <div style={{ background: "#0F172A", border: "1px solid #34D39933", borderLeft: "3px solid #34D399", borderRadius: "0 6px 6px 0", padding: "10px 12px" }}>
            <div style={{ fontSize: 9, color: "#34D399", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>PREGUNTA GUIADA</div>
            <p style={{ fontSize: 11, color: "#CBD5E1", lineHeight: 1.7, margin: "0 0 8px" }}>{s.question}</p>
            <p style={{ fontSize: 10, color: "#475569", margin: 0, fontStyle: "italic" }}>Pista: {s.hint}</p>
          </div>

          {/* Key metrics for this step */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Metric label="Frecuencia" unit="Hz" value={s.freq} color="#F472B6" />
            <Metric label="Q Operativo" unit="m³/d" value={opPoint ? opPoint.Q.toFixed(1) : "—"} color="#38BDF8" glow />
            <Metric label="Drawdown" unit="%" value={dd !== null ? `${dd}%` : "—"} color={dd > 80 ? "#EF4444" : dd > 60 ? "#F59E0B" : "#34D399"} />
          </div>

          {/* Alerts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
            {alerts.map((a, i) => <Alert key={i} {...a} />)}
          </div>
        </div>

        <NodalChart chartData={chartData} opPoint={opPoint} safePb={safePb} bep_m3d={bep_m3d} Pr={COLIBRI.Pr} />
      </div>
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
          <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>5 preguntas · 100 puntos · Mínimo aprobatorio: 70%</div>
        </div>
        {submitted && (
          <button onClick={handleReset} style={{
            background: "transparent", border: "1px solid #1E293B", borderRadius: 6,
            color: "#64748B", fontSize: 10, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit",
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
            <div style={{ fontSize: 11, color: "#64748B" }}>
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
              background: "#111827", borderRadius: 10, padding: "16px 18px",
              border: `1px solid ${fb ? (fb.correct ? "#22C55E44" : "#EF444444") : "#1E293B"}`,
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
                  let borderColor = "#1E293B";
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
                <div style={{ marginTop: 12, marginLeft: 22, background: "#0B0F1A", border: `1px solid ${fb.correct ? "#22C55E33" : "#EF444433"}`, borderRadius: 6, padding: "10px 12px" }}>
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
            onClick={() => setSubmitted(true)}
            style={{
              background: allAnswered ? "#F472B6" : "#1E293B",
              border: "none", borderRadius: 8,
              color: allAnswered ? "#0B0F1A" : "#334155",
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
export default function SIMBES_M1() {
  // Tab navigation
  const [activeTab,     setActiveTab]     = useState("simulador");
  const [teoriaSection, setTeoriaSection] = useState(0);

  // Simulator state (shared between tabs B and C uses fixed COLIBRI params)
  const [Pr,       setPr]       = useState(3500);
  const [Pb,       setPb]       = useState(1800);
  const [IP,       setIP]       = useState(0.24);
  const [depth,    setDepth]    = useState(2100);
  const [Pwh,      setPwh]      = useState(150);
  const [freq,     setFreq]     = useState(60);
  const [densidad, setDensidad] = useState(0.876);

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace", background: "#0B0F1A", minHeight: "100vh", color: "#CBD5E1", padding: "20px 24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ background: "#0EA5E9", borderRadius: 4, padding: "2px 8px", fontSize: 9, letterSpacing: 2, color: "#0B0F1A", fontWeight: 800, textTransform: "uppercase" }}>SIMBES · M1</div>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
          <span style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>SIMULACIÓN ACTIVA</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#F1F5F9", letterSpacing: 0.5 }}>
          Análisis Nodal — IPR · VLP
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748B" }}>
          Curva de Afluencia (Darcy / Vogel) · Levantamiento BES · Punto de Operación
        </p>
      </div>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "teoria" && (
        <TabTeoria section={teoriaSection} setSection={setTeoriaSection} />
      )}
      {activeTab === "simulador" && (
        <TabSimulador
          Pr={Pr} setPr={setPr} Pb={Pb} setPb={setPb}
          IP={IP} setIP={setIP} depth={depth} setDepth={setDepth}
          Pwh={Pwh} setPwh={setPwh} densidad={densidad} setDensidad={setDensidad}
          freq={freq} setFreq={setFreq}
        />
      )}
      {activeTab === "caso" && <TabCaso />}
      {activeTab === "evaluacion" && <TabEvaluacion />}
    </div>
  );
}
