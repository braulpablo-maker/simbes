# SIMBES — Plan de Trabajo Activo

## Regla permanente: Notebooks por módulo
> **Al finalizar cada módulo, generar el notebook Jupyter correspondiente en `notebooks/`.**
> Nombre: `0N_nombre_modulo.ipynb` (ej. `02_hydraulics_tdh.ipynb`)
> Contenido mínimo: fórmulas explicadas en markdown + implementación Python del motor + ejemplos numéricos trazables + gráficas con matplotlib.

## Sprint actual: M8 → Finalizado ✅

### ✅ Completado
- [x] Estructura de carpetas completa (frontend/src/physics, ui, charts, data, pedagogy)
- [x] Hub principal con 8 tarjetas de módulos y navegación
- [x] App.jsx con navegación Hub ↔ Módulos
- [x] M1: Motor de simulación (Darcy, Vogel, Leyes de Afinidad)
- [x] M1: Panel de teoría con 6 tabs (Help)
- [x] M1: Unidades m³/d y m (metros)
- [x] M1: Slider densidad fluido en kg/L con conversión grad = densidad × 0.4335
- [x] Física JS: ipr.js, hydraulics.js, gas.js, electrical.js, reliability.js, index.js
- [x] UI atoms: Param, Metric, AlertPanel, ControlGroup, SectionToggle
- [x] Placeholders M2–M8 con ComingSoon
- [x] Datos: pump-curves.json, cable-data.json, failure-library.json, mtbf-benchmarks.json
- [x] Pedagogía: levels.js, prerequisites.js, evaluations/m1.js

### ✅ Completado (este sprint)
- [x] **M1-tooltips**: Hints visibles debajo de cada slider (Pr, Pb, IP, depth, Pwh, densidad, freq)
- [x] **M1-sub-pantallas**: SIMBES_Modulo1.jsx reestructurado con 4 tabs
  - Tab A — Teoría Contextual: 6 secciones con sidebar (Análisis Nodal, Darcy, Vogel+AOF, VLP, Leyes de Afinidad, Glosario)
  - Tab B — Simulador Interactivo: vista actual + hints en sliders
  - Tab C — Caso Práctico: Pozo Colibrí-3 con 3 pasos guiados (60/55/65 Hz)
  - Tab D — Evaluación: 5 preguntas, calificación automática, feedback por pregunta
- [x] Actualizar README

### ✅ Completado (sprint M2)
- [x] **M2-build**: Módulo 2 — TDH + Colebrook-White + Ns + etapas (4 tabs: Teoría/Simulador/Caso Práctico/Evaluación)
- [x] **M2-notebook**: `notebooks/02_hydraulics_tdh.ipynb` generado
- [x] Hub: M2 badge → "✅ Disponible"

### ✅ Completado (sprint M3)
- [x] **M3-build**: Módulo 3 — GVF + gas lock + AGS + degradación H-Q + corrección HI (4 tabs)
- [x] **M3-notebook**: `notebooks/03_gas_multiphase.ipynb` generado
- [x] Hub: M3 badge → "✅ Disponible"

### ✅ Completado (sprint M4)
- [x] **M4-build**: Módulo 4 — Cable + Arrhenius + THD/IEEE519 + NACE MR0175 (4 tabs)
- [x] **M4-notebook**: `notebooks/04_electrical_vsd.ipynb` generado
- [x] Hub: M4 badge → "✅ Disponible"

### ✅ Completado (sprint M5)
- [x] **M5-build**: Módulo 5 — Cartas amperimétricas + vibración + P/T downhole + diagnóstico integrado (4 tabs)
- [x] **M5-notebook**: `notebooks/05_sensors_monitoring.ipynb` generado
- [x] Hub: M5 badge → "✅ Disponible"

