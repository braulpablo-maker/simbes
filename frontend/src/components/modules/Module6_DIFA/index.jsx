/**
 * SIMBES — Módulo 6: Diagnóstico DIFA / API RP 11S1
 * ==================================================
 * Física: matching de síntomas → patrones de falla, árbol de diagnóstico,
 *          codificación según API RP 11S1.
 * @ref API RP 11S1 — Recommended Practice for Electrical Submersible Pump Teardown Report
 */
import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  SYMPTOMS,
  SYMPTOM_GROUPS,
  API_SERIES,
  diagnose,
  confidenceLabel,
} from "../../../physics/diagnostics";
import { M6_QUESTIONS, gradeM6 } from "../../../pedagogy/evaluations/m6";
import TheoryLayout from '../../ui/TheoryLayout';
import { TEORIA_M6 } from './teoria-data';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ACCENT = "#FB923C";
import { C } from '../../../theme';

const SEVERITY_COLOR = {
  critical: "#DC2626",
  high:     "#EF4444",
  medium:   "#F59E0B",
  low:      "#22C55E",
};

const SEVERITY_LABEL = {
  critical: "🔴 CRÍTICO",
  high:     "🔴 ALTO",
  medium:   "🟡 MEDIO",
  low:      "🟢 BAJO",
};

const TOOLTIP_STYLE = {
  background: "#0D1424", border: "1px solid #1E293B",
  fontSize: 10, color: "#CBD5E1", fontFamily: "JetBrains Mono, monospace",
};

// ─── Micro-componentes ────────────────────────────────────────────────────────
function ConfidenceBar({ value, color }) {
  const pct = Math.round(value * 100);
  const col = pct >= 75 ? C.ok : pct >= 45 ? C.warn : C.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#1E293B", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 4, transition: "width 0.35s" }} />
      </div>
      <span style={{ fontSize: 9, color: col, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, minWidth: 32 }}>
        {pct}%
      </span>
    </div>
  );
}

function ApiSeriesBadge({ series }) {
  const info = API_SERIES[series] || { label: `Serie ${series}`, color: C.muted };
  return (
    <span style={{
      fontSize: 8, fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
      color: info.color, background: info.color + "18",
      border: `1px solid ${info.color}40`, borderRadius: 4, padding: "2px 7px",
    }}>
      {info.label}
    </span>
  );
}

