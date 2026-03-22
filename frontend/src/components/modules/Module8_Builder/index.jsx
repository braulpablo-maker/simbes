/**
 * SIMBES — Módulo 8: Constructor de Escenarios
 * =============================================
 * Integración de M1–M7 en modo libre.
 * El usuario configura todos los parámetros y ve el análisis completo del sistema BES.
 */
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import { calcAOF, iprPwfToQ, iprQtoPwf, buildIPRCurve } from "../../../physics/ipr";
import { pumpHeadFt, vlpPwf }                           from "../../../physics/hydraulics";
import { gasVolumeFraction, hqGasDegradation, gasSeparatorEfficiency, hiViscosityCorrection } from "../../../physics/gas";
import { cableVoltageDrop, arrheniusLifeFactor, thdEstimate } from "../../../physics/electrical";
import { survivalProb }                                  from "../../../physics/reliability";
import BENCH_DATA                                        from "../../../data/mtbf-benchmarks.json";
import { M8_QUESTIONS, gradeM8 }                        from "../../../pedagogy/evaluations/m8";

// ─── Constantes ───────────────────────────────────────────────────────────────
const ACCENT   = "#E2E8F0";
const ACCENT_B = "#38BDF8";
import { C } from '../../../theme';

const STB_TO_M3  = 0.158987;
const M_TO_FT    = 3.28084;
const FT_TO_M    = 0.3048;

const BENCHMARKS = BENCH_DATA.benchmarks;
const BENCH_MTBF = { env_benign: 1825, env_moderate: 913, env_severe: 365, env_sandy: 180 };

const TOOLTIP_STYLE = {
  background: "#0D1424", border: "1px solid #1E293B",
  fontSize: 10, color: "#CBD5E1", fontFamily: "JetBrains Mono, monospace",
};

// ─── Integración del sistema ─────────────────────────────────────────────────
function computeSystem(p) {
  const { Pr, Pb, IP, depth_m, Pwh, freq, rho_kgL, GOR, T_F, separator, mu,
          AWG, I_amps, T_rated, vsd_topo, bench_env } = p;

  const depth_ft    = depth_m * M_TO_FT;
  const grad_psi_ft = rho_kgL * 0.4335;

  // ── 1. IPR ──
  const AOF     = calcAOF(Pr, Pb, IP);
  const Q_max   = Math.max(AOF * 1.05, 100);

  // ── 2. Build chart curves ──
  const N_PTS   = 200;
  const chartData = [];

  // Find clean operating point (bisection on IPR - VLP_clean)
  let Q_op_clean = null, Pwf_op_clean = null;
  let Q_op_deg   = null, Pwf_op_deg   = null;

  let prevDiff = null;
  let prevQ    = 0;

  // VLP degradation factors (based on approx Ps ≈ Pwh, updated after op point)
  const gvf_wb  = gasVolumeFraction(GOR, Pb, Math.max(Pwh, 50), T_F);
  const sep_r   = gasSeparatorEfficiency(gvf_wb.GVF, separator);
  const GVF_pump = gvf_wb.GVF * (1 - sep_r.separation_eff);
  const gas_deg  = hqGasDegradation(GVF_pump);
  const visc_c   = hiViscosityCorrection(mu, 61.25, 32.5);
  const f_H      = gas_deg.head_factor * visc_c.CH;

  for (let i = 0; i <= N_PTS; i++) {
    const Q   = (Q_max * i) / N_PTS;
    const IPR = iprQtoPwf(Q, Pr, Pb, IP);
    const VLP_clean = vlpPwf(Q, depth_ft, Pwh, freq, grad_psi_ft);

    // Degraded VLP: pump head reduced by f_H
    const pumpPsi_clean  = pumpHeadFt(Q, freq) * grad_psi_ft;
    const frictionPsi    = 1.4e-5 * Q * Q;
    const staticPsi      = Pwh + grad_psi_ft * depth_ft;
    const VLP_deg        = Math.max(0, staticPsi - pumpPsi_clean * f_H + frictionPsi);

    chartData.push({
      Q:  +Q.toFixed(1),
      IPR: IPR !== null ? +IPR.toFixed(1) : null,
      VLP_clean: +VLP_clean.toFixed(1),
      VLP_deg:   +VLP_deg.toFixed(1),
    });

    // Bisection: clean
    if (IPR !== null && Q_op_clean === null) {
      const diff = IPR - VLP_clean;
      if (prevDiff !== null && prevDiff * diff < 0) {
        Q_op_clean   = (prevQ + Q) / 2;
        Pwf_op_clean = iprQtoPwf(Q_op_clean, Pr, Pb, IP) || VLP_clean;
      }
      prevDiff = diff;
      prevQ    = Q;
    }
  }

  // Bisection: degraded
  prevDiff = null; prevQ = 0;
  for (let i = 0; i <= N_PTS; i++) {
    const Q   = (Q_max * i) / N_PTS;
    const IPR = iprQtoPwf(Q, Pr, Pb, IP);
    if (IPR === null) continue;
    const pumpPsi_clean = pumpHeadFt(Q, freq) * grad_psi_ft;
    const frictionPsi   = 1.4e-5 * Q * Q;
    const staticPsi     = Pwh + grad_psi_ft * depth_ft;
    const VLP_deg       = Math.max(0, staticPsi - pumpPsi_clean * f_H + frictionPsi);
    const diff = IPR - VLP_deg;
    if (prevDiff !== null && prevDiff * diff < 0 && Q_op_deg === null) {
      Q_op_deg   = (prevQ + Q) / 2;
      Pwf_op_deg = iprQtoPwf(Q_op_deg, Pr, Pb, IP) || VLP_deg;
    }
    prevDiff = diff;
    prevQ    = Q;
  }

  // ── 3. TDH ──
  const Q_op_m3d  = (Q_op_clean || Q_max * 0.3) * STB_TO_M3;
  const PSI_TO_M  = 0.70307;
  const TDH_m     = depth_m + Pwh * PSI_TO_M + 1.4e-5 * (Q_op_m3d / STB_TO_M3) ** 2 * FT_TO_M * 0.5;
  const H0_stage  = 45; // ft — bomba representativa
  const H_stage_bep = H0_stage * FT_TO_M * (1 - 0.5 ** 1.85) * (freq / 60) ** 2;
  const N_stages  = Math.ceil(TDH_m / H_stage_bep);

  // ── 4. GVF refinado (usando Pwf_op como Ps) ──
  const Ps_refined  = Pwf_op_clean || Pwh;
  const gvf_ref     = gasVolumeFraction(GOR, Pb, Math.max(Ps_refined * 0.8, 50), T_F);
  const sep_ref     = gasSeparatorEfficiency(gvf_ref.GVF, separator);
  const GVF_pump_r  = gvf_ref.GVF * (1 - sep_ref.separation_eff);

  // ── 5. Eléctrico ──
  const T_bot_C  = 25 + (depth_m / 100) * 3.2; // gradiente geotérmico aprox
  let cable, arrh, thd;
  try {
    cable = cableVoltageDrop(AWG, depth_ft, I_amps, T_bot_C);
    arrh  = arrheniusLifeFactor(T_bot_C, T_rated);
    thd   = thdEstimate(vsd_topo);
  } catch {
    cable = { V_drop_V: 0, pct_drop: 0, warning_5pct: false, danger_10pct: false };
    arrh  = { life_factor: 1, pct_life_remaining: 100, delta_T_C: 0, warning: false };
    thd   = { THD_pct: 30, complies_ieee519: false };
  }

  // ── 6. Confiabilidad ──
  const MTBF_ref = BENCH_MTBF[bench_env] || 913;
  const R_1y     = survivalProb(365, MTBF_ref);
  const R_2y     = survivalProb(730, MTBF_ref);

  // ── Alertas integradas ──
  const alerts = [];
  if (GVF_pump_r > 0.15)          alerts.push({ sev: "danger",  msg: `GVF bomba ${(GVF_pump_r*100).toFixed(1)}% > 15% — riesgo de gas lock inmediato` });
  else if (GVF_pump_r > 0.10)     alerts.push({ sev: "warning", msg: `GVF bomba ${(GVF_pump_r*100).toFixed(1)}% — zona de advertencia (10–15%)` });
  if (cable.danger_10pct)          alerts.push({ sev: "danger",  msg: `V_drop ${cable.pct_drop}% > 10% — pérdida severa de voltaje en cable` });
  else if (cable.warning_5pct)     alerts.push({ sev: "warning", msg: `V_drop ${cable.pct_drop}% > 5% — revisar calibre de cable (IEEE 519)` });
  if (!thd.complies_ieee519)       alerts.push({ sev: "warning", msg: `THD ${thd.THD_pct}% no cumple IEEE 519-2014 (límite 5%)` });
  if (arrh.warning && arrh.delta_T_C > 20) alerts.push({ sev: "danger", msg: `T_motor ${T_bot_C.toFixed(0)}°C — ${arrh.delta_T_C}°C sobre límite. Vida: ${arrh.pct_life_remaining}%` });
  else if (arrh.warning)           alerts.push({ sev: "warning", msg: `T_motor cerca del límite clase. Vida: ${arrh.pct_life_remaining}%` });
  if (R_1y < 0.30)                 alerts.push({ sev: "danger",  msg: `R(1 año) = ${(R_1y*100).toFixed(0)}% — ambiente severo, planificar repuesto` });
  if (!Q_op_clean)                 alerts.push({ sev: "danger",  msg: "Sin punto de operación limpio — revisar parámetros del sistema" });
  if (!Q_op_deg && Q_op_clean)     alerts.push({ sev: "danger",  msg: "Gas lock: la curva degradada no intersecta con la IPR" });
  if (alerts.length === 0)         alerts.push({ sev: "ok",      msg: "Sistema integrado dentro de parámetros operativos. Sin alertas activas." });

  return {
    AOF, Q_max, chartData, f_H, GVF_pump: GVF_pump_r, gas_deg,
    Q_op_clean, Pwf_op_clean, Q_op_deg, Pwf_op_deg,
    TDH_m: +TDH_m.toFixed(1), N_stages,
    cable, arrh, thd, T_bot_C: +T_bot_C.toFixed(1),
    MTBF_ref, R_1y, R_2y, alerts,
    Q_drop_pct: Q_op_clean && Q_op_deg ? +((1 - Q_op_deg / Q_op_clean) * 100).toFixed(1) : null,
  };
}

