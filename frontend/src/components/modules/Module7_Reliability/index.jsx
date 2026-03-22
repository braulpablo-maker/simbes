/**
 * SIMBES — Módulo 7: Confiabilidad y MTBF
 * =========================================
 * Física: distribución exponencial, datos censurados, intervalos Chi².
 * @ref Nelson (1982) — Applied Life Data Analysis
 * @ref Meeker & Escobar (1998) — Statistical Methods for Reliability Data
 */
import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, ErrorBar,
} from "recharts";
import {
  survivalProb,
  survivalCurve,
  mtbfMLE,
  chi2ConfidenceInterval,
  survivalBiasCheck,
} from "../../../physics/reliability";
import BENCHMARKS_DATA from "../../../data/mtbf-benchmarks.json";
import { M7_QUESTIONS, gradeM7 } from "../../../pedagogy/evaluations/m7";
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M7 } from './teoria-data';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ACCENT = "#FB923C";
import { C } from '../../../theme';
const BENCHMARKS = BENCHMARKS_DATA.benchmarks;

const BENCH_COLORS = ["#22C55E", "#38BDF8", "#F59E0B", "#EF4444"];

const TOOLTIP_STYLE = {
  background: "#0D1424", border: "1px solid #1E293B",
  fontSize: 10, color: "#CBD5E1", fontFamily: "JetBrains Mono, monospace",
};