// ─── Tab A: Teoría ────────────────────────────────────────────────────────────
const TEORIA_SECTIONS = [
  {
    id: "difa", title: "¿Qué es el DIFA?",
    body: `DIFA — Downhole Investigation and Failure Analysis.
Proceso sistemático para identificar la causa raíz de fallas en equipos
BES/ESP extraídos del pozo.

El DIFA combina:
  • Historial operativo (cartas amperimétricas, alarmas, tendencias)
  • Inspección visual del equipo extraído (teardown)
  • Codificación según API RP 11S1 (Teardown Report)
  • Análisis de causa raíz (RCA — Root Cause Analysis)

Objetivo: no solo reparar, sino PREVENIR la reincidencia.
Sin DIFA: el equipo vuelve al pozo con el mismo problema.`,
  },
  {
    id: "api", title: "Codificación API RP 11S1",
    body: `El estándar API RP 11S1 define un lenguaje común para
clasificar los daños encontrados en el teardown.

Estructura del código: XYYY
  X   = categoría del sistema afectado
  YYY = tipo específico de daño observado

Series principales:
  3700 — Corrosión / Picadura
         3712: Desgaste por recirculación
         3720: Incrustación de escala
         3730: Ataque por H₂S o CO₂

  4900 — Sello primario / invasión de fluido
         4910: Gas lock → sobrecalentamiento del motor
         4930: Falla de elastómero → invasión

  5400 — Sellos secundarios / daño mecánico
         5410: Daño por surging (operación fuera de BEP)
         5430: Falla de rodamiento

  5900 — Sellos terciarios / cable / sistema eléctrico
         5910: Caída de voltaje en cable
         5930: Corrosión de cable por H₂S

El código es la base del informe DIFA y permite comparar
tendencias entre pozos, campañas y años.`,
  },
  {
    id: "arbol", title: "Árbol de Diagnóstico",
    body: `El árbol de diagnóstico organiza los síntomas en ramas:

SÍNTOMA PRINCIPAL → CAUSA PROBABLE → CÓDIGO API

Corriente baja sostenida (< 60% nominal)
  → Subcarga / gas en bomba  → 3712 o 4910
  → Eje roto                 → 5430

Corriente alta sostenida (> 120% nominal)
  → Incrustación de escala   → 3720
  → Alta viscosidad           → evaluar HI correction

Corriente errática / oscilante
  → Surging (sobre BEP)      → 5410
  → Gas lock intermitente    → 4910
  → Falla de aislamiento     → 5910

IR < 1 MΩ
  → Degradación por temp     → 4930
  → Ataque por H₂S           → 3730 / 5930
  → Invasión de fluido       → 4930

Vibración alta + impactos periódicos
  → Falla de rodamiento      → 5430

Caudal reducido gradual + corriente alta
  → Incrustación de escala   → 3720

Regla de oro: buscar siempre el primer daño.
Todos los demás suelen ser consecuencias.`,
  },
  {
    id: "teardown", title: "El Teardown Report",
    body: `El Teardown Report es el documento central del DIFA.
Se elabora al desarmar el equipo extraído en el taller.

Estructura mínima:
  1. Datos del pozo y del equipo (serial, modelo, fecha instalación)
  2. Historial operativo (carta amperimérica, alarmas)
  3. Inspección visual por componente:
       Bomba → impulsores, difusores, eje, cojinetes
       Sello  → elastómero, cámara de aceite, laberinto
       Motor  → bobinas, aislamiento, cojinetes de empuje
       Cable  → aislamiento, conectores, tapa de boca
  4. Fotografías de cada daño observado
  5. Código API RP 11S1 por cada daño
  6. Conclusión: causa raíz + código principal
  7. Recomendaciones de prevención

Un buen teardown report convierte cada falla
en conocimiento institucional permanente.`,
  },
  {
    id: "prevencion", title: "Prevención — Cierre del Ciclo",
    body: `El DIFA solo tiene valor si cierra el ciclo:
Falla → Análisis → Prevención → Cero Reincidencia.

Acciones de prevención por categoría:

3700 — Corrosión:
  → Tratamiento químico (inhibidor, biocida)
  → Selección de materiales (NACE MR0175)

4900 — Sello:
  → Verificar diseño térmico
  → Selección de elastómero correcto (EPDM/PEEK vs NBR)
  → Monitoreo de IR mensual

5400 — Mecánico / Surging:
  → Operar siempre 80–110% del BEP
  → Análisis de vibración como monitoreo continuo
  → Verificar TDH de diseño vs. TDH real

5900 — Eléctrico / Cable:
  → Verificar caída de voltaje < 5% antes de instalar
  → Especificar Lead Sheath en pozos amargos
  → Medición de IR en superficie y anualmente`,
  },
  {
    id: "glosario", title: "Glosario M6",
    body: `DIFA  — Downhole Investigation and Failure Analysis
API RP 11S1 — Recommended Practice for ESP Teardown Report
Teardown  — Desmontaje y inspección del equipo extraído
RCA  — Root Cause Analysis: análisis de causa raíz
IR   — Insulation Resistance (resistencia de aislamiento)
NBR  — Nitrilo (elastómero para temperatura < 120°C)
EPDM — Etileno-propileno (elastómero para hasta 177°C)
PEEK — Poliéteretercetona (plástico de ingeniería, hasta 250°C)
Lead Sheath — funda de plomo en cable (protección H₂S)
Monel 400 — aleación Ni-Cu resistente a H₂S
BEP  — Best Efficiency Point: punto de máxima eficiencia de la bomba
Surging — operación sobre el BEP con recirculación en descarga
Gas lock — pérdida total de succión por gas en la bomba
BPFO — Ball Pass Frequency Outer race: frecuencia de falla de rodamiento`,
  },
];

