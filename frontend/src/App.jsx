// SIMBES — App root con navegación Hub ↔ Módulos
import { useState } from "react";
import Hub from "./components/Hub.jsx";
import M1  from "./components/modules/Module1_IPR/SIMBES_Modulo1.jsx";
import M2  from "./components/modules/Module2_Hydraulics/index.jsx";
import M3  from "./components/modules/Module3_Gas/index.jsx";
import M4  from "./components/modules/Module4_Electrical/index.jsx";
import M5  from "./components/modules/Module5_Sensors/index.jsx";
import M6  from "./components/modules/Module6_DIFA/index.jsx";
import M7  from "./components/modules/Module7_Reliability/index.jsx";
import M8  from "./components/modules/Module8_Builder/index.jsx";

const MODULES = { m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6, m7: M7, m8: M8 };
const MODULE_ORDER = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];

const MODULE_LABELS = {
  m1: "M1 · Análisis Nodal",   m2: "M2 · Diseño Hidráulico",
  m3: "M3 · Gas y Multifásico", m4: "M4 · Eléctrico · VSD",
  m5: "M5 · Sensores",         m6: "M6 · Diagnóstico DIFA",
  m7: "M7 · Confiabilidad",    m8: "M8 · Constructor",
};

const BTN = {
  background: "transparent", border: "1px solid #1E293B",
  color: "#64748B", fontSize: 10, padding: "4px 12px",
  borderRadius: 4, cursor: "pointer", fontFamily: "IBM Plex Mono, monospace", letterSpacing: 1,
};

function NavBar({ moduleId, onBack, onPrev, onNext }) {
  return (
    <div style={{
      background: "#0B0F1A", borderBottom: "1px solid #1E293B",
      padding: "8px 24px", display: "flex", alignItems: "center", gap: 12,
      fontFamily: "IBM Plex Mono, monospace",
      position: "sticky", top: 0, zIndex: 200,
    }}>
      <button onClick={onBack} style={BTN}>← HUB</button>
      <div style={{ width: 1, height: 16, background: "#1E293B" }} />
      <span style={{ fontSize: 10, color: "#38BDF8", letterSpacing: 1 }}>SIMBES</span>
      <span style={{ fontSize: 10, color: "#475569" }}>
        / {MODULE_LABELS[moduleId] || moduleId.toUpperCase()}
      </span>
      <div style={{ flex: 1 }} />
      <button onClick={onPrev} disabled={!onPrev} style={{ ...BTN, opacity: onPrev ? 1 : 0.3, cursor: onPrev ? "pointer" : "default" }}>
        ← anterior
      </button>
      <button onClick={onNext} disabled={!onNext} style={{ ...BTN, opacity: onNext ? 1 : 0.3, cursor: onNext ? "pointer" : "default" }}>
        siguiente →
      </button>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState(null); // null = Hub

  if (!activeModule) return <Hub onNavigate={setActiveModule} />;

  const idx = MODULE_ORDER.indexOf(activeModule);
  const goTo = (id) => setActiveModule(id);
  const onPrev = idx > 0 ? () => goTo(MODULE_ORDER[idx - 1]) : null;
  const onNext = idx < MODULE_ORDER.length - 1 ? () => goTo(MODULE_ORDER[idx + 1]) : null;

  const ModuleComponent = MODULES[activeModule];
  return (
    <div>
      <NavBar moduleId={activeModule} onBack={() => setActiveModule(null)} onPrev={onPrev} onNext={onNext} />
      <ModuleComponent onBack={() => setActiveModule(null)} />
    </div>
  );
}
