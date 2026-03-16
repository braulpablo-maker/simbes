# SIMBES — Contexto Completo del Proyecto para Claude Code

> **Propósito de este documento:** Transferencia total de contexto de sesión de diseño arquitectural al entorno de desarrollo. Úsalo como `CLAUDE.md` en la raíz del repositorio o pásalo como contexto inicial en Claude Code CLI.

---

## 0. Cómo usar este archivo

```bash
# Opción A — como CLAUDE.md persistente
cp SIMBES_context_for_claude_code.md CLAUDE.md

# Opción B — como contexto inicial en sesión
claude --context SIMBES_context_for_claude_code.md

# Opción C — referencia durante desarrollo
# Incluir en el system prompt de cada sesión de trabajo
```

Este archivo debe ser la **fuente de verdad** del proyecto durante la fase de desarrollo. Actualízalo con cada decisión técnica relevante que se tome.

---

## 1. Descripción del Producto

**SIMBES** (Simulador de Bombeo Electrosumergible) es una aplicación web interactiva para la formación práctica de ingenieros de producción junior en sistemas BES/ESP (Electrical Submersible Pump).

| Atributo | Valor |
|---|---|
| **Tipo** | Web app de simulación operativa |
| **Stack actual** | React (JSX) + Recharts + Tailwind |
| **Estado** | Prototipo funcional Módulo 1 completado |
| **Audiencia** | Ingenieros de producción junior (0–3 años exp.) |
| **Objetivo pedagógico** | Reducir curva de competencia de 18–24 meses a 6–9 meses |
| **Enfoque** | Simulación interactiva causa-efecto, NO herramienta de diseño de ingeniería de detalle |

---

## 2. Dominio Técnico — BES/ESP

SIMBES modela los siguientes subsistemas físicos. **Todo cálculo debe ser trazable a una de estas fuentes.**

### 2.1 Análisis Nodal e IPR

El **Análisis Nodal** (Joe Mach, 1979) divide el sistema de producción en dos subsistemas que se intersectan en un nodo (fondo del pozo):

- **IPR** — Inflow Performance Relationship: capacidad de entrega del yacimiento
- **VLP** — Vertical Lift Performance: demanda energética de la infraestructura

#### Modelo Darcy (zona lineal, Pwf ≥ Pb)

```
Q = IP × (Pr − Pwf)
```

- `Q` = caudal volumétrico (STB/d)
- `IP` = Índice de Productividad (STB/d/psi)
- `Pr` = presión estática del reservorio (psi)
- `Pwf` = presión fluyente de fondo (psi)
- `Pb` = presión de burbuja (psi)

Válido mientras `Pwf ≥ Pb` (todo el gas permanece disuelto).

#### Modelo Vogel (zona bifásica, Pwf < Pb)

```
Q / AOF = 1 − 0.2·(Pwf/Pb) − 0.8·(Pwf/Pb)²
```

- `AOF` = Absolute Open Flow = máximo caudal teórico a Pwf = 0
- Compuesto Darcy + Vogel: `AOF = Qb + (IP·Pb)/1.8`
  donde `Qb = IP × max(Pr − Pb, 0)`

#### Modelo Fetkovich (referencia, no implementado aún)

```
Q = C × (Pr² − Pwf²)^n     [n = 0.5 para crudos saturados]
```

### 2.2 Hidráulica de la Bomba Centrífuga Multietapa

#### TDH — Total Dynamic Head

```
TDH = H_neta_estática + H_fricción + H_contrapresión
```

#### Pérdidas por fricción — Darcy-Weisbach

```
hf = f × (L/D) × (v²/2g)
```

Factor de fricción `f` → ecuación **Colebrook-White** (flujo turbulento):

```
1/√f = −2·log₁₀(ε/(3.7D) + 2.51/(Re·√f))
```

#### Velocidad Específica (Ns) — geometría del impulsor

```
Ns = N × Q^0.5 / H^0.75
```

- `N` = rpm
- `Q` = caudal en BEP
- `H` = altura por etapa en BEP

| Rango Ns (unidades US) | Tipo de impulsor |
|---|---|
| < 1500 | Radial puro |
| 1500–4500 | Flujo mixto (mayoría BES modernos) |
| > 4500 | Axial |

#### Leyes de Afinidad (variación de frecuencia VSD)

```
Q₂/Q₁ = f₂/f₁
H₂/H₁ = (f₂/f₁)²
P₂/P₁ = (f₂/f₁)³
```

