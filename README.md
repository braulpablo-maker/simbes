# SIMBES — Simulador Operativo de Bombeo Electrosumergible

> Plataforma de formación práctica para ingenieros de producción junior en sistemas BES/ESP.

---

## Estructura del proyecto

```
simbes/
├── CLAUDE.md                   ← Contexto completo para Claude Code
├── README.md                   ← Este archivo
│
├── backend/                    ← Motor de simulación en Python
│   ├── physics/
│   │   ├── ipr.py              ← Darcy, Vogel, AOF, punto de operación
│   │   ├── hydraulics.py       ← TDH, Colebrook-White, Ns, Leyes de Afinidad
│   │   ├── gas.py              ← GVF, gas lock, AGS, viscosidad
│   │   ├── electrical.py       ← Cable, Arrhenius, THD, NACE
│   │   ├── reliability.py      ← MTBF, exponencial, Chi², censurados
│   │   └── __init__.py
│   ├── api/
│   │   └── main.py             ← FastAPI (opcional — para conectar al frontend)
│   └── tests/
│       └── test_physics.py     ← Tests del motor
│
├── frontend/                   ← App React (interfaz del simulador)
│   └── src/
│       ├── physics/            ← Motor JS (mirrors del Python, funciones puras)
│       │   ├── ipr.js
│       │   ├── hydraulics.js
│       │   ├── gas.js
│       │   ├── electrical.js
│       │   ├── reliability.js
│       │   └── index.js        ← Re-exporta todo
│       ├── components/
│       │   ├── Hub.jsx         ← Mapa de módulos y navegación principal
│       │   ├── modules/
│       │   │   ├── Module1_IPR/        ← ✅ Funcional
│       │   │   ├── Module2_Hydraulics/ ← ✅ Funcional
│       │   │   ├── Module3_Gas/        ← ✅ Funcional
│       │   │   ├── Module4_Electrical/ ← ✅ Funcional
│       │   │   ├── Module5_Sensors/    ← ✅ Funcional
│       │   │   ├── Module6_DIFA/       ← ✅ Funcional
│       │   │   ├── Module7_Reliability/← ✅ Funcional
│       │   │   ├── Module8_Builder/    ← ✅ Funcional
│       │   │   └── Module9_BESDesign/  ← 🧪 Beta (pasos 0–7)
│       │   │       ├── steps/          ← Step0_DataEntry … Step7_Mechanical
│       │   │       ├── physics/        ← candidacy, pip, pump_volume, pump_selector, motor, mechanical
│       │   │       ├── hooks/          ← useBESDesign.js (useReducer, CICLO A–E)
│       │   │       └── data/           ← pump-series.json, motor-catalog.json
│       │   ├── ui/             ← Átomos: Param, Metric, AlertPanel, ControlGroup
│       │   └── charts/         ← Wrappers Recharts: NodalChart
│       ├── data/
│       │   ├── pump-curves.json
│       │   ├── cable-data.json
│       │   ├── failure-library.json
│       │   └── mtbf-benchmarks.json
│       ├── pedagogy/
│       │   ├── levels.js       ← básico / intermedio / avanzado
│       │   ├── prerequisites.js← grafo de dependencias entre módulos
│       │   └── evaluations/
│       │       ├── m1.js       ← Evaluación M1 (IPR / Análisis Nodal)
│       │       ├── m2.js       ← Evaluación M2 (Diseño Hidráulico)
│       │       ├── m3.js       ← Evaluación M3 (Gas y Multifásico)
│       │       ├── m4.js       ← Evaluación M4 (Eléctrico / VSD)
│       │       ├── m5.js       ← Evaluación M5 (Sensores)
│       │       ├── m6.js       ← Evaluación M6 (Diagnóstico DIFA)
│       │       ├── m7.js       ← Evaluación M7 (Confiabilidad / MTBF)
│       │       └── m8.js       ← Evaluación M8 (Constructor de Escenarios)
│       └── App.jsx             ← Raíz: Hub ↔ Módulos, NavBar, navegación prev/next
│
├── notebooks/                  ← Análisis Python por módulo (Jupyter)
│   ├── 01_ipr_nodal.ipynb
│   ├── 02_hydraulics_tdh.ipynb
│   ├── 03_gas_multiphase.ipynb
│   ├── 04_electrical_vsd.ipynb
│   ├── 05_sensors_monitoring.ipynb
│   ├── 06_difa_diagnostics.ipynb
│   ├── 07_reliability_mtbf.ipynb
│   ├── 08_scenario_builder.ipynb
│   └── 09_bes_design.ipynb
│
└── docs/
    └── SIMBES_Arquitectura_v1.0.docx
```

---

## Inicio rápido

### 1. Frontend React

```bash
cd frontend
npm install && npm run dev
# → http://localhost:5173
```

