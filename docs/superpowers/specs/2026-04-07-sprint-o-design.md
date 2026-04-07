# Sprint O — Guías de Resolución + Desafíos M05/M06/M07

**Fecha:** 2026-04-07
**Alcance:** 2 ítems (PED-007, GAP-001)
**Nota:** PED-006 (feedback por opción incorrecta) ya estaba implementado en los 8 módulos — descartado del sprint.

---

## 1. PED-007 — Guía de resolución en desafíos

### Problema
Los desafíos PBL tienen `hint` (pista) y `explanation` (post-resolución), pero no orientan al usuario sobre los pasos a seguir. Un junior puede no saber por dónde empezar.

### Diseño

**Datos:** Agregar campo `resolution_guide` (array de 3 strings) a cada desafío en `challenges.json`. Cada string es un paso numerado que orienta sin revelar la respuesta.

```json
"resolution_guide": [
  "Abrí el Módulo 2 y cargá Q = 180 m³/d con profundidad 3200 m.",
  "Observá el TDH total calculado en las métricas del simulador.",
  "Dividí TDH_total / H_etapa para determinar el número mínimo de etapas."
]
```

**UI en `DirectedChallengeView`:** Sección expandible entre la Pista y los Botones de acción. Botón "Guía de resolución" que muestra/oculta los 3 pasos. Estado `showGuide` (default: false). Estilo consistente con la Pista pero en tono diferente (color del módulo en vez de amarillo).

**UI en `ChallengeSimulator` (ch1–ch4 de M1):** Misma lógica, sección expandible entre la Pista y los controles del simulador.

### Archivos a modificar
- `frontend/src/data/challenges.json` — agregar `resolution_guide` a los 10 desafíos existentes
- `frontend/src/components/challenges/ModuleChallenges.jsx` — renderizar en ambos componentes

---

## 2. GAP-001 — 6 desafíos nuevos (M05, M06, M07)

### Problema
Los módulos M05 (Sensores), M06 (DIFA) y M07 (Confiabilidad) no tienen desafíos asociados. Son áreas críticas para campo.

### Diseño

6 desafíos nuevos, todos `"simulator": "directed"` (el usuario va al módulo, no hay simulador embebido). IDs: ch11–ch16. Cada uno incluye `resolution_guide` (3 pasos).

#### ch11 — Carta Amperiométrica — Pozo Tucán-4 (M5, intermedio)
- **Escenario:** Corriente oscilante ±20% con picos cada 3 minutos. Presión de succión estable. Caudal cae 15%.
- **Objetivo:** Identificar surging vs gas lock usando el patrón amperiométrico del M5.
- **initial_state:** `{ I_nominal_A: 45, I_oscilacion_pct: 20, Ps_psi: 1200, T_motor_C: 135, vibration_mm_s: 3.2 }`
- **success_criteria:** `{ type: "directed", target_module: "M5", target_value: "Identificar patrón de surging (no gas lock)", description: "Diferencia surging (oscilación periódica simétrica) de gas lock (caída brusca a cero) en la carta amperiométrica." }`

#### ch12 — Vibración Anormal — Pozo Ibis-7 (M5, intermedio)
- **Escenario:** Vibración 5.8 mm/s RMS (sobre umbral de 4 mm/s). Motor a 55 Hz. Corriente estable.
- **Objetivo:** Determinar causa probable y set point de alarma en M5.
- **initial_state:** `{ vibration_mm_s: 5.8, freq_Hz: 55, I_A: 38, T_motor_C: 142, Ps_psi: 980 }`
- **success_criteria:** `{ type: "directed", target_module: "M5", target_value: "vibración > 4 mm/s RMS → alerta — evaluar desbalanceo o rodamiento", description: "Identifica que 5.8 mm/s supera el umbral de alerta (4 mm/s) y evalúa las causas mecánicas probables." }`