Estas leyes son el mecanismo principal de optimización del punto de operación en SIMBES.

### 2.3 Gas, Viscosidad y Flujo Multifásico

- **GVF** (Gas Volume Fraction) en succión: calculado a partir de GOR superficial, presión de succión y Pb
- **Gas lock**: ocurre típicamente cuando GVF > 15% sin separación activa
- **Degradación de curva H-Q**: factor multiplicativo sobre la curva base; referencia empírica de fabricantes
- **Corrección de viscosidad**: Hydraulic Institute correction factors (tablas) aplicados a H, Q y eficiencia
- **Separadores**: AGS (Rotary Gas Separator) pasivo vs. gas handler activo

### 2.4 Sistema Eléctrico

#### Caída de voltaje en cable (corrección por temperatura)

```
V_drop = I × R_T
R_T = R_20 × (1 + α×(T − 20))
```

- `α` para cobre ≈ 0.00393 /°C
- `T` incluye gradiente geotérmico + efecto Joule

#### Regla de Arrhenius (degradación de aislamiento)

```
τ₂/τ₁ = 2^((T₁−T₂)/10)
```

> **"Por cada 10°C sobre el límite nominal, la vida útil del aislamiento se reduce a la mitad."**

#### THD y normativa IEEE 519-2014

| Topología VSD | THD típico |
|---|---|
| Estándar (6 pulsos) | 25–35% |
| Multipulso 12 pulsos | 15–20% |
| Multipulso 18 pulsos | < 5% |
| AFE (Active Front End) | < 3% |

Límite IEEE 519-2014: **THDv < 5%** en el Punto de Acoplamiento Común (PCC).

#### Selección de materiales — NACE MR0175 / ISO 15156

| Condición | Material requerido |
|---|---|
| T° > 140°C | EPDM o PEEK (no NBR) |
| Presencia de H₂S (gas amargo) | Lead Sheath + Monel 400 |
| Solventes | PEEK o equivalente |

### 2.5 Motores

| Tipo | Ventaja | Desventaja |
|---|---|---|
| Inducción (estándar) | Robusto, bajo costo | Eficiencia baja a carga parcial |
| Imanes Permanentes (PMM) | Alta eficiencia a baja frecuencia | Mayor costo, requiere VSD dedicado |

### 2.6 Diagnóstico de Fallas — Metodología DIFA / API RP 11S1

Estándar API RP 11S1 ("Recommended Practice for Electrical Submersible Pump Teardown Report").

#### Códigos de observación relevantes

| Serie | Tipo de daño |
|---|---|
| 3700 | Corrosión / Picadura |
| 4900 | Falla de elastómeros primarios (sello) |
| 5400 | Falla de sellos secundarios |
| 5900 | Falla de sellos terciarios / invasión de fluidos |

#### Umbrales de vibración (sensores piezoeléctricos)

- Alerta temprana: **> 4 mm/s RMS** (velocidad radial/axial)
- Paro inmediato: picos sostenidos > umbral de fabricante
- Causas típicas: desbalanceo, rodamiento triturado, cavitación (surging)

### 2.7 Confiabilidad y MTBF

#### Distribución exponencial (tasa de falla constante)

```
R(t) = e^(−t/MTBF) = e^(−λt)
```

**Resultado clave**: probabilidad de alcanzar el MTBF nominal = **e⁻¹ ≈ 36.77%**

#### Datos censurados (crítico para evitar sesgo de sobrevivencia)

- **Censura Tipo I**: ensayo truncado a tiempo fijo
- **Censura Tipo II**: ensayo truncado al alcanzar `r` fallas de `n` equipos

#### Intervalos de confianza — Distribución Chi-cuadrado (χ²)

```
MTBF_lower = 2T / χ²(α/2, 2r+2)
MTBF_upper = 2T / χ²(1−α/2, 2r)
```

donde `T` = tiempo total acumulado de operación (incluyendo censurados), `r` = número de fallas.

---

## 3. Arquitectura del Producto

### 3.1 Módulos (8 en total)