### 2. Backend Python (opcional)

```bash
cd backend
pip install -r requirements.txt

# Verificar motor con tests
pytest tests/ -v

# Levantar API (opcional)
uvicorn api.main:app --reload --port 8000
# → Docs: http://localhost:8000/docs
```

### 3. Notebooks

```bash
cd notebooks
jupyter lab
```

---

## Unidades del simulador

| Magnitud | Unidad UI | Unidad interna (motor físico) |
|---|---|---|
| Caudal | **m³/d** | STB/d · factor: 1 STB = 0.158987 m³ |
| Profundidad | **m** | ft · factor: 1 m = 3.28084 ft |
| GOR | **m³/m³** | scf/STB · factor: 1 m³/m³ = 5.6146 scf/STB |
| Índice de Productividad | **m³/d/psi** | STB/d/psi · factor: 1 m³/d/psi = 6.2898 STB/d/psi |
| Temperatura | **°C** | °F · conversión: °F = °C × 9/5 + 32 |
| Densidad del fluido | **kg/L** | psi/ft · grad = densidad × 0.4335 |
| Presión | psi | psi |
| Frecuencia | Hz | Hz |

> Todas las conversiones ocurren en la capa UI (`useMemo`). El motor físico siempre recibe unidades internas.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 · Vite · Recharts |
| Tipografía | Outfit (UI) + JetBrains Mono (datos/fórmulas) · Google Fonts |
| Motor JS | Funciones puras en `src/physics/` (sin dependencias) |
| Motor Python | Python 3.11+ · numpy · scipy |
| API (opcional) | FastAPI · Pydantic · Uvicorn |
| Notebooks | Jupyter Lab |
| Tests | pytest |

---

## Demo en vivo

**[https://simbes.vercel.app](https://simbes.vercel.app)**

---

## Estado actual — 9 módulos

| Módulo | Estado | Física cubierta |
|---|---|---|
| Hub Principal | ✅ Funcional | Mapa de 9 módulos · navegación · barra de progreso |
| M1 — IPR / Análisis Nodal | ✅ Funcional | Darcy · Vogel · Leyes de Afinidad · 4 sub-pantallas (Teoría / Simulador / Caso Práctico / Evaluación) |
| M2 — Diseño Hidráulico | ✅ Funcional | TDH · Colebrook-White · Velocidad Específica Ns · N° etapas |
| M3 — Gas y Multifásico | ✅ Funcional | GVF · gas lock · separadores AGS · degradación H-Q · corrección viscosidad |
| M4 — Eléctrico / VSD | ✅ Funcional | Caída de voltaje en cable · Arrhenius · THD por topología · NACE MR0175 |
| M5 — Sensores y Monitoreo | ✅ Funcional | Cartas amperimétricas · P/T downhole · vibración (mm/s RMS) |
| M6 — Diagnóstico DIFA | ✅ Funcional | API RP 11S1 · árbol de diagnóstico · códigos 3700/4900/5400/5900 |
| M7 — Confiabilidad / MTBF | ✅ Funcional | R(t) exponencial · MLE con censurados · intervalos Chi² |
| M8 — Constructor de Escenarios | ✅ Funcional | Integración M1–M7 · Arps decline · análisis de plan temporal · comparación de escenarios |
| M9 — Diseño BES (Wizard) | ✅ Funcional (pasos 0–11) | Candidatura 7 criterios · IPR inversa · PIP · volumen real bomba · TDH + selección serie · motor HP/corriente/T° · cable AWG + THD · mecánica OD/dogleg · evaluación de riesgos · set points operativos · validación económica · hoja de selección (export PDF/MD) |

### Mejoras de UX implementadas

- Navegación **← anterior / siguiente →** entre módulos desde la NavBar
- Tabs de módulo con `position: sticky` (no se pierden al hacer scroll)
- Breadcrumb `SIMBES / M# · Nombre` en cada módulo
- Unidades operativas en toda la UI (m³/d, m³/m³, m³/d/psi, °C)
- **Estética Cyber Monitor**: tema oscuro Deep Navy + Electric Cyan (`theme.js` centralizado)
- **Fuente híbrida**: Outfit para UI (headers, tabs, botones) · JetBrains Mono para datos/fórmulas/métricas
- **Pestaña Teoría estandarizada**: `TheoryLayout` accordion en los 9 módulos
- **Code splitting**: módulos cargados con `React.lazy()` (bundle inicial más liviano)
- **Responsive básico**: `clamp()` en padding + `maxWidth: 1300` + scroll horizontal en simuladores
- **Persistencia localStorage**: guardar/cargar escenario en M8 y M9
- **Fricción VLP mejorada (M1)**: Darcy-Weisbach + Colebrook-White reemplaza simplificación `1.4e-5 × Q²`