// ─── Micro-componentes ────────────────────────────────────────────────────────
function KPI({ label, value, unit, color, sub }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${color}30`, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
        {value}<span style={{ fontSize: 10, fontWeight: 400, marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function ICBar({ lower, upper, mle, label }) {
  const total = upper * 1.15;
  const lowerPct = (lower / total) * 100;
  const mlePct   = (mle   / total) * 100;
  const upperPct = (upper / total) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{label}</div>
      <div style={{ position: "relative", height: 20, borderRadius: 4, background: "#1E293B" }}>
        {/* IC range */}
        <div style={{
          position: "absolute",
          left: `${lowerPct}%`,
          width: `${upperPct - lowerPct}%`,
          height: "100%",
          background: ACCENT + "30",
          border: `1px solid ${ACCENT}60`,
          borderRadius: 4,
        }} />
        {/* MLE marker */}
        <div style={{
          position: "absolute",
          left: `${mlePct}%`,
          width: 3,
          height: "100%",
          background: ACCENT,
          borderRadius: 1,
          transform: "translateX(-50%)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
        <span style={{ color: C.ok }}>▼ {lower} d</span>
        <span style={{ color: ACCENT }}>MLE: {mle} d</span>
        <span style={{ color: C.warn }}>▲ {upper} d</span>
      </div>
    </div>
  );
}

// ─── Tab A: Teoría ────────────────────────────────────────────────────────────
const TEORIA_SECTIONS = [
  {
    id: "exponencial", title: "Distribución Exponencial",
    body: `La distribución exponencial modela el tiempo entre fallas cuando
la tasa de falla λ es CONSTANTE (independiente del tiempo transcurrido).

  R(t) = P(T > t) = e^(−t/MTBF) = e^(−λt)

  donde λ = 1/MTBF = tasa de falla [fallas/día]

Propiedades fundamentales:
  MTBF = valor esperado = 1/λ
  Mediana = MTBF × ln(2) ≈ 0.693 × MTBF
  Varianza = MTBF²

Resultado clave — R(MTBF):
  R(MTBF) = e^(−1) ≈ 0.3679 = 36.77%

  Al cumplir el MTBF, solo el 36.77% de los equipos
  siguen operativos. El 63.23% ya falló.

IMPORTANTE: el MTBF NO es el "tiempo garantizado de operación".
Es el valor promedio — la mitad de los equipos falla ANTES
de 0.693 × MTBF (la mediana).`,
  },
  {
    id: "censurados", title: "Datos Censurados",
    body: `Un equipo se llama "censurado" cuando fue observado durante
un tiempo t_c sin fallar, pero no se sabe cuándo habría fallado.

Tipos de censura:
  Tipo I:   observación truncada a tiempo fijo
            (extracción planeada, fin de contrato)
  Tipo II:  truncada al acumular r fallas de n equipos
            (ensayos de laboratorio acelerados)

Sesgo de sobrevivencia inverso:
  Ignorar los censurados produce MTBF artificialmente BAJO.
  Los equipos que "sobreviven" son los más confiables —
  excluirlos supone que todos habrían fallado a t_c.

Estimador MLE correcto con censurados:
  MTBF_MLE = T_total / r

  T_total = Σ t_fallas + Σ t_censurados
  r       = número de fallas (solo las fallas, no censurados)

Intuitivamente: acumulás TODO el tiempo de observación
en el denominador, pero solo contás las fallas reales.`,
  },
  {
    id: "chi2", title: "Intervalos de Confianza Chi²",
    body: `Con pocas fallas (r < 20), el MTBF_MLE tiene alta incertidumbre.
Los intervalos de confianza (IC) cuantifican esa incertidumbre.

Para distribución exponencial (Nelson, 1982):

  MTBF_lower = 2T / χ²(1−α/2 , 2r+2)
  MTBF_upper = 2T / χ²(α/2   , 2r)

  α = nivel de significancia (0.10 para IC 90%)
  T = tiempo total acumulado

Interpretación:
  Con IC 90%, el MTBF real está entre [lower, upper]
  con probabilidad del 90%.

  El límite INFERIOR es el número de gestión:
  → es el peor caso razonable a usar en planificación.
  → "Con 90% de confianza, el MTBF real es al menos X días."

Regla práctica: con r < 5 fallas, el IC es tan amplio
que la decisión debe basarse en el límite inferior,
no en el MTBF_MLE.`,
  },
  {
    id: "benchmarks", title: "Benchmarks de MTBF por Ambiente",
    body: `MTBF de referencia de la industria BES (pedagógico):

  BENIGNO       : 1825 d (5 años)
  Petróleo limpio, < 120°C, sin corrosión
  → Mejores prácticas + VSD calibrado + monitoreo

  MODERADO      : 913 d (2.5 años)
  Agua de corte 50–80%, GOR < 500, T 120–150°C
  → Inhibición química + IR mensual

  SEVERO        : 365 d (1 año)
  GOR > 1000, T > 150°C, H₂S o CO₂
  → Materiales NACE + AGS + IR semanal

  ARENA         : 180 d (0.5 años)
  Arena > 50 ppm
  → Drawdown controlado + inspección frecuente

Cálculo de R(t) según ambiente:
  Benigno  → R(365 d) = e^(−365/1825) = 82%
  Moderado → R(365 d) = e^(−365/913)  = 67%
  Severo   → R(365 d) = e^(−365/365)  = 37%
  Arena    → R(365 d) = e^(−365/180)  = 13%`,
  },
  {
    id: "glosario", title: "Glosario M7",
    body: `MTBF  — Mean Time Between Failures: tiempo medio entre fallas
λ     — tasa de falla (fallas/día = 1/MTBF)
R(t)  — función de supervivencia (probabilidad de sobrevivir a t)
F(t)  — función de falla = 1 − R(t)
Mediana — tiempo en que falla el 50%: MTBF × ln(2) ≈ 0.693 × MTBF
MLE   — Maximum Likelihood Estimator: estimador de máxima verosimilitud
IC    — Intervalo de Confianza
Dato censurado — equipo observado sin falla hasta tiempo t_c
Censura Tipo I  — observación truncada a tiempo fijo
Censura Tipo II — observación truncada a r fallas de n equipos
Chi²  — distribución ji cuadrada; se usa para IC del MTBF exponencial
Sesgo de sobrevivencia — subestimar el MTBF al ignorar censurados
Drawdown — presión diferencial entre estático y fluyente (Pr − Pwf)`,
  },
];

function TabTeoria() {
  return <TheoryLayout sections={TEORIA_M7} accentColor="#A78BFA" />;
}

// ─── Tab B: Simulador ────────────────────────────────────────────────────────
function TabSimulador() {
  const [mode,      setMode]     = useState("curva");    // 'curva' | 'estimacion'
  const [MTBF,      setMTBF]     = useState(913);        // días
  const [t_query,   setTQuery]   = useState(365);        // días
  const [r,         setR]        = useState(3);           // fallas
  const [T_total,   setTTotal]   = useState(4800);       // días acum
  const [alpha,     setAlpha]    = useState(0.10);       // 0.05|0.10|0.20
  const [benchId,   setBenchId]  = useState("env_moderate");

  const bench = BENCHMARKS.find(b => b.id === benchId) || BENCHMARKS[1];

  // ── Modo Curva ──
  const curva = useMemo(() => {
    const MTBF_use = mode === "curva" ? MTBF : bench.MTBF_days;
    const cv       = survivalCurve(MTBF_use, 300);
    const R_t      = survivalProb(t_query, MTBF_use);
    return { ...cv, R_t, MTBF_use };
  }, [mode, MTBF, bench, t_query]);

  // ── Modo Estimación ──
  const est = useMemo(() => {
    if (mode !== "estimacion") return null;
    const mle  = mtbfMLE([...Array(r)].map((_, i) => T_total / (r + 1) * (i + 0.9)), []);
    // Simplified: usamos MTBF = T_total / r directamente
    const MTBF_mle = T_total / r;
    const ic   = chi2ConfidenceInterval(T_total, r, alpha);
    const bias = survivalBiasCheck(r, r + Math.max(0, Math.round(r * 0.7)));
    const R_1y = survivalProb(365, MTBF_mle);
    const R_2y = survivalProb(730, MTBF_mle);
    const t_50 = -MTBF_mle * Math.log(0.50);
    const t_90 = -MTBF_mle * Math.log(0.90);
    return { MTBF_mle: +MTBF_mle.toFixed(1), ic, bias, R_1y, R_2y, t_50: +t_50.toFixed(0), t_90: +t_90.toFixed(0) };
  }, [mode, r, T_total, alpha]);

  // Chart data: curva R(t) + IC curvas superior e inferior
  const chartData = useMemo(() => {
    if (mode === "curva") {
      return curva.points.map(p => ({ t: +p.t.toFixed(0), R: +(p.R * 100).toFixed(2) }));
    }
    if (!est) return [];
    const MTBF_mle = est.MTBF_mle;
    const nPts = 250;
    return [...Array(nPts + 1)].map((_, i) => {
      const t = (2.5 * MTBF_mle * i) / nPts;
      return {
        t: +t.toFixed(0),
        MLE:   +(survivalProb(t, MTBF_mle) * 100).toFixed(2),
        Lower: +(survivalProb(t, est.ic.MTBF_lower) * 100).toFixed(2),
        Upper: est.ic.MTBF_upper < 1e9 ? +(survivalProb(t, est.ic.MTBF_upper) * 100).toFixed(2) : 100,
      };
    });
  }, [mode, curva, est]);

  // Datos benchmarks para barchart
  const benchChartData = BENCHMARKS.map((b, i) => ({
    name: b.environment.split(" ")[1] || b.environment,
    MTBF: b.MTBF_days,
    R_1y: +(survivalProb(365, b.MTBF_days) * 100).toFixed(1),
    fill: BENCH_COLORS[i],
  }));

  const R_t_pct   = +(curva.R_t * 100).toFixed(1);
  const t_med_use = +(curva.t_50pct);
  const modeColor = mode === "curva" ? "#38BDF8" : "#A78BFA";

  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* ── Controles ── */}
      <div style={{ width: 230, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Modo */}
        <div style={{ display: "flex", gap: 4 }}>
          {[["curva", "Curva R(t)"], ["estimacion", "Estimar MTBF"]].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: "6px 4px", borderRadius: 6, fontSize: 9, cursor: "pointer",
              background: mode === m ? modeColor + "22" : "transparent",
              border: `1px solid ${mode === m ? modeColor : C.border}`,
              color: mode === m ? modeColor : C.muted,
              fontFamily: "JetBrains Mono, monospace",
            }}>{l}</button>
          ))}
        </div>

        {mode === "curva" && (
          <>
            <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>PARÁMETROS</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>MTBF (días)</div>
                <input type="range" min={90} max={3650} step={30} value={MTBF} onChange={e => setMTBF(+e.target.value)}
                  style={{ accentColor: "#38BDF8", width: "100%" }} />
                <div style={{ fontSize: 13, color: "#38BDF8", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                  {MTBF} d <span style={{ fontSize: 9, color: C.muted }}>({(MTBF / 365).toFixed(1)} años)</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>Tiempo consulta t (días)</div>
                <input type="range" min={30} max={MTBF * 2} step={15} value={Math.min(t_query, MTBF * 2)} onChange={e => setTQuery(+e.target.value)}
                  style={{ accentColor: ACCENT, width: "100%" }} />
                <div style={{ fontSize: 13, color: ACCENT, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
                  {t_query} d <span style={{ fontSize: 9, color: C.muted }}>→ R={R_t_pct}%</span>
                </div>
              </div>
            </div>

            {/* Benchmark selector */}
            <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>REFERENCIA INDUSTRIA</div>
              {BENCHMARKS.map((b, i) => (
                <button key={b.id} onClick={() => { setBenchId(b.id); setMTBF(b.MTBF_days); }} style={{
                  padding: "5px 8px", fontSize: 9, borderRadius: 4, textAlign: "left",
                  background: benchId === b.id ? BENCH_COLORS[i] + "18" : "transparent",
                  border: `1px solid ${benchId === b.id ? BENCH_COLORS[i] : C.border}`,
                  color: benchId === b.id ? BENCH_COLORS[i] : C.muted,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}>
                  {b.environment.split(" ")[0]} {b.environment.split(" ")[1] || ""} · {b.MTBF_days} d
                </button>
              ))}
            </div>
          </>
        )}

        {mode === "estimacion" && (
          <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 9, color: "#A78BFA", letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>DATOS DE CAMPO</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>Fallas observadas (r)</div>
              <input type="range" min={1} max={30} step={1} value={r} onChange={e => setR(+e.target.value)}
                style={{ accentColor: "#A78BFA", width: "100%" }} />
              <div style={{ fontSize: 13, color: "#A78BFA", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{r} fallas</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>T_total acumulado (días)</div>
              <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>fallas + censurados</div>
              <input type="range" min={500} max={30000} step={100} value={T_total} onChange={e => setTTotal(+e.target.value)}
                style={{ accentColor: "#A78BFA", width: "100%" }} />
              <div style={{ fontSize: 13, color: "#A78BFA", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>{T_total.toLocaleString()} d</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>Nivel de confianza IC</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[[0.20, "80%"], [0.10, "90%"], [0.05, "95%"]].map(([a, l]) => (
                  <button key={a} onClick={() => setAlpha(a)} style={{
                    flex: 1, padding: "4px 0", fontSize: 9, borderRadius: 4,
                    background: alpha === a ? "#A78BFA22" : "transparent",
                    border: `1px solid ${alpha === a ? "#A78BFA" : C.border}`,
                    color: alpha === a ? "#A78BFA" : C.muted,
                    cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                  }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel de resultados ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* KPIs */}
        {mode === "curva" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <KPI label="MTBF"     value={MTBF}                  unit="días"   color="#38BDF8" sub={`${(MTBF/365).toFixed(2)} años`} />
            <KPI label={`R(t=${t_query}d)`}  value={R_t_pct}   unit="%"      color={R_t_pct > 50 ? C.ok : R_t_pct > 20 ? C.warn : C.danger} />
            <KPI label="R(MTBF)"  value="36.8"                  unit="%"      color={ACCENT}  sub="e⁻¹ — siempre" />
            <KPI label="Mediana"  value={t_med_use}             unit="días"   color={C.muted} sub="50% falla antes" />
          </div>
        )}

        {mode === "estimacion" && est && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            <KPI label="MTBF MLE"    value={est.MTBF_mle}           unit="días"  color="#A78BFA" />
            <KPI label={`IC ${100-alpha*100}% Lower`} value={est.ic.MTBF_lower} unit="d" color={C.ok}   sub="peor caso accionable" />
            <KPI label={`IC ${100-alpha*100}% Upper`} value={est.ic.MTBF_upper < 99999 ? est.ic.MTBF_upper : "∞"} unit="d" color={C.warn} />
            <KPI label="r fallas"    value={r}                      unit=""      color={C.muted} sub={`T=${T_total}d`} />
          </div>
        )}

        {/* Curva R(t) */}
        <div style={{ background: C.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
              {mode === "curva"
                ? `Curva de Supervivencia R(t) — MTBF=${MTBF} días`
                : `Curva R(t) con IC ${100 - alpha * 100}% — MTBF_MLE=${est?.MTBF_mle} días`}
            </div>
            <div style={{ fontSize: 9, color: ACCENT, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
              R(MTBF) = e⁻¹ = 36.77%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="t" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                label={{ value: "t [días]", position: "insideBottomRight", offset: -5, fill: C.muted, fontSize: 8 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TOOLTIP_STYLE}
                formatter={(v, n) => [`${v}%`, n === "R" ? "R(t)" : n]}
                labelFormatter={v => `t = ${v} días`} />
              {/* Línea R=36.77% */}
              <ReferenceLine y={36.77} stroke={ACCENT} strokeDasharray="4 2"
                label={{ value: "36.77%", fill: ACCENT, fontSize: 8, fontFamily: "JetBrains Mono, monospace", position: "right" }} />
              {/* Línea R=50% (mediana) */}
              <ReferenceLine y={50} stroke={C.muted} strokeDasharray="2 3"
                label={{ value: "50% (mediana)", fill: C.muted, fontSize: 8, fontFamily: "JetBrains Mono, monospace", position: "right" }} />

              {mode === "curva" ? (
                <>
                  <Line type="monotone" dataKey="R" stroke="#38BDF8" strokeWidth={2.5} dot={false} isAnimationActive={false} name="R(t)" />
                  {/* Línea vertical en t_query */}
                  <ReferenceLine x={t_query} stroke={ACCENT} strokeWidth={1.5}
                    label={{ value: `t=${t_query}`, fill: ACCENT, fontSize: 8, fontFamily: "JetBrains Mono, monospace", position: "top" }} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="Upper" stroke={C.ok + "80"}    strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="5 3" name="IC Upper" />
                  <Line type="monotone" dataKey="MLE"   stroke="#A78BFA"        strokeWidth={2.5} dot={false} isAnimationActive={false} name="MLE" />
                  <Line type="monotone" dataKey="Lower" stroke={C.warn + "80"}  strokeWidth={1.5} dot={false} isAnimationActive={false} strokeDasharray="5 3" name="IC Lower" />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* IC Bar + Benchmarks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {mode === "estimacion" && est && (
            <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>INTERVALO DE CONFIANZA {100 - alpha * 100}%</div>
              <ICBar lower={est.ic.MTBF_lower} upper={Math.min(est.ic.MTBF_upper, est.MTBF_mle * 8)} mle={est.MTBF_mle} label="MTBF" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "R(1 año)",    value: `${(est.R_1y*100).toFixed(1)}%`, color: est.R_1y > 0.5 ? C.ok : est.R_1y > 0.2 ? C.warn : C.danger },
                  { label: "R(2 años)",   value: `${(est.R_2y*100).toFixed(1)}%`, color: est.R_2y > 0.3 ? C.ok : est.R_2y > 0.1 ? C.warn : C.danger },
                  { label: "Mediana",     value: `${est.t_50} d`,                 color: C.muted },
                  { label: "t (R=90%)",   value: `${est.t_90} d`,                 color: C.ok },
                ].map((m, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase" }}>{m.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: m.color, fontFamily: "JetBrains Mono, monospace" }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{
                background: C.warn + "08", border: `1px solid ${C.warn}25`, borderRadius: 6, padding: "8px 12px",
                fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6,
              }}>
                <span style={{ color: C.warn, fontWeight: 700 }}>⚠ Sesgo: </span>
                {est.bias.recommendation}
              </div>
            </div>
          )}

          {mode === "curva" && (
            <div style={{ background: C.surfAlt, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>MTBF por ambiente</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={benchChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} />
                  <YAxis tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} />
                  <Tooltip contentStyle={TOOLTIP_STYLE}
                    formatter={(v, n) => [n === "MTBF" ? `${v} días` : `${v}%`, n === "MTBF" ? "MTBF" : "R(1 año)"]} />
                  <Bar dataKey="MTBF" radius={[4, 4, 0, 0]}
                    label={{ position: "top", fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace", formatter: v => `${v}d` }}
                    fill={ACCENT} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* R(1 año) por benchmark */}
          <div style={{ background: C.surfAlt, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>R(365 días) por ambiente</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={benchChartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                  tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, "R(1 año)"]} />
                <ReferenceLine y={36.77} stroke={ACCENT} strokeDasharray="3 2"
                  label={{ value: "36.77%", fill: ACCENT, fontSize: 7, fontFamily: "JetBrains Mono, monospace" }} />
                {benchChartData.map((b, i) => null)}
                <Bar dataKey="R_1y" radius={[4, 4, 0, 0]}
                  label={{ position: "top", fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace", formatter: v => `${v}%` }}>
                  {benchChartData.map((entry, i) => (
                    <rect key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
    title: "Paso 1 — Curva de Supervivencia: Planificación Inicial",
    context: "Campo Colibrí: 18 BES instalados en ambiente moderado (MTBF referencia = 913 días). El gerente de producción asume que 'si el MTBF es 2.5 años, no habrá fallas en el primer año'. Debés corregir este supuesto.",
    task: "En el Simulador, modo 'Curva R(t)', ingresá MTBF=913 y t_query=365. Calculá: ¿Cuántos de los 18 equipos se espera que fallen el primer año?",
    hint: "R(365 | MTBF=913) = e^(−365/913). Equipos que fallan = 18 × (1 − R).",
    result: { MTBF: 913, t: 365, n: 18 },
    compute: () => {
      const R = Math.exp(-365 / 913);
      const fallas = Math.round(18 * (1 - R));
      return { R: (R * 100).toFixed(1), fallas };
    },
    conclusion: `R(365d) = e^(−365/913) ≈ 67.0%. Equipos que fallan año 1: 18×33% ≈ 6 equipos. El gerente subestimó drásticamente las fallas esperadas. Un buen plan de mantenimiento debe contemplar al menos 5–6 intervenciones en el año 1.`,
  },
  {
    id: 2,
    title: "Paso 2 — Estimación MTBF con Datos Reales",
    context: "Al fin del año 1, los registros muestran: 4 BES fallaron (tiempos: 95, 210, 340, 290 días). Los 14 restantes siguen operativos, en promedio hace 300 días. Debés estimar el MTBF real del campo.",
    task: "T_total = 95+210+340+290 + 14×300 = 5135 días. r=4. Ingresá en modo Estimación: T_total=5135, r=4, IC 90%. ¿Cuál es el MTBF MLE y el límite inferior del IC?",
    result: { T_total: 5135, r: 4 },
    compute: () => {
      const MTBF = 5135 / 4;
      const ic   = { lower: +(2 * 5135 / 21.03).toFixed(0), upper: +(2 * 5135 / 1.145).toFixed(0) };
      return { MTBF: MTBF.toFixed(0), ic };
    },
    conclusion: "MTBF_MLE = 5135/4 = 1284 días. IC 90%: [488, 8978 días]. El límite inferior de 488 días es el valor conservador para planificación — es más bajo que el benchmark de 913 días, indicando condiciones de campo más severas. Con solo 4 fallas, la incertidumbre es alta.",
  },
  {
    id: 3,
    title: "Paso 3 — Impacto del IC en la Planificación",
    context: "Con MTBF_MLE=1284 días y IC_lower=488 días, tenés que decidir cuántos BES de repuesto comprar para el año 2. El criterio de la empresa es: R(año 2) ≥ 60% del parque.",
    task: "Calculá R(730 días) usando el MTBF_MLE y usando el IC_lower. ¿Cuántos equipos de repuesto necesitás según cada escenario (parque = 18 unidades)?",
    compute: () => {
      const R_mle   = Math.exp(-730 / 1284);
      const R_lower = Math.exp(-730 / 488);
      const fallas_mle   = Math.ceil(18 * (1 - R_mle));
      const fallas_lower = Math.ceil(18 * (1 - R_lower));
      return {
        R_mle:   (R_mle * 100).toFixed(1),
        R_lower: (R_lower * 100).toFixed(1),
        fallas_mle, fallas_lower
      };
    },
    conclusion: "Con MTBF_MLE=1284: R(730d)=56.7% → ~8 fallas → 8 repuestos. Con IC_lower=488: R(730d)=22.4% → ~14 fallas → 14 repuestos. La diferencia es enorme. Para gestión de riesgo, se recomienda usar el IC_lower como base de planificación y el MLE como escenario esperado.",
  },
];

function TabCaso() {
  const [step, setStep] = useState(0);
  const s = CASO_STEPS[step];
  const computed = useMemo(() => s.compute(), [step]);

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
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>CAMPO COLIBRÍ · Caso M7</div>
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
          <div style={{ background: C.ok + "08", border: `1px solid ${C.ok}25`, borderRadius: 8, padding: 14 }}>
            <div style={{ fontSize: 9, color: C.ok, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 6 }}>CONCLUSIÓN</div>
            <div style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>{s.conclusion}</div>
          </div>
        </div>

        <div style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: "JetBrains Mono, monospace" }}>Resultado calculado</div>

          {step === 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "MTBF",         value: "913 días",              color: "#38BDF8" },
                  { label: "R(365 días)",   value: `${computed.R}%`,        color: C.ok },
                  { label: "F(365 días)",   value: `${(100 - +computed.R).toFixed(1)}%`, color: C.danger },
                  { label: "Fallas año 1",  value: `~${computed.fallas} equipos`, color: C.warn },
                ].map((m, i) => (
                  <div key={i} style={{ background: C.surfAlt, borderRadius: 6, padding: "8px 12px" }}>
                    <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: m.color, fontFamily: "JetBrains Mono, monospace" }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.danger + "08", border: `1px solid ${C.danger}25`, borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: C.danger, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>
                  El gerente esperaba 0 fallas. La realidad: ~{computed.fallas} fallas previstas en el año 1.
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>Cálculo de T_total:</div>
                <pre style={{ fontSize: 10, color: C.text, fontFamily: "JetBrains Mono, monospace", margin: 0, lineHeight: 1.7 }}>
{`T_fallas  = 95 + 210 + 340 + 290 = 935 días
T_cens    = 14 × 300              = 4200 días
T_total   = 935 + 4200            = 5135 días

MTBF_MLE  = 5135 / 4              = ${computed.MTBF} días`}
                </pre>
              </div>
              <div style={{ background: "#A78BFA10", border: "1px solid #A78BFA30", borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "#A78BFA", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", marginBottom: 4 }}>IC 90%</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "JetBrains Mono, monospace" }}>
                  [{computed.ic.lower}, {computed.ic.upper}] días
                </div>
                <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginTop: 4 }}>
                  Límite inferior = {computed.ic.lower} días → valor de planificación
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Escenario MTBF_MLE (1284 d)",   R: computed.R_mle,   fallas: computed.fallas_mle,   color: ACCENT },
                { label: "Escenario IC_lower (488 d)",     R: computed.R_lower, fallas: computed.fallas_lower, color: C.danger },
              ].map((sc, i) => (
                <div key={i} style={{
                  background: sc.color + "08", border: `1px solid ${sc.color}30`, borderRadius: 8, padding: 14,
                }}>
                  <div style={{ fontSize: 9, color: sc.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 8 }}>{sc.label}</div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>R(730d)</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: sc.color, fontFamily: "JetBrains Mono, monospace" }}>{sc.R}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>Fallas año 2</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: sc.color, fontFamily: "JetBrains Mono, monospace" }}>~{sc.fallas} eq.</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>Repuestos</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: sc.color, fontFamily: "JetBrains Mono, monospace" }}>{sc.fallas}</div>
                    </div>
                  </div>
                </div>
              ))}
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
  const [answers, setAnswers] = useState({});
  const [result,  setResult]  = useState(null);
  const select = (qId, optId) => { if (!result) setAnswers(p => ({ ...p, [qId]: optId })); };
  const submit = () => setResult(gradeM7(M7_QUESTIONS.map(q => ({ id: q.id, selected: answers[q.id] || "" }))));
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
                ? "Excelente. Dominás la distribución exponencial, el MTBF MLE y los intervalos Chi²."
                : result.pct >= 60
                ? "Buena base. Revisá la interpretación de R(MTBF) y el manejo de datos censurados."
                : "Repasá los conceptos de supervivencia exponencial, sesgo de sobrevivencia y el IC Chi²."}
            </div>
          </div>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>Reintentar</button>
        </div>
      )}

      {M7_QUESTIONS.map((q, qi) => {
        const res = result?.results.find(r => r.id === q.id);
        return (
          <div key={q.id} style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.text, fontFamily: "JetBrains Mono, monospace", marginBottom: 12, lineHeight: 1.6 }}>
              <span style={{ color: ACCENT, fontWeight: 700 }}>{qi + 1}. </span>{q.text}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {q.options.map(opt => {
                const selected  = answers[q.id] === opt.id;
                const isCorrect = res && opt.id === q.correct;
                const isWrong   = res && selected && !isCorrect;
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
                💡 {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {!result && (
        <button onClick={submit} disabled={Object.keys(answers).length < M7_QUESTIONS.length} style={{
          padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT,
          cursor: Object.keys(answers).length < M7_QUESTIONS.length ? "not-allowed" : "pointer",
          opacity: Object.keys(answers).length < M7_QUESTIONS.length ? 0.5 : 1,
          fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
        }}>
          CALIFICAR ({Object.keys(answers).length}/{M7_QUESTIONS.length} respondidas)
        </button>
      )}
    </div>
  );
}

// ─── Root Module7 ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "teoria", label: "A — Teoría" },
  { id: "sim",    label: "B — Simulador" },
  { id: "caso",   label: "C — Caso Práctico" },
  { id: "eval",   label: "D — Evaluación" },
];

export default function Module7({ onBack }) {
  const [tab, setTab] = useState("teoria");
  return (
    <div style={{ fontFamily: C.fontUI, background: C.bg, minHeight: "100vh", color: C.text, padding: "24px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", color: C.muted, cursor: "pointer", fontSize: 10, fontFamily: C.fontUI }}>← Hub</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: ACCENT, fontWeight: 800, fontFamily: C.font }}>M07</span>
            <span style={{ fontSize: 21, fontWeight: 800, color: "#F1F5F9", fontFamily: C.fontUI }}>Confiabilidad y MTBF</span>
          </div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>R(t) = e^(−t/MTBF) · Datos Censurados · Intervalos Chi²</div>
        </div>
        <span style={{ fontSize: 9, color: C.ok, background: C.ok + "18", padding: "2px 10px", borderRadius: 10, border: `1px solid ${C.ok}30`, fontFamily: C.fontUI }}>✅ Disponible</span>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 40, zIndex: 100, background: C.bg, paddingTop: 8 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 18px", border: "none", borderRadius: "6px 6px 0 0",
            background: tab === t.id ? ACCENT + "18" : "transparent",
            borderBottom: tab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent",
            color: tab === t.id ? ACCENT : C.muted,
            cursor: "pointer", fontSize: 10, fontFamily: C.fontUI,
            fontWeight: tab === t.id ? 700 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "teoria" && <TabTeoria />}
      {tab === "sim"    && <TabSimulador />}
      {tab === "caso"   && <TabCaso />}
      {tab === "eval"   && <TabEvaluacion />}
    </div>
  );
}