| # | Módulo | Física cubierta | Estado |
|---|---|---|---|
| 1 | **IPR / Análisis Nodal** | Darcy, Vogel, Leyes de Afinidad | ✅ Prototipo funcional |
| 2 | Diseño Hidráulico | TDH, Colebrook-White, Ns, BEP | 🔲 Por construir |
| 3 | Gas y Multifásico | GVF, gas lock, AGS, viscosidad | 🔲 Por construir |
| 4 | Eléctrico / VSD | Cable, THD, Arrhenius, NACE | 🔲 Por construir |
| 5 | Sensores y Monitoreo | Cartas amperimétricas, P/T/vibración | 🔲 Por construir |
| 6 | Diagnóstico DIFA | API RP 11S1, árbol de fallas | 🔲 Por construir |
| 7 | Confiabilidad / MTBF | Exponencial, censurados, Chi² | 🔲 Por construir |
| 8 | Constructor de Escenarios | Integración de todos los módulos | 🔲 Por construir |

### 3.2 Capas Lógicas del Sistema

```
┌─────────────────────────────────────────────────────┐
│  CAPA 1 — Frontend React                            │
│  Controles interactivos, gráficas, alertas, UI      │
├─────────────────────────────────────────────────────┤
│  CAPA 2 — Capa Pedagógica                           │
│  Niveles básico/intermedio/avanzado, evaluaciones,  │
│  prerequisitos, logros, retroalimentación           │
├─────────────────────────────────────────────────────┤
│  CAPA 3 — Motor de Simulación                       │
│  Cálculos físicos: IPR, TDH, GVF, VSD, MTBF, DIFA  │
│  Todo trazable al material técnico base             │
├─────────────────────────────────────────────────────┤
│  CAPA 4 — Base de Conocimiento BES                  │
│  Curvas H-Q tipo, propiedades PVT, parámetros de    │
│  cable/motor, patrones de falla, benchmarks MTBF    │
├─────────────────────────────────────────────────────┤
│  CAPA 5 — Analítica y Evaluación                    │
│  Tracking de progreso, métricas de aprendizaje,     │
│  reportes para instructores                         │
└─────────────────────────────────────────────────────┘
```

### 3.3 Navegación de la App

```
Login / Perfil
    └── Hub Principal (mapa de módulos + progreso)
            ├── Módulo N
            │       ├── A. Teoría Contextual (concepto + fórmula + animación)
            │       ├── B. Simulador Interactivo (controles + gráfica + alertas)
            │       ├── C. Caso Práctico (escenario de campo guiado)
            │       ├── D. Evaluación (simulación calificada + feedback)
            │       └── E. Glosario del Módulo
            └── Constructor de Escenarios (modo libre, integrador)
```

---

## 4. Estado Actual del Código — Módulo 1

### 4.1 Archivo entregado

`SIMBES_Modulo1.jsx` — React, funciona en claude.ai artifact viewer y en cualquier proyecto Vite/CRA con Recharts.

### 4.2 Motor de simulación implementado (Módulo 1)

```javascript
// ── Funciones del motor ──────────────────────────────

// AOF: caudal máximo teórico (Pwf = 0)
calcAOF(Pr, Pb, IP)
// → qb = IP × max(Pr − Pb, 0)  [zona Darcy]
// → AOF = qb + (IP × Pb) / 1.8  [suma zona Vogel]

// IPR forward: dado Pwf → Q
iprPwfToQ(Pwf, Pr, Pb, IP)
// Darcy si Pwf ≥ Pb, Vogel si Pwf < Pb

// IPR inverse: dado Q → Pwf  (para construir la curva)
iprQtoPwf(Q, Pr, Pb, IP)
// Zona Darcy: Pwf = Pr − Q/IP
// Zona Vogel: resolución cuadrática de la ecuación de Vogel

// Curva H-Q de la bomba (multietapa representativa)
pumpHeadFt(Q, freq, H0=8500, Qmax=4200)
// Aplica Leyes de Afinidad: Qref = Q/(f/60), Href = H0×(1−(Qref/Qmax)^1.85)
// Devuelve H escaleado: Href × (f/60)²

// VLP: Pwf mínimo para sostener caudal Q
vlpPwf(Q, depth, Pwh, freq, grad)
// = Pwh + grad×depth − pumpPsi + frictionPsi
// frictionPsi = 1.4e−5 × Q² (Darcy-Weisbach simplificado)

// Punto de operación: IPR ∩ VLP (bisección numérica)
findOpPoint(Pr, Pb, IP, depth, Pwh, freq, grad)
// Escanea 2000 puntos, detecta cruce de signo en (IPR−VLP)
// Interpola linealmente para precisión

// BEP a frecuencia dada
bepQ(freq)  // = 2100 × (freq/60)  [STB/d]
```

