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
- [x] **Sprint G** — CERRADO: "cabeza/cabezal" es terminología técnica correcta para wellhead (Pwh). No hay reemplazo necesario.

---

## Sprint M9-beta — Flujo de Diseño BES (pasos 3–7) ✅ COMPLETADO

### Física nueva (Module9_BESDesign/physics/)
- [x] `pip.js` — `calcPIP(Pwf, gamma, D_total, D_bomba)` + alertas
- [x] `pump_volume.js` — `realPumpVolume(Q, BSW, GOR, PIP, Pb, T)` — volumen real en bomba
- [x] `pump_selector.js` — `selectPumpSeries`, `calcStages`, `checkBEPRatio`, frecuencia óptima
- [x] `motor.js` — HP hidráulico, corriente, velocidad anular, T° motor, shroud, OD
- [x] `mechanical.js` — OD string, holgura, dogleg check

### Datos
- [x] `data/pump-series.json` — 3 series genéricas con OD_in y H_stage_bep_ft
- [x] `data/motor-catalog.json` — 5 tiers HP → V, OD_in, T_rated, η, FP

### Reducer (useBESDesign.js)
- [x] Extender `initialState` con step3–step7
- [x] Agregar `computeStep3` a `computeStep7` (funciones puras)
- [x] Agregar actions: `ADVANCE_TO_STEP_3..7`, `CICLO_A..E`, `COMPLETE_STEP_3..7`

### UI (steps/)
- [x] `Step3_PumpConditions.jsx` — PIP, GVF, separador, corrección viscosidad
- [x] `Step4_TDH_Pump.jsx` — TDH breakdown, selección serie, BEP ratio
- [x] `Step5_Motor.jsx` — HP, voltaje, corriente, velocidad anular, shroud
- [x] `Step6_Cable.jsx` — AWG, caída de voltaje, aislamiento, THD
- [x] `Step7_Mechanical.jsx` — OD string vs casing, holgura, dogleg

### Integración
- [x] `index.jsx` — activar steps 3–7, render cases, badge "BETA"

### Bugfixes M9-beta
- [x] `electrical.js`: agregar claves `multipulse_18` y `multipulse_12` a `VSD_THD`
- [x] `useBESDesign.js`: `arrheniusLifeFactor(...).life_factor` — extrae número del objeto
- [x] `initialState.inputs.IP` default → `4` (m³/d/psi)

### Decisiones técnicas confirmadas M9-beta

| Decisión | Elección |
|---|---|
| GOR conversión | m³/m³ × 178.107 = scf/STB — en `computeStep3`, no en gas.js |
| TDH estática | `H_static = D_bomba - (PIP/gamma)` — override en `computeStep4`, no modifica hydraulics.js |
| V_drop % | `V_drop_V / V_motor × 100` — corregido en `computeStep6` (no usa base 1000V simplificada) |
| Frecuencia óptima CICLO B | `f = 60 × Q_total / Q_bep_60Hz` — fórmula directa sin circularidad |
| OD motor | Lookup table en motor.js por tier HP (no JSON externo, marcado [SIMPLIFIED]) |
| CICLO E | Invalida step4–step7, escribe `OD_max_constraint` en step4, navega a paso 4 |

---

## Sprint M9-alpha — Flujo de Diseño BES (pasos 0–2) ✅ COMPLETADO

> Módulo wizard secuencial. Pwf es INPUT estratégico (no resultado). Color acento: #818CF8 (índigo)

- [x] **M9-1** `candidacy.js` — 7 criterios → veredicto `approved | conditional | rejected`
- [x] **M9-2** `useBESDesign.js` — `useReducer` con acciones UPDATE_INPUT, VALIDATE_STEP_0, ADVANCE_TO_STEP_1..2
- [x] **M9-3** `Step0_DataEntry.jsx` — formulario 4 secciones colapsables, validación inline
- [x] **M9-4** `Step1_Candidacy.jsx` — tabla 7 criterios (✅/⚠️/❌), sistemas alternativos
- [x] **M9-5** `Step2_IPR.jsx` — gráfica IPR + Pwf como ReferenceLine, Q_resultante vertical
- [x] **M9-6** `index.jsx` — wizard shell: sticky steps bar 0–7, breadcrumb, badge BETA
- [x] **M9-7** `App.jsx` + `Hub.jsx` — M9 registrado en rutas, grilla Hub badge BETA

### Decisiones técnicas confirmadas

| Decisión | Elección |
|---|---|
| UI inputs PASO 0 | `<input type="number">` (no sliders) — datos de diseño requieren precisión |
| Pwf | Dato de entrada del usuario (decisión de yacimientos), NO calculado |
| Q_resultante | `iprPwfToQ(Pwf, Pr, Pb, IP)` de `ipr.js`, convertido a m³/d |
| IP en UI | m³/d/psi → convierte a STB/d/psi al llamar a `ipr.js` (`× 6.28981`) |
| GOR en UI | m³/m³ → convierte a scf/STB al llamar a `gas.js` (`× 5.6146`) |
| Estado global | `useReducer` (no múltiples `useState`) — auditable para ciclos A–F futuros |
| Candidacy lógica | Se computa en `ADVANCE_TO_STEP_1` (Q ya disponible de los inputs) |
| Bloqueo duro | `Pwf < 0.10 × Pr` → impide completar PASO 2, usuario debe volver a PASO 0 |

### Criterios de aceptación M9-alpha

- [ ] PASO 0: no se puede avanzar con inputs inválidos (errores inline por campo)
- [ ] PASO 1: criterio ❌ bloquea avance y muestra sistemas alternativos
- [ ] PASO 2: Pwf aparece como línea horizontal en gráfica IPR (no como resultado)
- [ ] PASO 2: Q_resultante y drawdown calculados y mostrados correctamente
- [ ] Tabs bloqueados visualmente para pasos futuros (beta/final)
- [ ] Hub muestra M9 con badge "✅ Disponible"
- [ ] La conversión IP m³/d/psi → STB/d/psi no rompe la física de `ipr.js`

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

---

## Sprint: Estandarización Pestaña Teoría — 2026-03-21

**Objetivo:** Un único componente `TheoryLayout` que reemplaza 3 patrones incompatibles.
**Piloto:** M2 (mejor implementación actual) → validar look → rollout al resto.

### Plan

- [x] Análisis de los 8 módulos (completado — ver propuesta en sesión)
- [x] Crear `TheoryLayout.jsx` en `components/ui/`
- [x] Crear `teoria-data.js` para M2 (piloto)
- [x] Integrar TheoryLayout en M2 — build y validar
- [x] Crear `teoria-data.js` para M1, M3, M4, M5, M6, M7
- [x] Integrar TheoryLayout en M1, M3–M7
- [x] M8 — solo ajuste visual (sin migración de datos)
- [x] Build final limpio

### Estructura de datos por sección

```js
{
  id: string,
  title: string,          // "① Título"
  concepto: string,       // texto pedagógico (Outfit)
  formula: string,        // texto multi-línea (JetBrains Mono)
  variables: [{ sym, unit, desc }],
  regla: string | null,   // badge operativo opcional
  tipo_regla: 'warning' | 'ok' | 'indigo',
}
```

### Criterios de aceptación

- [ ] Todas las pestañas Teoría usan el mismo componente base
- [ ] Fórmulas en JetBrains Mono, texto en Outfit
- [ ] Accordion colapsable, una sección abierta a la vez
- [ ] Variables en tabla compacta 3 columnas
- [ ] Build sin errores