### ✅ Completado (sprint M6)
- [x] **M6-build**: Módulo 6 — Diagnóstico DIFA / API RP 11S1 (motor de matching, 8 patrones, 4 tabs)
- [x] **M6-notebook**: `notebooks/06_difa_diagnostics.ipynb` generado
- [x] Hub: M6 badge → "✅ Disponible" · Progreso → 6/8 módulos (75%)

### ✅ Completado (sprint M7)
- [x] **M7-build**: Módulo 7 — R(t), MTBF MLE, IC Chi², sesgo de sobrevivencia (4 tabs)
- [x] **M7-notebook**: `notebooks/07_reliability_mtbf.ipynb` generado
- [x] Hub: M7 badge → "✅ Disponible" · Progreso → 7/8 módulos (87.5%)

### ✅ Completado (sprint M8)
- [x] **M8-build**: Módulo 8 — Constructor de Escenarios (integración M1–M7, 4 tabs: Teoría/Constructor/Comparación/Evaluación)
- [x] **M8-notebook**: `notebooks/08_scenario_builder.ipynb` generado
- [x] Hub: M8 badge → "✅ Disponible" · Progreso → 8/8 módulos (100%)

### ✅ Completado (sprints UX A–D)
- [x] **Sprint A** — Sticky tabs en M1–M8 (`position:sticky, top:40, zIndex:100`), títulos 21px, contraste GVF gauge M3
- [x] **Sprint B** — XAxis sin decimales (`tickFormatter={v => Math.round(v)}`) en M2 y M3
- [x] **Sprint C** — Navegación prev/next entre módulos en NavBar; App.jsx con `MODULE_ORDER`
- [x] **Sprint D** — Conversión de unidades UI: GOR m³/m³ (M3 y M8), T° °C (M3 y M8), IP m³/d/psi (M8)
- [x] Hub barra de progreso: 7/8 → 8/8 módulos (100%)
- [x] Escala GOR: 0–5000 m³/m³ en M3 y M8

### ✅ Completado (Sprint H — Modo Plan · Arps)
- [x] `computeSystemFast()` — motor nodal sin chartData para iteración rápida en serie de tiempo
- [x] `arpsQ(qi, Di, b, t)` — curvas Arps (exponencial / hiperbólica / armónica)
- [x] `findPrForRate()` — bisección para hallar Pr(t) dado q_arps(t)
- [x] `computePlanTimeSeries()` — loop mensual completo
- [x] `TabPlan` — Tab E en M8 con: controles Arps + Sistema BES + panel Eventos Clave + 5 gráficas (Q, Pwf, GVF, Corriente, Vibración proxy, R(t))
- [x] README actualizado: todos los módulos ✅, 8 notebooks, tabla unidades completa

### ⏳ Pendiente
- [ ] **M4-bug**: `sim.nace.applicable_standards.join` → TypeError en Tab Simulador de M4
- [ ] **Sprint E** — M1: contenido teoría VLP, ecuación BEP, detalle Leyes de Afinidad, caso 45 m³/d
- [ ] **Sprint F** — M2: gráfica 3 tipos de impulsor (radial / mixto / axial) en tab Teoría
- [ ] **Sprint G** — Reemplazo global "cabeza" → "altura" en toda la app

## Criterios de aceptación por ítem

### M1-tooltips
- Cada Param muestra tooltip al hover (o siempre visible debajo del slider)
- Tooltip incluye: definición, unidad, rango típico en campo
- Sin cambios en la lógica de cálculo

### M1-sub-pantallas
- 4 tabs navegables en la parte superior del módulo
- Tab B es la vista actual (funcional)
- Tab A tiene toda la teoría organizada (Darcy / Vogel / Leyes de Afinidad)
- Tab C tiene escenario concreto con parámetros predefinidos y preguntas guiadas
- Tab D carga las preguntas de m1.js y califica en tiempo real

### M2-build
- TDH calculado como: estática + fricción (Colebrook-White) + contrapresión
- Selector de tipo de impulsor por Ns
- Número de etapas = TDH_requerida / head_por_etapa
- Curva H-Q vs. curva de sistema graficada con Recharts