### 4.3 Parámetros de entrada del Módulo 1

| Variable | Rango | Unidad | Control UI |
|---|---|---|---|
| `Pr` | 500–7000 | psi | Slider |
| `Pb` | 100–(Pr−50) | psi | Slider |
| `IP` | 0.1–10 | STB/d/psi | Slider |
| `depth` | 1000–14000 | ft | Slider |
| `Pwh` | 50–1000 | psi | Slider |
| `freq` | 30–70 | Hz | Slider |
| `grad` | 0.30–0.50 | psi/ft | Slider |

### 4.4 Salidas visualizadas (Módulo 1)

- Gráfica Recharts: curva IPR (azul) + VLP (verde) + Punto de operación (rojo) + línea Pb (amarillo) + BEP (rosa)
- Métricas en tiempo real: Q operativo, Pwf operativo, Drawdown %, AOF, BEP
- Panel de diagnóstico con alertas automáticas:
  - 🟢 OK: rango óptimo con % del BEP y drawdown
  - 🟡 WARNING: Pwf < 25% Pb (riesgo gas), operación < 68% BEP (recirculación), > 132% BEP (surging)
  - 🔴 DANGER: sin punto de operación, drawdown > 82%
- Panel de teoría desplegable (Darcy / Vogel / Leyes de Afinidad)
- Desglose IPR: zona Darcy vs. zona Vogel vs. AOF total

### 4.5 Decisiones de implementación tomadas

- La curva H-Q es **representativa genérica** (H0=8500 ft, Qmax=4200 STB/d a 60 Hz). No corresponde a ningún fabricante específico. Debe documentarse como tal en la UI.
- La fricción VLP usa `1.4e-5 × Q²` (simplificación educativa válida para rangos típicos BES). En Módulo 2 se implementará Colebrook-White completo.
- El BEP se estima linealmente con la frecuencia (`2100 × f/60`). Aproximación válida para propósito pedagógico.

---

## 5. Roadmap de Desarrollo

### Fase 1 — MVP (0–6 meses)

**Objetivo**: validar el concepto pedagógico con 10–20 usuarios reales.

| Tarea | Descripción | Prioridad |
|---|---|---|
| `M1-polish` | Ajustar diseño visual del Módulo 1, agregar tooltips explicativos por variable | Alta |
| `M1-pedagogy` | Implementar sub-pantallas: Teoría → Simulador → Caso Práctico → Evaluación | Alta |
| `M2-build` | Módulo 2: TDH completo con Colebrook-White, selector de impulsor por Ns, N° etapas | Alta |
| `M3-basic` | Módulo 3 básico: cálculo de GVF en succión, degradación de curva H-Q | Media |
| `M4-basic` | Módulo 4 básico: caída de voltaje en cable + impacto de frecuencia VSD | Media |
| `hub-build` | Hub principal con mapa de módulos y tracking de progreso | Alta |
| `eval-system` | Sistema de evaluación simple por módulo (preguntas + simulación calificada) | Media |

### Fase 2 — Simulaciones Avanzadas (6–14 meses)

| Tarea | Descripción |
|---|---|
| `M3-full` | Gas lock completo, AGS, gas handler, corrección de viscosidad |
| `M4-full` | Regla de Arrhenius, THD por topología VSD, NACE MR0175 |
| `M5-build` | Módulo 5: cartas amperimétricas, dashboard sensores downhole, vibración |
| `M6-build` | Módulo 6: casos DIFA, árbol de diagnóstico, codificación API RP 11S1 |
| `M8-build` | Constructor de Escenarios: integración completa de todos los módulos |
| `export-pdf` | Exportación de resultados de simulación a PDF |
| `compare-mode` | Modo Comparación: dos escenarios en pantalla dividida |

### Fase 3 — Analítica y Personalización (14–24 meses)

| Tarea | Descripción |
|---|---|
| `M7-build` | Módulo 7: MTBF, datos censurados, curva de supervivencia, intervalos Chi² |
| `analytics-dashboard` | Dashboard para instructores: progreso de cohorte, brechas por módulo |
| `personalization` | Rutas de aprendizaje adaptativas por perfil y desempeño |
| `lms-integration` | Integración SCORM/xAPI con LMS corporativos |
| `field-api` | API para ingesta de datos reales de campo (opcional) |

---

## 6. Convenciones del Proyecto