function TabTeoria() {
  return <TheoryLayout sections={TEORIA_M6} accentColor="#EF4444" />;
}

// ─── Tab B: Simulador (motor de diagnóstico) ──────────────────────────────────
function SymptomCheck({ symptom, active, onToggle }) {
  const grp = SYMPTOM_GROUPS[symptom.group];
  return (
    <button onClick={() => onToggle(symptom.id)} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 10px", borderRadius: 6, cursor: "pointer", textAlign: "left",
      background: active ? grp.color + "15" : "transparent",
      border: `1px solid ${active ? grp.color + "70" : C.border}`,
      color: active ? grp.color : C.muted,
      fontFamily: "JetBrains Mono, monospace", fontSize: 9, width: "100%",
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: 2,
        border: `1.5px solid ${active ? grp.color : C.muted}`,
        background: active ? grp.color : "transparent",
        flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 8, color: "#0B0F1A",
      }}>
        {active ? "✓" : ""}
      </span>
      {symptom.label}
    </button>
  );
}

function PatternCard({ pattern, rank }) {
  const [expanded, setExpanded] = useState(false);
  const pct    = Math.round(pattern.confidence * 100);
  const sevCol = SEVERITY_COLOR[pattern.severity] || C.muted;
  const apiInfo = API_SERIES[pattern.api_series] || { label: `Serie ${pattern.api_series}`, color: C.muted };

  return (
    <div style={{
      background: C.surface, borderRadius: 8, padding: 16,
      border: `1px solid ${sevCol}35`,
      borderLeft: `3px solid ${sevCol}`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, marginRight: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.text, fontFamily: "JetBrains Mono, monospace", marginBottom: 4, lineHeight: 1.4 }}>
            <span style={{ color: C.muted, marginRight: 6 }}>#{rank}</span>
            {pattern.title}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <ApiSeriesBadge series={pattern.api_series} />
            <span style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", padding: "2px 7px", border: `1px solid ${C.border}`, borderRadius: 4 }}>
              {pattern.api_code}
            </span>
            <span style={{ fontSize: 8, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, color: sevCol, padding: "2px 7px", background: sevCol + "15", border: `1px solid ${sevCol}40`, borderRadius: 4 }}>
              {SEVERITY_LABEL[pattern.severity] || pattern.severity}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: pct >= 75 ? C.ok : pct >= 45 ? C.warn : C.danger, fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
            {pct}%
          </div>
          <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
            {confidenceLabel(pattern.confidence)}
          </div>
        </div>
      </div>

      <ConfidenceBar value={pattern.confidence} />

      {/* Causa raíz siempre visible */}
      <div style={{ marginTop: 10, fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6 }}>
        <span style={{ color: ACCENT, fontWeight: 700 }}>Causa raíz: </span>
        {pattern.root_cause}
      </div>

      {/* Toggle detalle */}
      <button onClick={() => setExpanded(e => !e)} style={{
        marginTop: 10, background: "transparent", border: `1px solid ${C.border}`,
        borderRadius: 4, padding: "3px 10px", fontSize: 8, color: C.muted,
        cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
      }}>
        {expanded ? "▲ Ocultar detalle" : "▼ Ver prevención + MTBF"}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 8, color: C.muted, fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", marginBottom: 4 }}>Acciones de Prevención</div>
            {pattern.prevention.map((p, i) => (
              <div key={i} style={{ fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.6, paddingLeft: 8 }}>
                • {p}
              </div>
            ))}
          </div>
          {pattern.typical_MTBF_impact && (
            <div style={{ background: sevCol + "08", border: `1px solid ${sevCol}25`, borderRadius: 6, padding: "8px 12px" }}>
              <div style={{ fontSize: 8, color: sevCol, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 2 }}>
                Impacto en MTBF
              </div>
              <div style={{ fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace" }}>
                {pattern.typical_MTBF_impact}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabSimulador() {
  const [active, setActive] = useState(new Set());

  const toggle = (id) => setActive(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const clear = () => setActive(new Set());

  const results = useMemo(() => diagnose(active), [active]);

  // Datos para gráfica de confianza
  const chartData = results.slice(0, 5).map(r => ({
    name: `${r.api_code}`,
    Confianza: Math.round(r.confidence * 100),
    fill: SEVERITY_COLOR[r.severity] || C.muted,
  }));

  // Distribución por serie API
  const seriesDist = {};
  results.forEach(r => {
    seriesDist[r.api_series] = (seriesDist[r.api_series] || 0) + 1;
  });

  const groupedSymptoms = Object.entries(SYMPTOM_GROUPS).map(([gKey, gInfo]) => ({
    key: gKey,
    ...gInfo,
    symptoms: SYMPTOMS.filter(s => s.group === gKey),
  }));

  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* ── Panel de síntomas ── */}
      <div style={{ width: 250, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 9, color: ACCENT, letterSpacing: 2, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>SÍNTOMAS OBSERVADOS</div>
          {active.size > 0 && (
            <button onClick={clear} style={{
              fontSize: 8, color: C.muted, background: "transparent",
              border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px",
              cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
            }}>Limpiar</button>
          )}
        </div>

        {groupedSymptoms.map(grp => (
          <div key={grp.key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 8, color: grp.color, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
              — {grp.label}
            </div>
            {grp.symptoms.map(sym => (
              <SymptomCheck key={sym.id} symptom={sym} active={active.has(sym.id)} onToggle={toggle} />
            ))}
          </div>
        ))}

        {/* Contador */}
        <div style={{ background: C.surface, borderRadius: 6, padding: "8px 12px", border: `1px solid ${C.border}`, fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
          {active.size === 0
            ? "Selecciona síntomas para iniciar el diagnóstico"
            : `${active.size} síntoma${active.size > 1 ? "s" : ""} seleccionado${active.size > 1 ? "s" : ""} · ${results.length} patrón${results.length !== 1 ? "es" : ""} encontrado${results.length !== 1 ? "s" : ""}`
          }
        </div>
      </div>

      {/* ── Panel de resultados ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>

        {active.size === 0 && (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, padding: 48, gap: 16, minHeight: 400,
          }}>
            <div style={{ fontSize: 32 }}>🔍</div>
            <div style={{ fontSize: 13, color: C.muted, fontFamily: "JetBrains Mono, monospace", textAlign: "center", lineHeight: 1.7 }}>
              Motor de Diagnóstico DIFA<br />
              <span style={{ fontSize: 10 }}>Seleccioná los síntomas observados en el panel izquierdo.<br />El sistema identificará los patrones de falla más probables según API RP 11S1.</span>
            </div>
          </div>
        )}

        {active.size > 0 && results.length === 0 && (
          <div style={{
            background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`,
            padding: 32, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.7 }}>
              Combinación de síntomas no coincide con patrones conocidos.<br />
              <span style={{ fontSize: 10 }}>Revisá la selección o consultá con el equipo técnico de campo.</span>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <>
            {/* Gráfica de confianza */}
            <div style={{ background: C.surfAlt, borderRadius: 8, padding: 16, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace", marginBottom: 10 }}>
                Confianza por patrón (Top {chartData.length}) — {results.length} patrón{results.length > 1 ? "es" : ""} total
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }}
                    tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: C.muted, fontFamily: "JetBrains Mono, monospace" }} width={55} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [`${v}%`, "Confianza"]} />
                  <Bar dataKey="Confianza" radius={[0, 4, 4, 0]} fill={ACCENT}
                    label={{ position: "right", fontSize: 9, fill: C.muted, fontFamily: "JetBrains Mono, monospace", formatter: v => `${v}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Series API detectadas */}
            {Object.keys(seriesDist).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(seriesDist).map(([serie, count]) => {
                  const info = API_SERIES[serie] || { label: `Serie ${serie}`, color: C.muted };
                  return (
                    <div key={serie} style={{
                      fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                      color: info.color, background: info.color + "12",
                      border: `1px solid ${info.color}40`, borderRadius: 6,
                      padding: "5px 12px",
                    }}>
                      {info.label} · {count} patrón{count > 1 ? "es" : ""}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tarjetas de patrones */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map((pattern, i) => (
                <PatternCard key={pattern.id} pattern={pattern} rank={i + 1} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab C: Caso Práctico ────────────────────────────────────────────────────
const CASO_STEPS = [
  {
    id: 1,
    title: "Paso 1 — Historial Operativo: Identificar Síntomas",
    context: "Pozo Delfín-3: BES extraído tras 11 meses de operación. El historial operativo muestra: corriente bajó gradualmente de 78 A a 62 A en 3 meses, caudal bajó un 22%, presión de descarga aumentó un 18%. Sin alarmas de IR ni temperatura. El fluido tiene GOR = 120 scf/STB, agua = 65%, sin H₂S.",
    task: "En el Simulador (Tab B), seleccioná: 'Corriente baja', 'Caudal reducido gradualmente' y 'Presión de descarga elevada'. Anotá el patrón #1 con su código API.",
    hint: "La corriente baja + caudal gradual + P descarga alta es la firma clásica de incrustación. El fluido con agua = 65% es propenso a depositar CaCO₃.",
    symptoms: ["lowCurrent", "gradualFlow", "highDischPress"],
    expectedPattern: "f003",
    expectedCode: "3720",
    conclusion: "El simulador debe identificar f003 (Incrustación de escala, código 3720) como patrón #1. Causa: agua de formación con alta tendencia a depositar carbonatos. Prevención: inhibidor de escala downhole + monitoreo de índice de Langelier.",
  },
  {
    id: 2,
    title: "Paso 2 — Teardown: Confirmar el Diagnóstico",
    context: "Al realizar el teardown en el taller, se observa: impulsores con costra dura blanquecina en toda la superficie de los canales de flujo. La costra cubre uniformemente el 60–70% del área de paso. Los elastómeros del sello están en buenas condiciones. El cable tiene IR = 8.2 MΩ (normal).",
    task: "¿Cuál es la secuencia de falla? ¿El código correcto es 3720 (escala) o 4930 (sello)? Justificá tu respuesta basándote en los hallazgos del teardown.",
    hint: "El primer daño determina la causa raíz. El sello está OK, el cable está OK. El único daño real son los depósitos en los impulsores. Código: 3720.",
    conclusion: "Código 3720 — Incrustación de escala en impulsor. Los sellos sanos descartan 4900. El cable OK descarta 5900. Este es un caso 'puro' de incrustación química. Recomendación: revisión de programa de inhibición química + análisis de agua de producción mensual.",
  },
  {
    id: 3,
    title: "Paso 3 — Cierre del Ciclo: Prevención",
    context: "El pozo Delfín-3 vuelve a producir con un nuevo BES. Tenés la oportunidad de implementar las medidas de prevención correctas para evitar la reincidencia del código 3720.",
    task: "¿Cuáles de las siguientes acciones corresponden al patrón de incrustación (3720)? Marcá todas las correctas: (A) Inyección de inhibidor de escala downhole. (B) Instalar AGS pasivo para reducir GVF. (C) Análisis de agua mensual + índice de Langelier. (D) Cambiar elastómero a EPDM. (E) Monitorear tendencia de caudal y presión de descarga.",
    hint: "Las opciones B y D aplican a otros patrones (gas y sello respectivamente). Las opciones A, C y E son las acciones correctas para prevenir incrustación.",
    correctActions: ["A", "C", "E"],
    conclusion: "Correctas: A + C + E. La inhibición química (A) previene la deposición. El monitoreo de agua (C) detecta cambios en la composición antes de que se forme escala. El seguimiento de la tendencia operativa (E) detecta el inicio de incrustación en tiempo real. MTBF esperado con programa de inhibición activo: +40% sobre el actual.",
  },
];

function TabCaso() {
  const [step, setStep] = useState(0);
  const [selectedActions, setSelectedActions] = useState(new Set());
  const s = CASO_STEPS[step];

  const toggleAction = (a) => setSelectedActions(prev => {
    const next = new Set(prev);
    next.has(a) ? next.delete(a) : next.add(a);
    return next;
  });

  // Simulación para el paso 1
  const step1Result = useMemo(() => {
    if (step !== 0) return null;
    return diagnose(new Set(s.symptoms));
  }, [step]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs de pasos */}
      <div style={{ display: "flex", gap: 8 }}>
        {CASO_STEPS.map((c, i) => (
          <button key={i} onClick={() => { setStep(i); setSelectedActions(new Set()); }} style={{
            padding: "6px 14px", borderRadius: 6, fontSize: 10, cursor: "pointer",
            background: step === i ? ACCENT + "22" : "transparent",
            border: `1px solid ${step === i ? ACCENT : C.border}`,
            color: step === i ? ACCENT : C.muted,
            fontFamily: "JetBrains Mono, monospace",
          }}>Paso {i + 1}</button>
        ))}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>POZO DELFÍN-3 · Caso DIFA M6</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Panel izquierdo: contexto */}
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

        {/* Panel derecho: interacción */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {step === 0 && step1Result && (
            <>
              <div style={{ background: C.surface, borderRadius: 8, padding: 14, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 9, color: ACCENT, fontFamily: "JetBrains Mono, monospace", fontWeight: 700, marginBottom: 10 }}>
                  Síntomas seleccionados → Resultado del motor DIFA
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                  {s.symptoms.map(symId => {
                    const sym = SYMPTOMS.find(s => s.id === symId);
                    return sym ? (
                      <div key={symId} style={{ fontSize: 9, color: SYMPTOM_GROUPS[sym.group]?.color || C.text, fontFamily: "JetBrains Mono, monospace" }}>
                        ✓ {sym.label}
                      </div>
                    ) : null;
                  })}
                </div>
                {step1Result.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {step1Result.slice(0, 3).map((r, i) => (
                      <div key={r.id} style={{
                        padding: "8px 12px", borderRadius: 6,
                        background: r.id === s.expectedPattern ? C.ok + "10" : C.surface,
                        border: `1px solid ${r.id === s.expectedPattern ? C.ok + "50" : C.border}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 9, color: r.id === s.expectedPattern ? C.ok : C.muted, fontFamily: "JetBrains Mono, monospace" }}>
                            #{i + 1} {r.api_code} — {r.title.split("→")[0].trim()}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: C.ok, fontFamily: "JetBrains Mono, monospace" }}>
                            {Math.round(r.confidence * 100)}%
                          </span>
                        </div>
                        {r.id === s.expectedPattern && (
                          <ConfidenceBar value={r.confidence} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 14 }}>
                Hallazgos del Teardown — Delfín-3
              </div>
              {[
                { component: "Impulsores",      finding: "Costra blanquecina en 60–70% del área de flujo", code: "3720", ok: false },
                { component: "Difusores",       finding: "Incrustación leve en entradas",                  code: "3720", ok: false },
                { component: "Sello primario",  finding: "Elastómero en buen estado. Sin invasión.",        code: "—",    ok: true  },
                { component: "Motor",           finding: "Bobinas OK. IR = 8.2 MΩ",                         code: "—",    ok: true  },
                { component: "Cable",           finding: "Sin daños. IR superficial = 12 MΩ",               code: "—",    ok: true  },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "100px 1fr 55px",
                  gap: 8, padding: "6px 0", borderBottom: `1px solid ${C.border}`,
                  alignItems: "center",
                }}>
                  <div style={{ fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>{row.component}</div>
                  <div style={{ fontSize: 9, color: row.ok ? C.text : C.warn, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.4 }}>{row.finding}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: row.ok ? C.ok : C.warn, fontFamily: "JetBrains Mono, monospace", textAlign: "right" }}>{row.code}</div>
                </div>
              ))}
              <div style={{ marginTop: 14, background: C.warn + "10", border: `1px solid ${C.warn}30`, borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ fontSize: 9, color: C.warn, fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>Código API principal: 3720</div>
                <div style={{ fontSize: 9, color: C.text, fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>Causa raíz: Incrustación de escala en conjunto de bomba</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ background: C.surface, borderRadius: 8, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, fontFamily: "JetBrains Mono, monospace", marginBottom: 14 }}>
                Seleccioná las acciones correctas para código 3720
              </div>
              {["A", "B", "C", "D", "E"].map(a => {
                const labels = {
                  A: "Inyección de inhibidor de escala downhole",
                  B: "Instalar AGS pasivo para reducir GVF",
                  C: "Análisis de agua mensual + índice de Langelier",
                  D: "Cambiar elastómero a EPDM (clase termina superior)",
                  E: "Monitorear tendencia de caudal y P descarga",
                };
                const isCorrect = s.correctActions.includes(a);
                const isSelected = selectedActions.has(a);
                const col = isSelected
                  ? (isCorrect ? C.ok : C.danger)
                  : C.border;
                return (
                  <button key={a} onClick={() => toggleAction(a)} style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "8px 12px", borderRadius: 6, marginBottom: 6,
                    background: isSelected ? (isCorrect ? C.ok + "10" : C.danger + "10") : "transparent",
                    border: `1px solid ${col}`,
                    color: isSelected ? (isCorrect ? C.ok : C.danger) : C.muted,
                    cursor: "pointer", fontSize: 9, fontFamily: "JetBrains Mono, monospace",
                  }}>
                    <span style={{ fontWeight: 700, marginRight: 6 }}>{a})</span>{labels[a]}
                  </button>
                );
              })}
              {selectedActions.size > 0 && (
                <div style={{ marginTop: 10, fontSize: 9, color: C.muted, fontFamily: "JetBrains Mono, monospace" }}>
                  Correctas seleccionadas: {s.correctActions.filter(a => selectedActions.has(a)).length}/{s.correctActions.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navegación */}
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
  const submit = () => setResult(gradeM6(M6_QUESTIONS.map(q => ({ id: q.id, selected: answers[q.id] || "" }))));
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
                ? "Excelente. Dominas la metodología DIFA y la codificación API RP 11S1."
                : result.pct >= 60
                ? "Buena base. Revisá la diferencia entre series 3700, 4900, 5400 y 5900."
                : "Revisá el árbol de diagnóstico y la lógica de causa raíz del DIFA."}
            </div>
          </div>
          <button onClick={reset} style={{ padding: "8px 16px", borderRadius: 6, border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT, cursor: "pointer", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>Reintentar</button>
        </div>
      )}

      {M6_QUESTIONS.map((q, qi) => {
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
        <button onClick={submit} disabled={Object.keys(answers).length < M6_QUESTIONS.length} style={{
          padding: "12px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: `1px solid ${ACCENT}`, background: ACCENT + "22", color: ACCENT,
          cursor: Object.keys(answers).length < M6_QUESTIONS.length ? "not-allowed" : "pointer",
          opacity: Object.keys(answers).length < M6_QUESTIONS.length ? 0.5 : 1,
          fontFamily: "JetBrains Mono, monospace", letterSpacing: 1,
        }}>
          CALIFICAR ({Object.keys(answers).length}/{M6_QUESTIONS.length} respondidas)
        </button>
      )}
    </div>
  );
}

// ─── Root Module6 ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "teoria", label: "A — Teoría" },
  { id: "sim",    label: "B — Simulador" },
  { id: "caso",   label: "C — Caso Práctico" },
  { id: "eval",   label: "D — Evaluación" },
];

export default function Module6({ onBack }) {
  const [tab, setTab] = useState("teoria");
  return (
    <div style={{ fontFamily: C.fontUI, background: C.bg, minHeight: "100vh", color: C.text, padding: "24px 32px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "5px 12px", color: C.muted, cursor: "pointer", fontSize: 10, fontFamily: C.fontUI }}>← Hub</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 9, letterSpacing: 3, color: ACCENT, fontWeight: 800, fontFamily: C.font }}>M06</span>
            <span style={{ fontSize: 21, fontWeight: 800, color: "#F1F5F9", fontFamily: C.fontUI }}>Diagnóstico DIFA</span>
          </div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1 }}>API RP 11S1 · Árbol de Fallas · Teardown Report · Prevención</div>
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