#### ch13 — DIFA Código 4900 — Pozo Garza-2 (M6, avanzado)
- **Escenario:** Bomba retirada tras 4 meses. Rodamientos fundidos, sello primario comprometido. T° motor registrada: 178°C (límite 150°C).
- **Objetivo:** Construir árbol de causas en M6 y asignar código API RP 11S1.
- **initial_state:** `{ run_days: 120, T_motor_max_C: 178, T_rated_C: 150, seal_condition: "comprometido", bearing_condition: "fundido", fluid_invasion: true }`
- **success_criteria:** `{ type: "directed", target_module: "M6", target_value: "Código 4900 (falla elastómeros) + causa raíz: sobrecalentamiento", description: "Asigna código 4900 y traza la cadena: sobrecalentamiento → degradación de sello → invasión de fluido → falla de rodamiento." }`

#### ch14 — Reincidencia de Falla — Campo Norte (M6, avanzado)
- **Escenario:** Mismo código de falla (3700 — corrosión) en 3 bombas del mismo pozo en 6 meses. GOR alto, trazas de H₂S.
- **initial_state:** `{ failure_code: 3700, occurrences: 3, period_months: 6, H2S_present: true, GOR_m3m3: 380, material_current: "estándar" }`
- **success_criteria:** `{ type: "directed", target_module: "M6", target_value: "Causa raíz: corrosión por H₂S sin materiales NACE → plan: Lead Sheath + Monel", description: "Identifica que la reincidencia se debe a materiales no aptos para H₂S (NACE MR0175) y propone upgrade de materiales." }`

#### ch15 — MTBF Insuficiente — Pozo Colibrí-8 (M7, intermedio)
- **Escenario:** 12 bombas instaladas en el campo. Tiempos de falla: [45, 120, 180, 90, 250, 60, 310, 150, 200, 75, 280, 130] días. Objetivo: MTBF > 200 días.
- **initial_state:** `{ n_pumps: 12, failure_times_days: [45,120,180,90,250,60,310,150,200,75,280,130], target_MTBF_days: 200 }`
- **success_criteria:** `{ type: "directed", target_module: "M7", target_value: "MTBF ≈ 157.5 días < 200 → no cumple objetivo", description: "Calcula MTBF = ΣT/n ≈ 157.5 días y R(200) ≈ 28% — el campo no alcanza el objetivo de confiabilidad." }`

#### ch16 — Sesgo de Sobrevivencia — Campo Sur (M7, avanzado)
- **Escenario:** 8 bombas, solo 5 fallaron. 3 siguen operando (censuradas) a 400, 500 y 600 días. Sin censura MTBF ≈ 120 días; con censura MTBF sube significativamente.
- **initial_state:** `{ n_total: 8, n_failed: 5, failure_times: [60,90,110,140,200], censored_times: [400,500,600], confidence_pct: 90 }`
- **success_criteria:** `{ type: "directed", target_module: "M7", target_value: "MTBF con censurados ≈ 262 días vs 120 sin censurados — sesgo de 2.2×", description: "Demuestra que ignorar equipos en operación (censurados) subestima el MTBF real en más del doble." }`

### Archivos a modificar
- `frontend/src/data/challenges.json` — agregar ch11–ch16
- `frontend/src/components/Hub.jsx` — actualizar "10 escenarios" → "16 escenarios"

---

## 3. Resumen de archivos

| Archivo | Cambio |
|---|---|
| `frontend/src/data/challenges.json` | +`resolution_guide` en 10 existentes, +6 desafíos nuevos |
| `frontend/src/components/challenges/ModuleChallenges.jsx` | Renderizar `resolution_guide` expandible |
| `frontend/src/components/Hub.jsx` | "10 escenarios" → "16 escenarios" |

**No se tocan:** evaluaciones, módulos, física, TheoryLayout, tema.

---

## 4. Criterios de aceptación

- [ ] Los 16 desafíos tienen `resolution_guide` con 3 pasos cada uno
- [ ] La guía se muestra detrás de botón expandible (no visible por defecto)
- [ ] Los 6 desafíos nuevos aparecen en la grilla del Modo Desafíos
- [ ] El contador del Hub dice "16 escenarios"
- [ ] El contador del Modo Desafíos dice "X/16 resueltos"
- [ ] Build limpio sin errores