### 6.1 Estructura de archivos propuesta

```
simbes/
├── CLAUDE.md                    ← este archivo
├── src/
│   ├── physics/                 ← motor de simulación (pure functions)
│   │   ├── ipr.js               ← Darcy, Vogel, AOF
│   │   ├── hydraulics.js        ← TDH, Colebrook-White, Ns, Leyes de Afinidad
│   │   ├── gas.js               ← GVF, degradación H-Q, viscosidad
│   │   ├── electrical.js        ← cable, VSD, THD, Arrhenius
│   │   ├── reliability.js       ← MTBF, exponencial, Chi², censurados
│   │   └── index.js             ← re-exporta todo
│   ├── components/
│   │   ├── modules/
│   │   │   ├── Module1_IPR/
│   │   │   ├── Module2_Hydraulics/
│   │   │   ├── Module3_Gas/
│   │   │   ├── Module4_Electrical/
│   │   │   ├── Module5_Sensors/
│   │   │   ├── Module6_DIFA/
│   │   │   ├── Module7_Reliability/
│   │   │   └── Module8_Builder/
│   │   ├── ui/                  ← átomos: Param, Metric, Alert, ControlGroup
│   │   └── charts/              ← wrappers de Recharts
│   ├── data/
│   │   ├── pump-curves.json     ← curvas H-Q representativas por rango de caudal
│   │   ├── cable-data.json      ← resistencia por AWG y temperatura
│   │   ├── failure-library.json ← patrones de falla DIFA
│   │   └── mtbf-benchmarks.json ← MTBF de referencia por ambiente
│   ├── pedagogy/
│   │   ├── levels.js            ← lógica básico/intermedio/avanzado
│   │   ├── prerequisites.js     ← grafo de dependencias entre módulos
│   │   └── evaluations/         ← rúbricas y casos por módulo
│   └── App.jsx
├── tests/
│   └── physics/                 ← unit tests para cada función del motor
└── package.json
```

### 6.2 Reglas del motor de simulación

1. **Todas las funciones del motor son puras** (sin side effects, sin estado global).
2. **Cada función documenta su fuente** con JSDoc: `@ref Darcy 1856`, `@ref Vogel 1968`, etc.
3. **Las unidades son explícitas** en el nombre de la variable o en el JSDoc: `Q_stbd`, `H_ft`, `P_psi`.
4. **Ningún cálculo es una caja negra**. Si se usa una curva empírica, se documenta como tal y se indica el rango de validez.
5. **Las simplificaciones educativas se marcan** con el comentario `// [SIMPLIFIED: reason]`.

### 6.3 Reglas de UI/UX

- Cada slider debe mostrar el valor actual en tiempo real (sin submit).
- Cada variable debe tener un tooltip con: definición, unidad, rango típico en campo.
- Las alertas deben ser **explicativas**, no solo de color. Deben decir qué pasó, por qué importa y qué hacer.
- El usuario **nunca ve una ecuación sin contexto**. Toda fórmula va acompañada de una descripción en lenguaje operativo.
- El panel de teoría es **siempre colapsable** para no saturar la pantalla de trabajo.

### 6.4 Paleta de colores (tema oscuro industrial)

```javascript
const colors = {
  background:  "#0B0F1A",   // fondo principal
  surface:     "#111827",   // paneles/cards
  surfaceAlt:  "#0D1424",   // charts
  border:      "#1E293B",   // bordes
  text:        "#CBD5E1",   // texto principal
  textMuted:   "#64748B",   // etiquetas secundarias
  // Curvas y acentos
  ipr:         "#38BDF8",   // curva IPR (azul)
  vlp:         "#34D399",   // curva VLP (verde)
  bep:         "#F472B6",   // BEP / VSD (rosa)
  pb:          "#FBBF24",   // Presión de burbuja (amarillo)
  opPoint:     "#FB7185",   // Punto de operación (rojo)
  // Grupos de controles
  reservoir:   "#60A5FA",   // parámetros de yacimiento
  geometry:    "#34D399",   // geometría del pozo
  vsd:         "#F472B6",   // VSD / eléctrico
  // Alertas
  ok:          "#22C55E",
  warning:     "#F59E0B",
  danger:      "#EF4444",
};
```

### 6.5 Fuente tipográfica