// ─── Motor rápido (sin chartData) para serie de tiempo ───────────────────────
function computeSystemFast(p) {
  const { Pr, Pb, IP, depth_m, Pwh, freq, rho_kgL, GOR, T_F, separator, mu,
          T_rated, bench_env } = p;
  const depth_ft    = depth_m * M_TO_FT;
  const grad_psi_ft = rho_kgL * 0.4335;

  // GVF en succión (Ps ≈ Pwh primera pasada)
  const gvf_wb   = gasVolumeFraction(GOR, Pb, Math.max(Pwh, 50), T_F);
  const sep_r    = gasSeparatorEfficiency(gvf_wb.GVF, separator);
  const GVF_pump = gvf_wb.GVF * (1 - sep_r.separation_eff);
  const gas_deg  = hqGasDegradation(GVF_pump);
  const visc_c   = hiViscosityCorrection(mu, 61.25, 32.5);
  const f_H      = gas_deg.head_factor * visc_c.CH;

  // Bisección: IPR ∩ VLP degradada (500 pasos)
  const AOF  = calcAOF(Pr, Pb, IP);
  const Qmax = AOF * 1.2;
  let Q_op = null, Pwf_op = null;
  let prevDiff = null, prevQ = 0;
  for (let i = 0; i <= 500; i++) {
    const Q   = (Qmax * i) / 500;
    const IPR = iprQtoPwf(Q, Pr, Pb, IP);
    if (IPR === null) { prevDiff = null; continue; }
    const pumpPsi  = pumpHeadFt(Q, freq) * grad_psi_ft;
    const friction = 1.4e-5 * Q * Q;
    const VLP      = Math.max(0, Pwh + grad_psi_ft * depth_ft - pumpPsi * f_H + friction);
    const diff = IPR - VLP;
    if (prevDiff !== null && prevDiff * diff < 0 && Q_op === null) {
      Q_op   = (prevQ + Q) / 2;
      Pwf_op = iprQtoPwf(Q_op, Pr, Pb, IP) || VLP;
    }
    prevDiff = diff;
    prevQ    = Q;
  }

  const T_bot_C  = 25 + (depth_m / 100) * 3.2;
  const MTBF_ref = BENCH_MTBF[bench_env] || 913;
  const R_1y     = survivalProb(365, MTBF_ref);
  let arrh;
  try { arrh = arrheniusLifeFactor(T_bot_C, T_rated); }
  catch { arrh = { pct_life_remaining: 100, warning: false }; }

  return { Q_op, Pwf_op, GVF_pump, f_H, arrh, R_1y, T_bot_C };
}

// ─── Arps + serie de tiempo ────────────────────────────────────────────────────

// @ref Arps, J.J. (1945) — Analysis of Decline Curves, Trans. AIME 160
function arpsQ(qi, Di, b, t) {
  if (b < 0.001) return qi * Math.exp(-Di * t);       // exponencial
  return qi / Math.pow(1 + b * Di * t, 1 / b);        // hiperbólica / armónica
}

