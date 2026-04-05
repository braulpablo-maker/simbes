/**
 * SIMBES — Hub Principal
 * =======================
 * Mapa de los 8 módulos con estado, temas y navegación.
 */
import { useState, useEffect } from "react";
import { C } from '../theme';

function readEvalScores() {
  const scores = {};
  for (const id of ['m1','m2','m3','m4','m5','m6','m7','m8']) {
    try {
      const v = localStorage.getItem(`simbes_eval_${id}`);
      if (v) scores[id] = JSON.parse(v);
    } catch {}
  }
  return scores;
}

const MODULES = [
  {
    id: "m1", number: 1, color: "#38BDF8",
    title: "Análisis Nodal · IPR",
    subtitle: "Darcy · Vogel · Leyes de Afinidad",
    status: "available",
    difficulty: 1, prereqs: [],
    topics: [
      "IPR Darcy (zona lineal, Pwf ≥ Pb)",
      "IPR Vogel (zona bifásica, Pwf < Pb)",
      "AOF — Absolute Open Flow",
      "VLP y curva H-Q de la bomba BES",
      "Punto de operación IPR ∩ VLP",
      "Optimización con VSD (frecuencia)",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m2", number: 2, color: "#34D399",
    title: "Diseño Hidráulico",
    subtitle: "TDH · Colebrook-White · Ns",
    status: "available",
    difficulty: 2, prereqs: ["M01"],
    topics: [
      "TDH: estática + fricción + contrapresión",
      "Factor de fricción Colebrook-White",
      "Velocidad Específica Ns y tipo de impulsor",
      "Número de etapas requeridas",
      "Curva H-Q vs. curva de sistema",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m3", number: 3, color: "#A78BFA",
    title: "Gas y Multifásico",
    subtitle: "GVF · Gas Lock · AGS",
    status: "available",
    difficulty: 2, prereqs: ["M01", "M02"],
    topics: [
      "GVF en succión de la bomba",
      "Umbral de gas lock (15% GVF)",
      "Separadores AGS pasivo vs. gas handler",
      "Degradación H-Q por presencia de gas",
      "Corrección de viscosidad (Hydraulic Institute)",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m4", number: 4, color: "#F472B6",
    title: "Eléctrico · VSD",
    subtitle: "Cable · THD · Arrhenius",
    status: "available",
    difficulty: 2, prereqs: ["M01"],
    topics: [
      "Caída de voltaje en cable vs. temperatura",
      "Regla de Arrhenius: cada 10°C → vida ÷ 2",
      "THD por topología VSD (6P/12P/18P/AFE)",
      "Límite IEEE 519-2014: THDv < 5% en PCC",
      "Selección de materiales NACE MR0175",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m5", number: 5, color: "#FBBF24",
    title: "Sensores y Monitoreo",
    subtitle: "Amperimétricas · P/T · Vibración",
    status: "available",
    difficulty: 2, prereqs: ["M01", "M02"],
    topics: [
      "Interpretación de cartas amperimétricas",
      "Sensores downhole: presión y temperatura",
      "Vibración: alertas > 4 mm/s RMS",
      "Dashboard de monitoreo en tiempo real",
      "Correlación sensor → condición operativa",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m6", number: 6, color: "#EF4444",
    title: "Diagnóstico DIFA",
    subtitle: "API RP 11S1 · Árbol de Fallas",
    status: "available",
    difficulty: 3, prereqs: ["M01–M05"],
    topics: [
      "Metodología DIFA / API RP 11S1",
      "Árbol de diagnóstico causa-efecto",
      "Códigos 3700 / 4900 / 5400 / 5900",
      "Casos: subcarga, gas lock, corrosión",
      "Reporte de teardown estandarizado",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m7", number: 7, color: "#FB923C",
    title: "Confiabilidad · MTBF",
    subtitle: "Exponencial · Censurados · Chi²",
    status: "available",
    difficulty: 3, prereqs: ["Estadística básica"],
    topics: [
      "R(t) = e^(−t/MTBF) — distribución exponencial",
      "R(MTBF) = e⁻¹ ≈ 36.77%",
      "MTBF MLE con datos censurados",
      "Sesgo de sobrevivencia inverso",
      "Intervalos de confianza Chi² (90%)",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
  {
    id: "m8", number: 8, color: "#E2E8F0",
    title: "Constructor de Escenarios",
    subtitle: "Integración completa · Modo libre · Decline Arps",
    status: "available",
    difficulty: 2, prereqs: ["M01–M04"],
    topics: [
      "Configuración libre de todos los subsistemas",
      "Análisis integrado IPR + Hidráulica + Gas + Eléctrico",
      "Comparación de dos escenarios en pantalla dividida",
      "E · Modo Plan · Arps — análisis de decline de producción",
      "Exportación de resultados a PDF",
    ],
    badge: "✅ Disponible · 5 pestañas (A–E)",
    badgeColor: "#22C55E",
  },
  {
    id: "m9", number: 9, color: "#818CF8",
    title: "Flujo de Diseño BES",
    subtitle: "Wizard secuencial · 12 pasos · Pwf estratégico",
    status: "available",
    difficulty: 3, prereqs: ["M01–M08"],
    topics: [
      "Pwf como decisión estratégica de yacimientos (no resultado)",
      "Candidatura BES: 7 criterios ✅/⚠️/❌",
      "IPR, PIP, GVF · TDH + selección serie · Motor · Cable",
      "Análisis de riesgos (9 indicadores) · Set points · MTBF",
      "Hoja de selección BES completa — Pasos 0–11",
    ],
    badge: "✅ Disponible · Pasos 0–11",
    badgeColor: "#22C55E",
  },
];

const DIFF_LABEL = ['', '⭐ Básico', '⭐⭐ Intermedio', '⭐⭐⭐ Avanzado'];
const DIFF_COLOR = ['', '#22C55E', '#F59E0B', '#EF4444'];

function ModuleCard({ mod, onEnter, hovered, onHover, score }) {
  const available = mod.status === "available";
  const isHovered = hovered === mod.id;

  return (
    <div
      onMouseEnter={() => onHover(mod.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onEnter(mod.id)}
      style={{
        background: isHovered ? "#243044" : C.surface,
        borderTop: `3px solid ${available ? mod.color : C.border}`,
        borderRight: `1px solid ${isHovered ? mod.color + "60" : C.border}`,
        borderBottom: `1px solid ${isHovered ? mod.color + "60" : C.border}`,
        borderLeft: `1px solid ${isHovered ? mod.color + "60" : C.border}`,
        borderRadius: 16,
        padding: "20px 20px 16px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
        boxShadow: isHovered ? C.shadow : C.shadowCard,
      }}
    >
      {/* Number + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: mod.color,
          letterSpacing: 2, fontFamily: C.font,
          opacity: available ? 1 : 0.5,
        }}>
          M{String(mod.number).padStart(2, "0")}
        </div>
        {/* Badge + difficulty apilados a la derecha */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            fontSize: 9, color: mod.badgeColor, letterSpacing: 0.5,
            fontFamily: C.fontUI, fontWeight: 600,
            background: mod.badgeColor + "18",
            padding: "2px 8px", borderRadius: 10,
            border: `1px solid ${mod.badgeColor}30`,
          }}>
            {mod.badge}
          </span>
          {mod.difficulty && (
            <>
              <span style={{ fontSize: 9, color: DIFF_COLOR[mod.difficulty], fontFamily: C.fontUI, fontWeight: 600, background: DIFF_COLOR[mod.difficulty] + "18", padding: "1px 7px", borderRadius: 8, border: `1px solid ${DIFF_COLOR[mod.difficulty]}30` }}>
                {DIFF_LABEL[mod.difficulty]}
              </span>
              {mod.prereqs.length > 0 && (
                <span style={{ fontSize: 9, color: C.muted, fontFamily: C.fontUI, textAlign: "right" }}>
                  Req: {mod.prereqs.join(", ")}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{
          fontSize: 15, fontWeight: 700, color: available ? C.text : C.muted,
          fontFamily: C.fontUI, marginBottom: 3,
          letterSpacing: -0.2,
        }}>
          {mod.title}
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI, opacity: 0.8 }}>
          {mod.subtitle}
        </div>
      </div>

      {/* Topics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {mod.topics.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: mod.color, opacity: available ? 1 : 0.35, marginTop: 2, flexShrink: 0, fontSize: 8 }}>▸</span>
            <span style={{ fontSize: 11, color: available ? C.muted : "#374151", lineHeight: 1.5, fontFamily: C.fontUI }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Score bar */}
      {score && (
        <div style={{ marginTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: C.muted, fontFamily: C.fontUI }}>Evaluación</span>
            <span style={{
              fontSize: 9, fontWeight: 700, fontFamily: C.fontUI,
              color: score.passed ? C.ok : C.warning,
            }}>
              {score.score_pct}% {score.passed ? '✓' : '—'}
            </span>
          </div>
          <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${score.score_pct}%`,
              background: score.passed ? C.ok : C.warning,
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 6 }}>
        {available ? (
          <div style={{
            background: mod.color + "22",
            border: `1px solid ${mod.color}55`,
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: mod.color, fontWeight: 600,
            textAlign: "center", fontFamily: C.fontUI,
            letterSpacing: 0.5,
          }}>
            Entrar →
          </div>
        ) : (
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px",
            fontSize: 12, color: C.border,
            textAlign: "center", fontFamily: C.fontUI,
          }}>
            En desarrollo
          </div>
        )}
      </div>
    </div>
  );
}

// ── Progress Global ───────────────────────────────────────────────────────────
function ProgressGlobal({ evalScores }) {
  const passedModules = Object.values(evalScores).filter(s => s.passed).length;
  const totalModules  = 9;
  const completedChallenges = (() => {
    try { return (JSON.parse(localStorage.getItem('simbes_challenges') || '[]')).length; } catch { return 0; }
  })();
  const totalChallenges = 10;
  const pctMod  = Math.round(passedModules  / totalModules  * 100);
  const pctChal = Math.round(completedChallenges / totalChallenges * 100);
  const pctGlobal = Math.round((passedModules + completedChallenges) / (totalModules + totalChallenges) * 100);

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
      {[
        { label: 'Módulos evaluados', value: passedModules, total: totalModules, pct: pctMod, color: C.ok },
        { label: 'Desafíos resueltos', value: completedChallenges, total: totalChallenges, pct: pctChal, color: C.primary },
        { label: 'Progreso general', value: `${pctGlobal}%`, total: null, pct: pctGlobal, color: '#A78BFA' },
      ].map(({ label, value, total, pct, color }) => (
        <div key={label} style={{ flex: 1, minWidth: 140, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 9, color: C.muted, fontFamily: C.fontUI, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: C.font, marginBottom: 6 }}>
            {total !== null ? `${value}/${total}` : value}
          </div>
          <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Welcome Panel ────────────────────────────────────────────────────────────
function WelcomePanel({ onDismiss }) {
  const TABS = [
    { label: 'A · Teoría', desc: 'Conceptos, fórmulas, glosario del módulo' },
    { label: 'B · Simulador', desc: 'Controles interactivos + gráficas en tiempo real' },
    { label: 'C · Caso Práctico', desc: 'Escenario de campo guiado — diagnóstico paso a paso' },
    { label: 'D · Evaluación', desc: 'Preguntas + simulación calificada (mín. 70%)' },
  ];
  const RUTAS = [
    { label: 'Ruta completa', path: 'M01 → M02 → M03 → M04 → M05 → M06 → M07 → M08 → M09' },
    { label: 'Diseño BES', path: 'M01 → M02 → M09' },
    { label: 'Gas y Fluidos', path: 'M01 → M03 → M08' },
    { label: 'Diagnóstico', path: 'M05 → M06 → M07' },
  ];
  const PREREQS = [
    'Hidráulica básica — presión, caudal, pérdida de carga',
    'Producción de petróleo — yacimiento, pozo, cabezal',
    'Álgebra básica — no se requiere cálculo diferencial',
  ];

  return (
    <div style={{ background: '#0D1E33', border: '1px solid #1E3A5F', borderRadius: 14, padding: '22px 26px', marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 9, color: C.primary, fontFamily: C.font, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>BIENVENIDO A SIMBES</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: C.fontUI }}>Guía de inicio rápido</div>
        </div>
        <button onClick={onDismiss} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 10, padding: '4px 12px', cursor: 'pointer', fontFamily: C.font, whiteSpace: 'nowrap' }}>
          × No mostrar de nuevo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Estructura de pestañas */}
          <div>
            <div style={{ fontSize: 9, color: C.primary, fontFamily: C.font, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Cada módulo tiene 4 pestañas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {TABS.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 10, color: C.primary, fontFamily: C.font, fontWeight: 700, flexShrink: 0, minWidth: 90 }}>{t.label}</span>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: C.fontUI, lineHeight: 1.4 }}>{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modo Desafíos */}
          <div>
            <div style={{ fontSize: 9, color: '#38BDF8', fontFamily: C.font, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Modo Desafíos</div>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, fontFamily: C.fontUI, lineHeight: 1.6 }}>
              10 escenarios de campo con criterios de éxito verificables. Ajustá parámetros en el simulador hasta alcanzar el objetivo. No hay una única respuesta — explorá las causas raíz.
            </p>
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Rutas de aprendizaje */}
          <div>
            <div style={{ fontSize: 9, color: '#34D399', fontFamily: C.font, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Rutas de aprendizaje sugeridas</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RUTAS.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span style={{ fontSize: 9, color: '#34D399', fontFamily: C.font, fontWeight: 700, flexShrink: 0, minWidth: 80 }}>{r.label}</span>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: C.font }}>{r.path}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prerrequisitos */}
          <div>
            <div style={{ fontSize: 9, color: C.warning, fontFamily: C.font, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Conocimientos previos sugeridos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PREREQS.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ color: C.warning, fontSize: 8, marginTop: 3, flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 10, color: C.muted, fontFamily: C.fontUI, lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hub({ onNavigate }) {
  const [hovered, setHovered] = useState(null);
  const [evalScores, setEvalScores] = useState(readEvalScores);
  const [showWelcome, setShowWelcome] = useState(() => {
    try { return localStorage.getItem('simbes_welcome_dismissed') !== 'true'; } catch { return true; }
  });

  function dismissWelcome() {
    try { localStorage.setItem('simbes_welcome_dismissed', 'true'); } catch {}
    setShowWelcome(false);
  }

  // Refresh scores when Hub becomes visible (user may have completed an eval)
  useEffect(() => {
    setEvalScores(readEvalScores());
  }, []);

  return (
    <div style={{
      fontFamily: C.fontUI,
      background: C.bg,
      minHeight: "100vh",
      color: C.text,
      padding: "32px 32px 48px",
    }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            background: C.primary,
            borderRadius: 6, padding: "3px 10px",
            fontSize: 11, letterSpacing: 3,
            color: C.bg, fontWeight: 800, textTransform: "uppercase",
            fontFamily: C.fontUI,
          }}>SIMBES</div>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted, fontFamily: C.fontUI }}>
            Simulador Operativo de Bombeo Electrosumergible
          </span>
        </div>

        <h1 style={{
          margin: "0 0 6px",
          fontSize: 30, fontWeight: 800,
          color: C.text, letterSpacing: -0.5,
          lineHeight: 1.1, fontFamily: C.fontUI,
        }}>
          Mapa de Módulos
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: C.muted, fontFamily: C.fontUI }}>
          9 módulos de simulación · Física trazable a fuentes publicadas · Unidades operativas
        </p>
      </div>

      {/* ── WELCOME PANEL ── */}
      {showWelcome && <WelcomePanel onDismiss={dismissWelcome} />}

      {/* ── PROGRESS GLOBAL ── */}
      <ProgressGlobal evalScores={evalScores} />

      {/* ── MODULE GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 16,
      }}>
        {MODULES.map(mod => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            hovered={hovered}
            onHover={setHovered}
            onEnter={onNavigate}
            score={evalScores[mod.id]}
          />
        ))}
      </div>

      {/* ── DESAFÍOS ── */}
      <div style={{ marginTop: 28 }}>
        <div
          onClick={() => onNavigate('challenges')}
          style={{
            background: '#38BDF808',
            border: `1px solid #38BDF830`,
            borderRadius: 12, padding: '18px 24px',
            cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: C.primary, fontFamily: C.fontUI, fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>MODO DESAFÍOS</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.fontUI, marginBottom: 2 }}>Desafíos de Campo BES</div>
            <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI }}>10 escenarios · Aprendizaje Basado en Problemas · Identifica causas raíz con el simulador</div>
          </div>
          <div style={{
            background: C.primary + '22', border: `1px solid ${C.primary}55`,
            borderRadius: 8, padding: '10px 18px',
            fontSize: 12, color: C.primary, fontWeight: 600,
            fontFamily: C.fontUI, whiteSpace: 'nowrap',
          }}>Abrir →</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 40, paddingTop: 24,
        borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI, opacity: 0.6 }}>
          Motor físico trazable · Darcy · Vogel · Colebrook-White · Arrhenius · API RP 11S1
        </div>
        <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI, opacity: 0.6 }}>
          Unidades UI: m³/d · m · psi · Hz · °C
        </div>
      </div>
    </div>
  );
}