`IBM Plex Mono` (Google Fonts) — coherente con estética industrial/técnica del simulador.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700;800&display=swap" rel="stylesheet">
```

---

## 7. Restricciones y Decisiones Pendientes

### 7.1 Restricciones de diseño (NO negociables)

- ❌ No escribir código de ingeniería de detalle (PIPESIM, OFM, software de fabricante)
- ❌ No inventar física fuera del material base documentado
- ❌ No usar curvas de fabricantes reales sin licencia explícita
- ❌ No crear interfaz puramente informativa (toda pantalla debe tener interacción)
- ❌ No mostrar ecuaciones sin contexto operativo explicativo

### 7.2 Decisiones de arquitectura pendientes (deben tomarse antes de Fase 2)

| Decisión | Opciones | Impacto |
|---|---|---|
| Motor de simulación | Reglas + lookup tables vs. ecuaciones diferenciales en tiempo real | Complejidad de desarrollo, fidelidad |
| Curvas de equipos | Ficticias genéricas vs. licenciadas de fabricante | Legal, realismo |
| Modo de despliegue | 100% browser (web app) vs. offline (PWA/Electron) | Arquitectura de datos |
| LMS integration | SCORM 1.2 vs. xAPI (Tin Can) | Interoperabilidad corporativa |
| Autenticación | Simple (email/pass) vs. SSO corporativo | Adopción enterprise |

### 7.3 Supuestos explícitos del Módulo 1

- La bomba representativa opera entre 0 y 4200 STB/d a 60 Hz con cabeza máxima de 8500 ft.
- El BEP escala linealmente con la frecuencia (`2100 × f/60`). Aproximación válida ±5% para propósito educativo.
- La fricción en VLP usa `1.4e-5 × Q²`. Válido para tubing de 2.875" a 3.5" en rangos típicos BES.
- El gradiente de fluido se asume uniforme a lo largo de la columna (sin segregación ni cambio de fase en tubing).

---

## 8. Métricas de Éxito del MVP

| Métrica | Valor objetivo | Instrumento |
|---|---|---|
| Adopción | > 70% del grupo piloto completa ≥ 2 módulos en 30 días | Analytics |
| Aprendizaje | > 25% mejora en score entre 1er y 2do intento del mismo módulo | Evaluaciones |
| Precisión conceptual | > 80% respuestas correctas en diagnóstico DIFA (3er intento) | Módulo 6 |
| Engagement | > 18 min de sesión activa promedio | Analytics de comportamiento |
| Transferencia | > 65% reportan aplicación de conceptos en trabajo real (encuesta 60 días) | Survey |

---

## 9. Comandos de Trabajo Frecuentes para Claude Code

```bash
# Ver estado del proyecto
ls -la src/physics/ src/components/modules/

# Correr tests del motor de simulación
npm test -- --testPathPattern=physics

# Verificar que una nueva función cumple con las restricciones
# (pura, documentada, con unidades explícitas)
claude "revisa que la función X en src/physics/hydraulics.js cumple las reglas del motor definidas en CLAUDE.md sección 6.2"

# Construir el siguiente módulo
claude "implementa el Módulo 2 (Diseño Hidráulico) siguiendo la arquitectura de src/components/modules/Module1_IPR/ como referencia y las fórmulas de la sección 2.2 de CLAUDE.md"

# Agregar un caso de falla al Módulo 6
claude "agrega un nuevo caso de falla DIFA en src/data/failure-library.json para el patrón: subcarga sostenida → desgaste de cojinetes radiales → código API RP 11S1 serie 3700"
```

---

## 10. Referencias Técnicas del Material Base

| Tema | Fuente |
|---|---|
| Análisis Nodal / IPR | Nodal Analysis — whitson+ User Manual (https://manual.whitson.com/modules/well-performance/nodal-analysis/) |
| Separación gas-líquido BES | Evaluation and simulation of gas-liquid separation — SPE Brazil FATC 2022 |
| AFE vs. filtros activos (THD) | Technical Note 060 — ABB Library (Active Front End vs. Active Filter Solutions) |
| API RP 11S1 | American Petroleum Institute, Recommended Practice for Electrical Submersible Pump Teardown Report |
| IEEE 519-2014 | IEEE Standard for Harmonic Control in Electric Power Systems |
| NACE MR0175 / ISO 15156 | Petroleum and natural gas industries — Materials for use in H₂S-containing environments |

---

*Documento generado en sesión de diseño arquitectural — Marzo 2026*
*Versión: 1.0 — Actualizar con cada decisión técnica de desarrollo*