// Bisección: halla Pr tal que el punto de operación ≈ q_target (STB/d)
function findPrForRate(q_target_stbd, baseParams) {
  let lo = (baseParams.Pb || 1000) + 100;
  let hi = 14000;
  for (let i = 0; i < 25; i++) {
    const mid = (lo + hi) / 2;
    const sim = computeSystemFast({ ...baseParams, Pr: mid });
    if ((sim.Q_op || 0) > q_target_stbd) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

// Serie de tiempo completa para Modo Plan
function computePlanTimeSeries(planP, sysP) {
  const { qi_m3d, Di_month, b, N_months } = planP;
  const BEP_stbd = 2100 * (sysP.freq / 60);
  const results  = [];

  for (let t = 0; t <= N_months; t++) {
    const q_arps_m3d  = arpsQ(qi_m3d, Di_month, b, t);
    const q_arps_stbd = q_arps_m3d / STB_TO_M3;
    const Pr_t = findPrForRate(q_arps_stbd, sysP);
    const sim  = computeSystemFast({ ...sysP, Pr: Pr_t });

    const Q_m3d     = sim.Q_op ? +(sim.Q_op * STB_TO_M3).toFixed(1) : null;
    const BEP_ratio = sim.Q_op ? sim.Q_op / BEP_stbd : null;
    const I_pct     = BEP_ratio ? +Math.min(130, BEP_ratio * 100).toFixed(1) : null;

    // Proxy vibración (mm/s RMS) por desviación del BEP
    // [SIMPLIFIED: modelo empírico educativo — no corresponde a fabricante específico]
    let vib = null;
    if (BEP_ratio !== null) {
      if (BEP_ratio < 0.68)      vib = +((0.68 - BEP_ratio) * 15 + 1).toFixed(2);
      else if (BEP_ratio > 1.32) vib = +((BEP_ratio - 1.32) * 15 + 1).toFixed(2);
      else                       vib = +(0.5 + Math.abs(1 - BEP_ratio) * 3).toFixed(2);
    }

    results.push({
      t,
      Q:      Q_m3d,
      q_arps: +q_arps_m3d.toFixed(1),
      Pwf:    sim.Pwf_op ? +sim.Pwf_op.toFixed(0) : null,
      GVF:    +(sim.GVF_pump * 100).toFixed(1),
      I_pct,
      vib,
      R:      +(sim.R_1y * 100).toFixed(1),
      Pr:     +Pr_t.toFixed(0),
      vida:   sim.arrh?.pct_life_remaining ?? 100,
    });
  }
  return results;
}

// ─── Micro-componentes ────────────────────────────────────────────────────────
function Param({ label, hint, accentColor = C.muted, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 8, color: accentColor, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 8, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{hint}</div>}
    </div>
  );
}

function KPI({ label, value, unit, color, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${color}28`, borderRadius: 8, padding: "10px 12px" }}>
      <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
        {value !== null && value !== undefined ? value : "—"}
        <span style={{ fontSize: 9, fontWeight: 400, marginLeft: 2 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function AlertRow({ sev, msg }) {
  const col  = sev === "danger" ? C.danger : sev === "warning" ? C.warn : C.ok;
  const icon = sev === "danger" ? "🔴" : sev === "warning" ? "🟡" : "🟢";
  return (
    <div style={{ background: col + "0C", border: `1px solid ${col}30`, borderRadius: 6, padding: "7px 10px", fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace" }}>
      {icon} {msg}
    </div>
  );
}

function SliderParam({ label, min, max, step, value, onChange, color, fmt, hint }) {
  return (
    <Param label={label} hint={hint} accentColor={color}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)}
        style={{ accentColor: color, width: "100%" }} />
      <div style={{ fontSize: 11, color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{fmt ? fmt(value) : value}</div>
    </Param>
  );
}

function ChartBlock({ title, children, height = 160 }) {
  return (
    <div style={{ background: C.surfAlt, borderRadius: 8, padding: "10px 12px", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 6 }}>{title}</div>
      <ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer>
    </div>
  );
}

function EventBadge({ label, month }) {
  const hit = month !== undefined;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: hit ? C.danger : C.ok, fontFamily: "JetBrains Mono, monospace" }}>
        {hit ? `Mes ${month}` : "No ocurre"}
      </span>
    </div>
  );
}

// ─── Tab A: Teoría ────────────────────────────────────────────────────────────
function TabTeoria() {
  return (
    <div style={{ display: "flex", gap: 20, minHeight: 520 }}>
      <div style={{ flex: 1, background: C.surface, borderRadius: 8, padding: 28, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 20 }}>
          Diseño Integrado de un Sistema BES — Flujo de Trabajo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {[
            {
              step: "01", mod: "M1", color: "#38BDF8", title: "Análisis Nodal (IPR)",
              desc: "Punto de partida: ¿cuánto puede dar el yacimiento?\nIPR (Darcy + Vogel) define la curva Q vs Pwf.\nEl AOF es el caudal teórico máximo (Pwf=0).\nEl punto de operación real depende de la VLP.",
            },
            {
              step: "02", mod: "M2", color: "#34D399", title: "Diseño Hidráulico (TDH)",
              desc: "¿Cuánta altura necesita la bomba?\nTDH = estática + fricción (Colebrook-White) + back-pressure.\nLa Velocidad Específica Ns define el tipo de impulsor.\nN° etapas = TDH / altura_por_etapa.",
            },
            {
              step: "03", mod: "M3", color: "#A78BFA", title: "Gas y Fluido",
              desc: "¿Cómo afecta el gas y la viscosidad a la bomba?\nGVF > 15% → gas lock. Separador AGS reduce el GVF.\nf_H = factor de degradación H-Q (gas × viscosidad).\nEl punto de operación efectivo cae con f_H < 1.",
            },
            {
              step: "04", mod: "M4", color: "#F472B6", title: "Eléctrico / VSD",
              desc: "¿Llega el voltaje correcto a la bomba?\nV_drop = I × R_cable (corrección por temperatura).\nArrhenius: cada 10°C sobre límite → vida ÷ 2.\nTHD: IEEE 519-2014 exige < 5% en PCC.",
            },
            {
              step: "05", mod: "M5", color: "#FBBF24", title: "Sensores y Monitoreo",
              desc: "¿Cómo detectamos anomalías en campo?\nCarta amperimérica: corriente vs tiempo.\nVibración: zonas A/B/C (ISO 10816-3).\nP/T downhole: diagnóstico térmico y de gas.",
            },
            {
              step: "06", mod: "M6", color: "#FB923C", title: "Diagnóstico DIFA",
              desc: "¿Qué falló y por qué?\nMotor de matching síntoma → patrón de falla.\nCodificación API RP 11S1: 3700/4900/5400/5900.\nTeardown report: primer daño = causa raíz.",
            },
            {
              step: "07", mod: "M7", color: "#FB923C", title: "Confiabilidad / MTBF",
              desc: "¿Cuándo falla y con qué probabilidad?\nR(t) = e^(−t/MTBF). R(MTBF) = 36.77% siempre.\nMTBF MLE = T_total / r (incluir censurados).\nIC Chi²: límite inferior = valor de planificación.",
            },
            {
              step: "08", mod: "M8", color: ACCENT, title: "Constructor de Escenarios",
              desc: "Integración completa en modo libre.\nTodos los parámetros en un único panel.\nCompara escenarios: nominal vs degradado.\nVisualiza el impacto cruzado entre módulos.",
            },
          ].map(s => (
            <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                background: s.color + "18", border: `1px solid ${s.color}40`,
                borderRadius: 6, padding: "4px 8px", flexShrink: 0,
                fontSize: 9, fontWeight: 800, color: s.color, fontFamily: "JetBrains Mono, monospace",
              }}>{s.mod}</div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: s.color, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>{s.title}</div>
                <pre style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {s.desc}
                </pre>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, padding: "14px 18px", background: "#0D1424", borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 6 }}>
            Regla de diseño integrado
          </div>
          <div style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
            Ningún módulo se puede optimizar de forma aislada. Aumentar la frecuencia (M1/M2) baja el Pwf → sube el GVF (M3). Más caudal → más corriente → más caída de cable (M4) → motor más caliente → menos vida (Arrhenius). Más fallas → MTBF real baja (M7). El Constructor permite ver todas estas interacciones simultáneamente.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab B: Constructor ──────────────────────────────────────────────────────
const DEFAULT = {
  Pr: 3500, Pb: 1600, IP: 0.32,
  depth_m: 1800, Pwh: 150, freq: 60, rho_kgL: 0.876,
  GOR: 45, T_F: 85, separator: "none", mu: 5,  // GOR en m³/m³, T_F en °C
  AWG: 4, I_amps: 80, T_rated: 180, vsd_topo: "standard_6pulse",
  bench_env: "env_moderate",
};

const SEP_OPTS  = [["none","Sin sep."],["ags_passive","AGS (65%)"],["gas_handler","Gas Handler (82%)"]];
const VSD_OPTS  = [["standard_6pulse","6P"],["12pulse","12P"],["18pulse","18P"],["afe","AFE"],["active_filter","Filtro"]];
const AWG_OPTS  = [1, 2, 4, 6, 8, 10];
const T_RAT_OPTS = [[155,"F"],[180,"H"],[220,"C"]];
const ENV_OPTS  = [["env_benign","Benigno"],["env_moderate","Moderado"],["env_severe","Severo"],["env_sandy","Arena"]];

function BtnGroup({ options, value, onChange, color }) {
  return (
    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} style={{
          padding: "3px 8px", borderRadius: 4, fontSize: 8, cursor: "pointer",
          background: value === v ? color + "22" : "transparent",
          border: `1px solid ${value === v ? color : C.border}`,
          color: value === v ? color : C.muted,
          fontFamily: "JetBrains Mono, monospace",
        }}>{l}</button>
      ))}
    </div>
  );
}

function TabSimulador() {
  const [p, setP] = useState(DEFAULT);
  const set = (k, v) => setP(prev => ({ ...prev, [k]: v }));

  const sim = useMemo(() => computeSystem({
    ...p,
    GOR: p.GOR * 5.6146,        // m³/m³ → scf/STB
    T_F: p.T_F * 9 / 5 + 32,   // °C → °F
    IP:  p.IP / STB_TO_M3,      // m³/d/psi → STB/d/psi
  }), [p]);

  const Q_clean_m3d = sim.Q_op_clean ? +(sim.Q_op_clean * STB_TO_M3).toFixed(1) : null;
  const Q_deg_m3d   = sim.Q_op_deg   ? +(sim.Q_op_deg   * STB_TO_M3).toFixed(1) : null;

  const groups = [
    { label: "YACIMIENTO", color: "#38BDF8",
      items: [
        <SliderParam label="Pr — Presión estática (psi)" min={500} max={7000} step={100} value={p.Pr} onChange={v=>set("Pr",v)} color="#38BDF8" />,
        <SliderParam label="Pb — Presión burbuja (psi)"  min={100} max={p.Pr-100} step={50} value={p.Pb} onChange={v=>set("Pb",v)} color="#FBBF24" />,
        <SliderParam label="IP — Índice productividad"   min={0.03} max={1.59} step={0.01} value={p.IP} onChange={v=>set("IP",v)} color="#38BDF8" fmt={v=>`${v.toFixed(2)} m³/d/psi`} />,
      ]
    },
    { label: "HIDRÁULICA", color: "#34D399",
      items: [
        <SliderParam label="Profundidad (m)" min={500} max={4500} step={50} value={p.depth_m} onChange={v=>set("depth_m",v)} color="#34D399" fmt={v=>`${v} m`} />,
        <SliderParam label="Pwh — Presión cabezal (psi)" min={50} max={800} step={25} value={p.Pwh} onChange={v=>set("Pwh",v)} color="#34D399" fmt={v=>`${v} psi`} />,
        <SliderParam label="Frecuencia VSD (Hz)" min={35} max={70} step={1} value={p.freq} onChange={v=>set("freq",v)} color="#F472B6" fmt={v=>`${v} Hz`} />,
        <SliderParam label="Densidad fluido (kg/L)" min={0.75} max={1.10} step={0.005} value={p.rho_kgL} onChange={v=>set("rho_kgL",v)} color="#34D399" fmt={v=>`${v} kg/L`} />,
      ]
    },
    { label: "GAS / FLUIDO", color: "#A78BFA",
      items: [
        <SliderParam label="GOR (m³/m³)" min={0} max={5000} step={25} value={p.GOR} onChange={v=>set("GOR",v)} color="#A78BFA" fmt={v=>`${v} m³/m³`} />,
        <SliderParam label="T° fondo (°C)" min={49} max={138} step={2} value={p.T_F} onChange={v=>set("T_F",v)} color="#A78BFA" fmt={v=>`${v}°C`} />,
        <SliderParam label="Viscosidad (cp)" min={1} max={150} step={1} value={p.mu} onChange={v=>set("mu",v)} color="#A78BFA" fmt={v=>`${v} cp`} />,
        <Param label="Separador" accentColor="#A78BFA">
          <BtnGroup options={SEP_OPTS} value={p.separator} onChange={v=>set("separator",v)} color="#A78BFA" />
        </Param>,
      ]
    },
    { label: "ELÉCTRICO", color: "#F472B6",
      items: [
        <Param label="Calibre cable (AWG)" accentColor="#F472B6">
          <BtnGroup options={AWG_OPTS.map(v=>[v,`#${v}`])} value={p.AWG} onChange={v=>set("AWG",v)} color="#F472B6" />
        </Param>,
        <SliderParam label="Corriente motor (A)" min={20} max={200} step={5} value={p.I_amps} onChange={v=>set("I_amps",v)} color="#F472B6" fmt={v=>`${v} A`} />,
        <Param label="Clase aislamiento" accentColor="#F472B6">
          <BtnGroup options={T_RAT_OPTS.map(([t,l])=>[t,`${l}(${t}°C)`])} value={p.T_rated} onChange={v=>set("T_rated",v)} color="#F472B6" />
        </Param>,
        <Param label="Topología VSD" accentColor="#F472B6">
          <BtnGroup options={VSD_OPTS} value={p.vsd_topo} onChange={v=>set("vsd_topo",v)} color="#F472B6" />
        </Param>,
      ]
    },
    { label: "CONFIABILIDAD", color: "#FB923C",
      items: [
        <Param label="Ambiente operativo" accentColor="#FB923C">
          <BtnGroup options={ENV_OPTS} value={p.bench_env} onChange={v=>set("bench_env",v)} color="#FB923C" />
        </Param>,
      ]
    },
  ];

  return (
    <div style={{ display: "flex", gap: 16 }}>

      {/* ── Controles (accordion) ── */}
      <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 10 }}>
        {groups.map(grp => (
          <div key={grp.label} style={{ background: C.surface, borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 8, color: grp.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>
              {grp.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {grp.items}
            </div>
          </div>
        ))}
      </div>

      {/* ── Dashboard ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* KPI row: producción */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          <KPI label="Q operativo (limpio)"   value={Q_clean_m3d}  unit="m³/d"  color="#38BDF8" sub={`Pwf=${sim.Pwf_op_clean?.toFixed(0)||"—"} psi`} />
          <KPI label="Q operativo (efectivo)" value={Q_deg_m3d}    unit="m³/d"  color={sim.Q_drop_pct > 20 ? C.danger : sim.Q_drop_pct > 10 ? C.warn : C.ok}
            sub={sim.Q_drop_pct ? `↓${sim.Q_drop_pct}% por gas/visc` : "—"} />
          <KPI label="AOF"                    value={+(sim.AOF*STB_TO_M3).toFixed(0)} unit="m³/d" color={C.muted} sub="caudal máximo teórico" />
          <KPI label="f_H total"              value={sim.f_H.toFixed(2)} unit="" color={sim.f_H < 0.75 ? C.danger : sim.f_H < 0.90 ? C.warn : C.ok} sub="degradación H-Q" />
        </div>

        {/* KPI row: hidráulica + gas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          <KPI label="TDH requerido"    value={sim.TDH_m}         unit="m"    color="#34D399" />
          <KPI label="Etapas"           value={sim.N_stages}       unit=""     color="#34D399" sub="N° etapas bomba" />
          <KPI label="GVF bomba"        value={(sim.GVF_pump*100).toFixed(1)} unit="%" color={sim.GVF_pump>0.15?C.danger:sim.GVF_pump>0.10?C.warn:C.ok} />
          <KPI label="V_drop cable"     value={sim.cable?.pct_drop} unit="%"  color={sim.cable?.danger_10pct?C.danger:sim.cable?.warning_5pct?C.warn:C.ok} />
        </div>

        {/* KPI row: eléctrico + confiabilidad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          <KPI label="Vida aislamiento" value={sim.arrh?.pct_life_remaining} unit="%" color={sim.arrh?.warning?C.warn:C.ok} sub={`T_motor≈${sim.T_bot_C}°C`} />
          <KPI label="THD"              value={sim.thd?.THD_pct}  unit="%"    color={sim.thd?.complies_ieee519?C.ok:C.warn} sub={sim.thd?.complies_ieee519?"✓ IEEE 519":"✗ IEEE 519"} />
          <KPI label="R(1 año)"         value={(sim.R_1y*100).toFixed(1)} unit="%" color={sim.R_1y>0.5?C.ok:sim.R_1y>0.3?C.warn:C.danger} sub={`MTBF ref: ${sim.MTBF_ref}d`} />
          <KPI label="R(2 años)"        value={(sim.R_2y*100).toFixed(1)} unit="%" color={sim.R_2y>0.3?C.ok:sim.R_2y>0.15?C.warn:C.danger} />
        </div>

        {/* Gráfica principal IPR / VLP */}
        <div style={{ background: C.surfAlt, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 8 }}>
            Análisis Nodal Integrado — IPR / VLP limpia / VLP efectiva (con degradación gas+viscosidad)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sim.chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="Q" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                tickFormatter={v => Math.round(v * STB_TO_M3)}
                label={{ value: "Q [m³/d]", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
              <YAxis domain={[0, p.Pr]} tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                label={{ value: "Pwf [psi]", angle: -90, position: "insideLeft", fill: C.muted, fontSize: 8 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, n) => [`${v} psi`, n]} labelFormatter={v => `Q = ${(+v * STB_TO_M3).toFixed(1)} m³/d`} />
              <ReferenceLine y={p.Pb} stroke="#FBBF24" strokeDasharray="3 2"
                label={{ value: "Pb", fill: "#FBBF24", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
              <Line type="monotone" dataKey="IPR"       name="IPR"          stroke="#38BDF8" strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
              <Line type="monotone" dataKey="VLP_clean" name="VLP Limpia"   stroke="#34D399" strokeWidth={2}   dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="VLP_deg"   name="VLP Efectiva" stroke="#EF4444" strokeWidth={2}   dot={false} isAnimationActive={false} strokeDasharray="6 3" />
              {sim.Q_op_clean && (
                <ReferenceLine x={sim.Q_op_clean} stroke="#34D399" strokeDasharray="3 2" />
              )}
              {sim.Q_op_deg && (
                <ReferenceLine x={sim.Q_op_deg} stroke="#EF4444" strokeDasharray="3 2" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>ALERTAS INTEGRADAS</div>
          {sim.alerts.map((a, i) => <AlertRow key={i} {...a} />)}
        </div>
      </div>
    </div>
  );
}

// ─── Tab C: Comparación ───────────────────────────────────────────────────────
const SCENARIOS = {
  A: {
    label: "Escenario A — Nominal",
    color: "#34D399",
    desc: "Pozo en condiciones ideales. Fluido limpio, baja temperatura, cable correcto, VSD AFE.",
    params: { Pr:3500, Pb:1600, IP:2.0, depth_m:1800, Pwh:150, freq:60, rho_kgL:0.876,
              GOR:80, T_F:160, separator:"none", mu:3, AWG:2, I_amps:75, T_rated:180,
              vsd_topo:"afe", bench_env:"env_moderate" },
  },
  B: {
    label: "Escenario B — Degradado",
    color: "#EF4444",
    desc: "Pozo con alto GOR, temperatura elevada, cable delgado, VSD estándar.",
    params: { Pr:3200, Pb:2000, IP:1.5, depth_m:2200, Pwh:180, freq:62, rho_kgL:0.890,
              GOR:800, T_F:210, separator:"ags_passive", mu:25, AWG:8, I_amps:95, T_rated:180,
              vsd_topo:"standard_6pulse", bench_env:"env_severe" },
  },
};

function TabComparacion() {
  const simA = useMemo(() => computeSystem(SCENARIOS.A.params), []);
  const simB = useMemo(() => computeSystem(SCENARIOS.B.params), []);

  const Q_A = simA.Q_op_clean ? +(simA.Q_op_clean * STB_TO_M3).toFixed(0) : "—";
  const Q_B = simB.Q_op_deg   ? +(simB.Q_op_deg   * STB_TO_M3).toFixed(0) : "Sin op.";
  const Q_A_eff = simA.Q_op_deg   ? +(simA.Q_op_deg   * STB_TO_M3).toFixed(0) : Q_A;
  const Q_B_eff = simB.Q_op_deg   ? +(simB.Q_op_deg   * STB_TO_M3).toFixed(0) : "Sin op.";

  const rows = [
    { label: "Q operativo limpio",     a: `${Q_A} m³/d`,                         b: `${Q_B} m³/d`,              module: "M1" },
    { label: "Q operativo efectivo",   a: `${Q_A_eff} m³/d`,                      b: `${Q_B_eff} m³/d`,          module: "M1+M3" },
    { label: "AOF",                    a: `${+(simA.AOF*STB_TO_M3).toFixed(0)} m³/d`, b: `${+(simB.AOF*STB_TO_M3).toFixed(0)} m³/d`, module: "M1" },
    { label: "TDH requerido",          a: `${simA.TDH_m} m`,                      b: `${simB.TDH_m} m`,          module: "M2" },
    { label: "Etapas estimadas",       a: `${simA.N_stages}`,                     b: `${simB.N_stages}`,         module: "M2" },
    { label: "GVF bomba",              a: `${(simA.GVF_pump*100).toFixed(1)}%`,   b: `${(simB.GVF_pump*100).toFixed(1)}%`, module: "M3" },
    { label: "f_H total",              a: `${simA.f_H.toFixed(3)}`,               b: `${simB.f_H.toFixed(3)}`,   module: "M3" },
    { label: "V_drop cable",           a: `${simA.cable?.pct_drop}%`,             b: `${simB.cable?.pct_drop}%`, module: "M4" },
    { label: "Vida aislamiento",       a: `${simA.arrh?.pct_life_remaining}%`,    b: `${simB.arrh?.pct_life_remaining}%`, module: "M4" },
    { label: "THD",                    a: `${simA.thd?.THD_pct}%`,               b: `${simB.thd?.THD_pct}%`,    module: "M4" },
    { label: "IEEE 519",               a: simA.thd?.complies_ieee519 ? "✓ Cumple" : "✗ No cumple", b: simB.thd?.complies_ieee519 ? "✓ Cumple" : "✗ No cumple", module: "M4" },
    { label: "T° motor estimada",      a: `${simA.T_bot_C}°C`,                   b: `${simB.T_bot_C}°C`,        module: "M4+M5" },
    { label: "MTBF referencia",        a: `${simA.MTBF_ref} d`,                  b: `${simB.MTBF_ref} d`,       module: "M7" },
    { label: "R(1 año)",               a: `${(simA.R_1y*100).toFixed(1)}%`,      b: `${(simB.R_1y*100).toFixed(1)}%`, module: "M7" },
    { label: "R(2 años)",              a: `${(simA.R_2y*100).toFixed(1)}%`,      b: `${(simB.R_2y*100).toFixed(1)}%`, module: "M7" },
  ];

  const isWorse = (a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (isNaN(numA) || isNaN(numB)) return false;
    return numB < numA;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Scenario headers */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {Object.values(SCENARIOS).map(sc => (
          <div key={sc.label} style={{ background: sc.color + "0C", border: `1px solid ${sc.color}40`, borderRadius: 8, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: sc.color, fontFamily: "JetBrains Mono, monospace", marginBottom: 6 }}>{sc.label}</div>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>{sc.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabla comparativa */}
      <div style={{ background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 60px 1fr 1fr", background: "#0D1424", padding: "8px 14px", borderBottom: `1px solid ${C.border}` }}>
          {["Métrica", "Módulo", "Escenario A — Nominal", "Escenario B — Degradado"].map((h, i) => (
            <div key={i} style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, textTransform: "uppercase" }}>{h}</div>
          ))}
        </div>
        {rows.map((row, i) => {
          const worse = isWorse(row.a, row.b);
          return (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "160px 60px 1fr 1fr",
              padding: "7px 14px",
              borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? "transparent" : "#0D142420",
            }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{row.label}</div>
              <div style={{ fontSize: 8, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>{row.module}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#34D399", fontFamily: "JetBrains Mono, monospace" }}>{row.a}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: worse ? C.danger : C.warn, fontFamily: "JetBrains Mono, monospace" }}>{row.b}</div>
            </div>
          );
        })}
      </div>

      {/* Alertas comparativas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[{ sim: simA, sc: SCENARIOS.A }, { sim: simB, sc: SCENARIOS.B }].map(({ sim, sc }) => (
          <div key={sc.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 9, color: sc.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{sc.label}</div>
            {sim.alerts.map((a, i) => <AlertRow key={i} {...a} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab D: Evaluación ───────────────────────────────────────────────────────
function TabEvaluacion() {
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const select = (qId, optId) => { if (!result) setAnswers(p => ({ ...p, [qId]: optId })); };
  const submit = () => setResult(gradeM8(M8_QUESTIONS.map(q => ({ id: q.id, selected: answers[q.id] || "" }))));
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
              {result.pct >= 80
                ? "Excelente. Dominás el análisis integrado del sistema BES. SIMBES completado."
                : result.pct >= 60
                ? "Buena base. Revisá las interacciones entre módulos (M1↔M3, M3↔M4, M7)."
                : "Repasá el flujo de diseño integrado y cómo cada módulo afecta a los demás."}
            </div>
          </div>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${ACCENT_B}`, background: ACCENT_B + "22", color: ACCENT_B, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>Reintentar</button>
        </div>
      )}

      {M8_QUESTIONS.map((q, qi) => {
        const res = result?.results.find(r => r.id === q.id);
        return (
          <div key={q.id} style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.text, fontFamily: "JetBrains Mono, monospace", marginBottom: 12, lineHeight: 1.6 }}>
              <span style={{ color: ACCENT_B, fontWeight: 700 }}>{qi + 1}. </span>{q.text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map(opt => {
                const selected  = answers[q.id] === opt.id;
                const isCorrect = res && opt.id === q.correct;
                const isWrong   = res && selected && !isCorrect;
                const color = isCorrect ? C.ok : isWrong ? C.danger : selected ? ACCENT_B : C.border;
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
                💡 {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!result && (
        <button onClick={submit} disabled={Object.keys(answers).length < M8_QUESTIONS.length} style={{
          padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: `1px solid ${ACCENT_B}`, background: ACCENT_B + "22", color: ACCENT_B,
          cursor: Object.keys(answers).length < M8_QUESTIONS.length ? "not-allowed" : "pointer",
          opacity: Object.keys(answers).length < M8_QUESTIONS.length ? 0.5 : 1,
          fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
        }}>
          CALIFICAR ({Object.keys(answers).length}/{M8_QUESTIONS.length} respondidas)
        </button>
      )}
    </div>
  );
}

// ─── Tab E: Modo Plan (Arps) ──────────────────────────────────────────────────
const PLAN_SYS_DEFAULT = {
  Pb: 1600, IP: 0.32, depth_m: 1800, Pwh: 150, freq: 60, rho_kgL: 0.876,
  GOR: 45, T_F: 85, separator: "none", mu: 5,
  AWG: 4, I_amps: 80, T_rated: 180, vsd_topo: "standard_6pulse", bench_env: "env_moderate",
};
const PLAN_ARPS_DEFAULT = { qi_m3d: 120, Di_month: 0.06, b: 0.5, N_months: 24 };

function TabPlan() {
  const [arps, setArps] = useState(PLAN_ARPS_DEFAULT);
  const [sys,  setSys]  = useState(PLAN_SYS_DEFAULT);
  const setA = (k, v) => setArps(p => ({ ...p, [k]: v }));
  const setS = (k, v) => setSys(p => ({ ...p, [k]: v }));

  const timeData = useMemo(() => {
    const sysConverted = {
      ...sys,
      GOR: sys.GOR * 5.6146,        // m³/m³ → scf/STB
      T_F: sys.T_F * 9 / 5 + 32,   // °C → °F
      IP:  sys.IP / STB_TO_M3,      // m³/d/psi → STB/d/psi
      Pr:  99999,                    // placeholder — findPrForRate lo reemplaza
    };
    return computePlanTimeSeries(arps, sysConverted);
  }, [arps, sys]);

  const gasLockMonth  = timeData.find(d => d.GVF > 15)?.t;
  const vibAlertMonth = timeData.find(d => d.vib > 4)?.t;
  const lowRMonth     = timeData.find(d => d.R < 50)?.t;

  const axisProps = {
    tick: { fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" },
  };
  const ttp = { contentStyle: TOOLTIP_STYLE, labelFormatter: v => `Mes ${v}` };

  return (
    <div style={{ display: "flex", gap: 16 }}>

      {/* ── Controles ── */}
      <div style={{ width: 224, display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>

        {/* Arps */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 12, border: `1px solid #A78BFA44` }}>
          <div style={{ fontSize: 8, color: "#A78BFA", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>CURVA DE ARPS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SliderParam label="q_i — Caudal inicial"  min={10}   max={500}  step={5}    value={arps.qi_m3d}    onChange={v=>setA("qi_m3d",v)}    color="#A78BFA" fmt={v=>`${v} m³/d`} />
            <SliderParam label="Dᵢ — Decline (/mes)"   min={0.01} max={0.20} step={0.01} value={arps.Di_month}  onChange={v=>setA("Di_month",v)}  color="#A78BFA" fmt={v=>`${v.toFixed(2)}/mes`} />
            <SliderParam label="b — Exponente"         min={0}    max={1}    step={0.05} value={arps.b}          onChange={v=>setA("b",v)}          color="#A78BFA" fmt={v=>`${v.toFixed(2)} ${v<0.05?"(Exp.)":v>0.95?"(Arm.)":"(Hip.)"}`} />
            <SliderParam label="Horizonte"             min={6}    max={60}   step={6}    value={arps.N_months}  onChange={v=>setA("N_months",v)}  color="#A78BFA" fmt={v=>`${v} meses`} />
          </div>
        </div>

        {/* Sistema BES */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 8, color: "#38BDF8", fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>SISTEMA BES</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SliderParam label="Pb — Presión burbuja (psi)"  min={100}  max={4000} step={50}   value={sys.Pb}      onChange={v=>setS("Pb",v)}      color="#FBBF24" fmt={v=>`${v} psi`} />
            <SliderParam label="IP — Índice productividad"   min={0.03} max={1.59} step={0.01} value={sys.IP}      onChange={v=>setS("IP",v)}      color="#38BDF8" fmt={v=>`${v.toFixed(2)} m³/d/psi`} />
            <SliderParam label="Profundidad (m)"             min={500}  max={4500} step={50}   value={sys.depth_m} onChange={v=>setS("depth_m",v)} color="#34D399" fmt={v=>`${v} m`} />
            <SliderParam label="Frecuencia VSD (Hz)"         min={35}   max={70}   step={1}    value={sys.freq}    onChange={v=>setS("freq",v)}    color="#F472B6" fmt={v=>`${v} Hz`} />
            <SliderParam label="GOR (m³/m³)"                 min={0}    max={5000} step={25}   value={sys.GOR}     onChange={v=>setS("GOR",v)}     color="#A78BFA" fmt={v=>`${v} m³/m³`} />
          </div>
        </div>

        {/* Eventos clave */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 8, color: C.warn, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>EVENTOS CLAVE</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <EventBadge label="Gas lock (GVF > 15%)"  month={gasLockMonth} />
            <EventBadge label="Vibración > 4 mm/s"    month={vibAlertMonth} />
            <EventBadge label="R(t) cae < 50%"        month={lowRMonth} />
          </div>
        </div>

        {/* Leyenda física */}
        <div style={{ background: C.surface, borderRadius: 8, padding: 10, border: `1px solid ${C.border}`, fontSize: 8, color: "#475569", fontFamily: "JetBrains Mono, monospace", lineHeight: 1.8 }}>
          <div style={{ color: C.muted, fontWeight: 700, marginBottom: 4 }}>MÉTODO</div>
          Arps → q(t) → bisección Pr(t) → nodal → variables operativas.
          Vibración: proxy BEP [SIMPLIFIED].
          Corriente: % del BEP (I ∝ Q/Q_BEP).
        </div>
      </div>

      {/* ── Gráficas ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>

        {/* Producción */}
        <ChartBlock title="Producción — Q nodal vs. Arps de referencia [m³/d]" height={180}>
          <LineChart data={timeData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="t" {...axisProps} label={{ value: "Meses", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
            <YAxis {...axisProps} />
            <Tooltip {...ttp} formatter={(v, n) => [`${v} m³/d`, n]} />
            <Line type="monotone" dataKey="Q"      name="Q real (nodal)" stroke="#38BDF8" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="q_arps" name="Arps (ref.)"    stroke="#38BDF8" strokeWidth={1}   dot={false} isAnimationActive={false} strokeDasharray="5 3" />
            {gasLockMonth !== undefined && <ReferenceLine x={gasLockMonth} stroke={C.danger} strokeDasharray="3 2" label={{ value: "gas lock", fill: C.danger, fontSize: 7, fontFamily: "JetBrains Mono, monospace" }} />}
          </LineChart>
        </ChartBlock>

        {/* Pwf / Sumergencia */}
        <ChartBlock title="Pwf en bomba / Sumergencia [psi]" height={160}>
          <LineChart data={timeData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="t" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip {...ttp} formatter={(v, n) => [`${v} psi`, n]} />
            <ReferenceLine y={sys.Pb} stroke="#FBBF24" strokeDasharray="4 2" label={{ value: "Pb", fill: "#FBBF24", fontSize: 8, fontFamily: "JetBrains Mono, monospace" }} />
            <Line type="monotone" dataKey="Pwf" name="Pwf (PIP)" stroke="#34D399" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ChartBlock>

        {/* GVF + Corriente + Vibración */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>

          <ChartBlock title="GVF en bomba [%]" height={170}>
            <LineChart data={timeData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 30]} />
              <Tooltip {...ttp} formatter={v => [`${v}%`, "GVF"]} />
              <ReferenceLine y={15} stroke={C.danger} strokeDasharray="3 2" label={{ value: "lock", fill: C.danger, fontSize: 7 }} />
              <Line type="monotone" dataKey="GVF" stroke="#A78BFA" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartBlock>

          <ChartBlock title="Corriente — % BEP" height={170}>
            <LineChart data={timeData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 140]} />
              <Tooltip {...ttp} formatter={v => [`${v}%`, "I/I_bep"]} />
              <ReferenceLine y={68}  stroke={C.warn} strokeDasharray="3 2" />
              <ReferenceLine y={100} stroke={C.ok}   strokeDasharray="3 2" />
              <ReferenceLine y={132} stroke={C.warn} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="I_pct" stroke="#F472B6" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartBlock>

          <ChartBlock title="Vibración proxy [mm/s RMS]" height={170}>
            <LineChart data={timeData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" {...axisProps} />
              <YAxis {...axisProps} domain={[0, 12]} />
              <Tooltip {...ttp} formatter={v => [`${v} mm/s`, "Vibración"]} />
              <ReferenceLine y={4} stroke={C.warn}   strokeDasharray="3 2" label={{ value: "alerta", fill: C.warn, fontSize: 7 }} />
              <ReferenceLine y={8} stroke={C.danger} strokeDasharray="3 2" />
              <Line type="monotone" dataKey="vib" stroke="#FBBF24" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ChartBlock>
        </div>

        {/* Confiabilidad */}
        <ChartBlock title="Confiabilidad R(t) — distribución exponencial [%]" height={150}>
          <LineChart data={timeData} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="t" {...axisProps} label={{ value: "Meses", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
            <YAxis {...axisProps} domain={[0, 100]} />
            <Tooltip {...ttp} formatter={v => [`${v}%`, "R(t)"]} />
            <ReferenceLine y={50}   stroke={C.warn}  strokeDasharray="3 2" label={{ value: "50%", fill: C.warn,  fontSize: 7, fontFamily: "JetBrains Mono, monospace" }} />
            <ReferenceLine y={36.8} stroke={C.muted} strokeDasharray="2 4" label={{ value: "e⁻¹", fill: C.muted, fontSize: 7, fontFamily: "JetBrains Mono, monospace" }} />
            <Line type="monotone" dataKey="R" name="R(t)" stroke="#FB923C" strokeWidth={2} dot={false} isAnimationActive={false} />
            {lowRMonth !== undefined && <ReferenceLine x={lowRMonth} stroke={C.danger} strokeDasharray="3 2" />}
          </LineChart>
        </ChartBlock>

      </div>
    </div>
  );
}

// ─── Root Module8 ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "teoria",    label: "A — Diseño Integrado" },
  { id: "sim",       label: "B — Constructor" },
  { id: "comparar",  label: "C — Comparación" },
  { id: "eval",      label: "D — Evaluación" },
  { id: "plan",      label: "E — Modo Plan · Arps" },
];

export default function Module8({ onBack }) {
  const [tab, setTab] = useState("teoria");
  return (
    <div style={{ fontFamily: C.fontUI, background: C.bg, minHeight: "100vh", color: C.text, padding: "24px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", color: C.muted, cursor: "pointer", fontSize: 10, fontFamily: C.fontUI }}>← Hub</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: ACCENT, fontWeight: 800, fontFamily: C.font }}>M08</span>
            <span style={{ fontSize: 21, fontWeight: 800, color: "#F1F5F9", fontFamily: C.fontUI }}>Constructor de Escenarios</span>
          </div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>Integración M1–M7 · Modo Libre · Análisis Cruzado</div>
        </div>
        <span style={{ fontSize: 9, color: C.ok, background: C.ok + "18", padding: "2px 10px", borderRadius: 10, border: `1px solid ${C.ok}30`, fontFamily: C.fontUI }}>✅ Disponible</span>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 40, zIndex: 100, background: C.bg, paddingTop: 8 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", border: "none", borderRadius: "6px 6px 0 0",
            background: tab === t.id ? ACCENT_B + "18" : "transparent",
            borderBottom: tab === t.id ? `2px solid ${ACCENT_B}` : "2px solid transparent",
            color: tab === t.id ? ACCENT_B : C.muted,
            cursor: "pointer", fontSize: 10, fontFamily: C.fontUI,
            fontWeight: tab === t.id ? 700 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "teoria"   && <TabTeoria />}
      {tab === "sim"      && <TabSimulador />}
      {tab === "comparar" && <TabComparacion />}
      {tab === "eval"     && <TabEvaluacion />}
      {tab === "plan"     && <TabPlan />}
    </div>
  );
}
