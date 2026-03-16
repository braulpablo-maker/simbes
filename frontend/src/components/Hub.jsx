/**
 * SIMBES — Hub Principal
 * =======================
 * Mapa de los 8 módulos con estado, temas y navegación.
 */
import { useState } from "react";

const MODULES = [
  {
    id: "m1", number: 1, color: "#38BDF8",
    title: "Análisis Nodal · IPR",
    subtitle: "Darcy · Vogel · Leyes de Afinidad",
    status: "available",
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
    subtitle: "Integración completa · Modo libre",
    status: "available",
    topics: [
      "Configuración libre de todos los subsistemas",
      "Análisis integrado IPR + Hidráulica + Gas + Eléctrico",
      "Comparación de dos escenarios en pantalla dividida",
      "Exportación de resultados a PDF",
      "Diseño completo de un sistema BES",
    ],
    badge: "✅ Disponible",
    badgeColor: "#22C55E",
  },
];

function ModuleCard({ mod, onEnter, hovered, onHover }) {
  const available = mod.status === "available";

  return (
    <div
      onMouseEnter={() => onHover(mod.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onEnter(mod.id)}
      style={{
        background: hovered === mod.id ? "#131d30" : "#111827",
        border: `1px solid ${hovered === mod.id ? mod.color + "60" : "#1E293B"}`,
        borderTop: `3px solid ${available ? mod.color : "#1E293B"}`,
        borderRadius: 10,
        padding: "20px 20px 16px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "relative",
      }}
    >
      {/* Number + badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: mod.color,
          letterSpacing: 2, fontFamily: "IBM Plex Mono, monospace",
          opacity: available ? 1 : 0.5,
        }}>
          M{String(mod.number).padStart(2, "0")}
        </div>
        <span style={{
          fontSize: 9, color: mod.badgeColor, letterSpacing: 1,
          fontFamily: "IBM Plex Mono, monospace",
          background: mod.badgeColor + "18",
          padding: "2px 8px", borderRadius: 10,
          border: `1px solid ${mod.badgeColor}30`,
        }}>
          {mod.badge}
        </span>
      </div>

      {/* Title */}
      <div>
        <div style={{
          fontSize: 14, fontWeight: 800, color: available ? "#F1F5F9" : "#64748B",
          fontFamily: "IBM Plex Mono, monospace", marginBottom: 2,
          letterSpacing: -0.3,
        }}>
          {mod.title}
        </div>
        <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1, fontFamily: "IBM Plex Mono, monospace" }}>
          {mod.subtitle}
        </div>
      </div>

      {/* Topics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
        {mod.topics.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: mod.color, opacity: available ? 1 : 0.35, marginTop: 1, flexShrink: 0, fontSize: 9 }}>▸</span>
            <span style={{ fontSize: 10, color: available ? "#94A3B8" : "#374151", lineHeight: 1.5, fontFamily: "IBM Plex Mono, monospace" }}>{t}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 6 }}>
        {available ? (
          <div style={{
            background: mod.color + "22",
            border: `1px solid ${mod.color}55`,
            borderRadius: 6, padding: "7px 12px",
            fontSize: 10, color: mod.color, fontWeight: 700,
            textAlign: "center", fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: 1,
          }}>
            ENTRAR →
          </div>
        ) : (
          <div style={{
            background: "#0F172A",
            border: "1px solid #1E293B",
            borderRadius: 6, padding: "7px 12px",
            fontSize: 10, color: "#334155",
            textAlign: "center", fontFamily: "IBM Plex Mono, monospace",
            letterSpacing: 1,
          }}>
            EN DESARROLLO
          </div>
        )}
      </div>
    </div>
  );
}

export default function Hub({ onNavigate }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      fontFamily: "IBM Plex Mono, 'Courier New', monospace",
      background: "#0B0F1A",
      minHeight: "100vh",
      color: "#CBD5E1",
      padding: "32px 32px 48px",
    }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{
            background: "#0EA5E9",
            borderRadius: 4, padding: "3px 10px",
            fontSize: 9, letterSpacing: 3,
            color: "#0B0F1A", fontWeight: 800, textTransform: "uppercase",
          }}>SIMBES</div>
          <div style={{ width: 1, height: 16, background: "#1E293B" }} />
          <span style={{ fontSize: 10, color: "#475569", letterSpacing: 1 }}>
            Simulador Operativo de Bombeo Electrosumergible
          </span>
        </div>

        <h1 style={{
          margin: "0 0 6px",
          fontSize: 28, fontWeight: 800,
          color: "#F1F5F9", letterSpacing: -0.5,
          lineHeight: 1.1,
        }}>
          Mapa de Módulos
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>
          8 módulos de simulación · Física trazable a fuentes publicadas · Unidades operativas
        </p>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        background: "#111827", border: "1px solid #1E293B",
        borderRadius: 8, padding: "12px 20px", marginBottom: 32,
      }}>
        <div style={{ fontSize: 10, color: "#64748B", letterSpacing: 1 }}>PROGRESO MVP</div>
        <div style={{ flex: 1, background: "#1E293B", borderRadius: 4, height: 4, overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "#38BDF8", borderRadius: 4, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontSize: 10, color: "#38BDF8", fontWeight: 700 }}>8 / 8 módulos</div>
        <div style={{ width: 1, height: 16, background: "#1E293B" }} />
        <div style={{ fontSize: 10, color: "#64748B" }}>Fase 1 · MVP</div>
      </div>

      {/* ── MODULE GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 14,
      }}>
        {MODULES.map(mod => (
          <ModuleCard
            key={mod.id}
            mod={mod}
            hovered={hovered}
            onHover={setHovered}
            onEnter={onNavigate}
          />
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        marginTop: 40, paddingTop: 24,
        borderTop: "1px solid #1E293B",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 10, color: "#334155" }}>
          Motor físico trazable · Darcy · Vogel · Colebrook-White · Arrhenius · API RP 11S1
        </div>
        <div style={{ fontSize: 10, color: "#334155" }}>
          Unidades UI: m³/d · m · psi · Hz · °C
        </div>
      </div>
    </div>
  );
}
