# SIMBES — Módulo 9: Flujo de Diseño BES
## Documento de Arquitectura Pedagógica Integral

> **Propósito**
> Definir completamente el Módulo 9 antes de programar una sola línea de código:
> física, datos de entrada, lógica de decisión, ciclos de iteración,
> estructura de archivos, estado global y criterios de aprobación del diseño.
>
> **Versión:** 1.1 — Corrección: Pwf como dato estratégico de entrada (no resultado calculado)
> **Fecha:** Marzo 2026

---

## Índice

1. [Concepto central — qué es M9 y en qué difiere de M1–M8](#1-concepto-central)
2. [Corrección fundamental: Pwf como decisión estratégica](#2-corrección-fundamental-pwf)
3. [Datos de entrada del sistema](#3-datos-de-entrada)
4. [Flujo de diseño — diagrama maestro](#4-flujo-maestro)
5. [Detalle de cada paso (física + decisiones + iteraciones)](#5-detalle-por-paso)
6. [Mapa completo de ciclos de iteración](#6-ciclos-de-iteración)
7. [Física nueva vs. módulos existentes](#7-física-nueva-vs-existente)
8. [Estructura de archivos](#8-estructura-de-archivos)
9. [Estado global — hook useBESDesign](#9-estado-global)
10. [Criterios de validación del diseño final](#10-criterios-de-validación)
11. [Hoja de selección final — formato de salida](#11-hoja-de-selección)
12. [Diferencias pedagógicas vs. M1–M8](#12-diferencias-pedagógicas)

---

## 1. Concepto central

### ¿Qué es M9?

M9 es el módulo integrador de SIMBES. No enseña física nueva de forma aislada —
**orquesta la física ya implementada en M1–M8 en el orden en que un ingeniero
la usaría para diseñar un sistema BES completo.**

El resultado de M9 no es "entender un fenómeno". Es una
**hoja de selección BES lista para revisión técnica**, derivada de
decisiones coherentes y trazables a través de los 14 pasos del flujo.

### Diferencia fundamental con M1–M8

| Aspecto | M1–M8 | M9 |
|---|---|---|
| Propósito | Entender física por subsistema | Proceso de diseño integrado |
| Navegación | Tabs libres, cualquier orden | Pasos secuenciales con dependencias |
| Errores | Alertas informativas | Bloqueos que impiden avanzar |
| Iteración | Manual y libre | Guiada con explicación del motivo |
| Resultado | Comprensión de un fenómeno | Hoja de selección BES completa |
| Evaluación | 5 preguntas por módulo | "¿Aprobarías este diseño?" con rúbrica |

### Qué módulos invoca M9

M9 no duplica física. La llama:

| Paso de M9 | Módulo invocado |
|---|---|
| PASO 2 — IPR | M1 (Darcy + Vogel) |
| PASO 3 — Condiciones en bomba | M3 (GVF, viscosidad, PIP) |
| PASO 4 — TDH y bomba | M2 (TDH, Ns, Leyes de Afinidad) |
| PASO 6 — Cable eléctrico | M4 (caída de voltaje, Arrhenius, THD) |
| PASO 8 — Riesgos operativos | M3 + M4 + M6 (DIFA) |
| PASO 9 — Estrategia de operación | M5 (sensores, set points) |
| PASO 10 — Validación económica | M7 (MTBF, run life) |

Los pasos sin módulo asociado contienen **física nueva exclusiva de M9**
(candidatura BES, HP motor, holgura mecánica, hoja de selección).

---

## 2. Corrección fundamental: Pwf como decisión estratégica

### Por qué Pwf es un dato de entrada, no un resultado

La **Presión Fluyente de Fondo (Pwf)** es una decisión de estrategia de
explotación del yacimiento, no una variable libre del diseño BES.

El ingeniero de yacimientos define Pwf considerando:
- Máximo drawdown admisible sin producción de arena
- Nivel de energía del acuífero y mecanismo de producción
- Plan de agotamiento y presión de abandono del campo
- Límite de compactación de la formación
- Política de mantenimiento de presión (inyección de agua o gas)

**Pwf no lo calcula el simulador — lo ingresa el usuario.**

### Impacto en la lógica del PASO 2

**Versión incorrecta (descartada):**
```
ENTRADA: Q_objetivo
  ↓
PASO 2 calcula → Pwf resultante a ese Q
```

**Versión correcta (implementar):**
```
ENTRADA: Pwf (decisión estratégica del yacimiento)
  ↓
PASO 2 calcula → Q resultante a ese Pwf (usando IPR)
  ↓
Verificación: ¿Q_resultante satisface la necesidad operativa?
```

### Preguntas de validación en PASO 2 (con Pwf como entrada)

Una vez que el usuario ingresa Pwf, el simulador valida:

1. **¿Pwf es físicamente seguro?**
   - Pwf < 10% × Pr → riesgo de compactación o producción de arena
   - Pwf < Pb × 0.25 → gas libre excesivo en fondo → evaluar AGS desde el inicio

2. **¿El drawdown es excesivo?**
   - Drawdown = (Pr − Pwf) / Pr × 100%
   - Drawdown > 85% → advertencia de riesgo operativo

3. **¿El Q resultante es suficiente?**
   - Q_IPR = ipr_pwf_to_q(Pwf, Pr, Pb, IP)
   - Si Q_IPR < Q_mínimo_operativo → el pozo no puede dar lo que se necesita
   - Si Q_IPR > capacidad máxima BES disponible → ajustar estrategia

4. **¿En qué zona de la IPR opera?**
   - Pwf ≥ Pb → zona Darcy (lineal)
   - Pwf < Pb → zona Vogel (bifásica, gas libre)

---

## 3. Datos de entrada

Todos los datos se ingresan **una sola vez** al inicio del módulo.
Ningún paso posterior requiere entrada libre adicional del usuario —
solo decisiones guiadas entre opciones calculadas.

### 3.1 Datos del yacimiento

| Variable | Símbolo | Unidad UI | Rango típico | Notas |
|---|---|---|---|---|
| Presión estática del reservorio | Pr | psi | 500–10.000 | Estado actual del yacimiento |
| Presión de burbuja | Pb | psi | 100 – Pr | Pb ≤ Pr siempre |
| Índice de Productividad | IP | m³/d/psi | 0,01–2,0 | Derivado de prueba de pozo |
| **Presión fluyente de fondo** | **Pwf** | **psi** | **100 – Pr** | **Decisión estratégica de yacimientos** |

### 3.2 Datos del pozo

| Variable | Símbolo | Unidad UI | Rango típico | Notas |
|---|---|---|---|---|
| Profundidad de asentamiento de bomba | D | m | 500–5.000 | Profundidad vertical verdadera |
| Profundidad total del pozo | D_total | m | D – 5.000 | Para cálculo de columna de fluido |
| Presión en cabeza de pozo (wellhead) | WHP | psi | 50–500 | — |
| Gradiente del fluido de producción | γ | psi/ft | 0,30–0,50 | Calculado de densidad si se conoce |
| Temperatura de fondo (a D bomba) | T_fond | °C | 60–180 | Para cable y motor |
| Temperatura superficial | T_sup | °C | 15–40 | Para cable |
| ID interno del casing (drift) | ID_cas | pulg | 4,5–9,625 | Determina restricción de OD |
| Desviación máxima del pozo | Dev | grados/30m | 0–80 | Para verificación mecánica |

### 3.3 Datos del fluido

| Variable | Símbolo | Unidad UI | Rango típico | Notas |
|---|---|---|---|---|
| GOR superficial | GOR | m³/m³ | 0–500 | Gas-Oil Ratio en condiciones estándar |
| Corte de agua | BSW | % | 0–98 | Basic Sediment & Water |
| Viscosidad del crudo a T° de bomba | μ | cp | 1–500 | Crítica para corrección H-Q |
| Gravedad API | API | °API | 10–45 | Determina densidad y Bo |
| Presencia de H₂S | H2S | Sí/No | — | Activa requisitos NACE MR0175 |
| Presencia de CO₂ | CO2 | Sí/No | — | Corrosión de materiales |
| Contenido de sólidos | Sólidos | Bajo/Medio/Alto | — | Abrasión en impulsor |

### 3.4 Datos de superficie (instalación)

| Variable | Símbolo | Unidad UI | Rango típico | Notas |
|---|---|---|---|---|
| Voltaje disponible en superficie | V_sup | V | 480–13.800 | Determina rango de motor |
| Frecuencia de red | f_red | Hz | 50 / 60 | — |
| Topología VSD disponible | VSD | — | 6P / 12P / 18P / AFE | Impacta THD |

---

## 4. Flujo maestro

```
╔══════════════════════════════════════════════════════════════════════╗
║                    ENTRADA DE DATOS (PASO 0)                         ║
║  Yacimiento: Pr, Pb, IP, Pwf (estratégico)                           ║
║  Pozo: D, WHP, γ, T_fond, T_sup, ID_cas, Dev                        ║
║  Fluido: GOR, BSW, μ, API, H2S, CO2, Sólidos                        ║
║  Superficie: V_sup, f_red, VSD                                       ║
╚══════════════════════════════════════════════════════════════════════╝
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PASO 1 — Verificar candidato BES                                    │
│  Criterios: caudal, profundidad, T°, GOR, sólidos, H2S, desviación  │
└─────────────────────────────────────────────────────────────────────┘
         ↓                              ↓
     ❌ NO candidato               ✅ / ⚠️ Candidato
     → Fin + sistemas                   ↓
       alternativos
                    ┌────────────────────────────────────────────────┐
                    │  PASO 2 — IPR: Q resultante a Pwf estratégico  │
                    │  Valida: drawdown, zona Darcy/Vogel, Q viable   │◄──┐
                    └────────────────────────────────────────────────┘   │
                                        ↓                                │
                    ┌────────────────────────────────────────────────┐   │
                    │  PASO 3 — Condiciones en la bomba               │   │
                    │  PIP, GVF, volumen real, corrección viscosidad  │   │
                    └────────────────────────────────────────────────┘   │
                         ↓ GVF > 15%                                     │
                         └── CICLO A: agregar AGS/handler → recalcular   │
                                        ↓                                │
                    ┌────────────────────────────────────────────────┐   │
                    │  PASO 4 — TDH y selección de bomba              │   │
                    │  TDH, serie, etapas, frecuencia, BEP ratio      │   │
                    └────────────────────────────────────────────────┘   │
                         ↓ BEP ratio fuera 70–130%                       │
                         └── CICLO B: cambiar serie/freq → recalcular    │
                              Si no hay solución ──────────────────────-─┘
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 5 — Selección de motor                    │
                    │  HP, voltaje, corriente, T° motor, shroud       │
                    └────────────────────────────────────────────────┘
                         ↓ T° > T_rated o vel. fluido < 0,3 m/s
                         └── CICLO C: agregar shroud → recalcular
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 6 — Cable y sistema eléctrico             │
                    │  AWG, caída de voltaje, aislamiento, THD        │
                    └────────────────────────────────────────────────┘
                         ↓ Caída > 5% o T° > T_rated aislamiento
                         └── CICLO D: cambiar calibre AWG → recalcular
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 7 — Verificación mecánica  ← BLOQUEO     │
                    │  OD string vs. casing drift, dogleg             │◄──┐
                    └────────────────────────────────────────────────┘   │
                         ↓ OD > drift                                    │
                         └── CICLO E: reducir serie ──────────→ PASO 4   │
                                        ↓                                │
                    ┌────────────────────────────────────────────────┐   │
                    │  PASO 8 — Riesgos operativos                    │   │
                    │  Gas lock, T°, corrosión, sólidos, vibración    │   │
                    └────────────────────────────────────────────────┘   │
                         ↓ Mitigación agrega OD                          │
                         └── CICLO F ────────────────────────────────────┘
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 9 — Estrategia de operación               │
                    │  Frecuencia inicial, rampa, set points          │
                    └────────────────────────────────────────────────┘
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 10 — Validación técnico-económica         │
                    │  Q esperado, run life, CAPEX orientativo        │
                    └────────────────────────────────────────────────┘
                                        ↓
                    ┌────────────────────────────────────────────────┐
                    │  PASO 11 — Hoja de selección BES final          │
                    │  Documento completo listo para revisión técnica │
                    └────────────────────────────────────────────────┘
```

---

## 5. Detalle por paso

---

### PASO 0 — Ingreso de datos

**Tipo de pantalla:** formulario único dividido en 4 secciones colapsables.

**Validaciones en tiempo real (antes de comenzar):**

```
Pr > 0
Pb ≤ Pr
100 ≤ Pwf < Pr          ← Pwf estratégico con rango válido
IP > 0
D > 0 y D < D_total
GOR ≥ 0
0 ≤ BSW ≤ 98
T_fond > T_sup          ← validación física básica
ID_cas > 0
```

**No se puede avanzar al PASO 1 si alguna validación falla.**

---

### PASO 1 — Verificar candidato BES

**Física:** ninguna. Tabla de criterios cualitativos y cuantitativos.
No tiene módulo equivalente en M1–M8 — **física nueva de M9.**

**Criterios de elegibilidad:**

| Criterio | Favorable ✅ | Condicional ⚠️ | Descalificante ❌ |
|---|---|---|---|
| Caudal resultante (Q del PASO 2) | > 100 m³/d | 30–100 m³/d | < 30 m³/d |
| Profundidad de bomba | 500–3.500 m | 3.500–4.500 m | > 5.000 m |
| Temperatura de fondo | < 130°C | 130–160°C | > 200°C |
| GOR superficial | < 200 m³/m³ | 200–500 m³/m³ | > 800 m³/m³ sin AGS |
| Contenido de sólidos | Bajo | Medio | Alto sin bomba especializada |
| Presencia H₂S | No | Trazas | Significativo sin NACE |
| Desviación del pozo | < 60°/30m | 60–70°/30m | > 80°/30m sin centralizers |

**Lógica de resultado:**

```
Si algún criterio es ❌ → NO candidato
  → mostrar por qué + sistemas alternativos:
    - Gas lift: ideal para pozos con alta RGP o poca energía eléctrica
    - Bombeo mecánico (PCP): bajo caudal + crudo viscoso
    - Bombeo centrífugo de superficie (ESP horizontal): pozos someros

Si todos ✅ → candidato confirmado → continuar
Si alguno ⚠️ → candidato condicional → continuar con alertas visibles
```

**Iteración:** no aplica. Es puerta de entrada.

---

### PASO 2 — IPR: caudal resultante al Pwf estratégico

**Física:** Módulo M1 — Darcy + Vogel.

**Función principal:**
```javascript
// Pwf es dato de entrada del usuario (decisión de yacimientos)
// Q es el resultado calculado por la IPR

Q_resultante = ipr_pwf_to_q(Pwf, Pr, Pb, IP)

// Zona de operación
zona = Pwf >= Pb ? "Darcy (lineal)" : "Vogel (bifásica)"

// Drawdown
drawdown_pct = (Pr - Pwf) / Pr * 100

// AOF para contexto
AOF = calc_aof(Pr, Pb, IP)

// Posición relativa en la IPR
Q_relativo_aof = Q_resultante / AOF * 100   // %
```

**Validaciones y alertas:**

| Condición | Tipo | Mensaje |
|---|---|---|
| Pwf < 0.10 × Pr | ❌ BLOQUEO | "Drawdown extremo: riesgo de compactación de formación y producción de arena. Revisar Pwf con el equipo de yacimientos." |
| Pwf < 0.25 × Pb | ⚠️ ADVERTENCIA | "Pwf muy por debajo de Pb: gas libre excesivo. Se anticipará separador de gas en PASO 3." |
| Drawdown > 85% | ⚠️ ADVERTENCIA | "Drawdown alto. Verificar modelo de arenas y competencia del cemento." |
| Q_resultante < 30 m³/d | ⚠️ ADVERTENCIA | "Caudal bajo para BES. Confirmar con PASO 1 si el sistema sigue siendo candidato." |
| zona == "Vogel" | ℹ️ INFO | "El pozo opera en zona bifásica (Pwf < Pb). Gas libre presente. El PASO 3 calculará GVF en succión." |

**Salida hacia el siguiente paso:**
- Q_resultante (m³/d) → caudal de diseño para todos los pasos siguientes
- Pwf (psi) → para cálculo de PIP en PASO 3
- zona → determina si M3 activa correcciones de gas

**Iteración:** Si Q_resultante no es operativo por decisión del negocio,
el usuario ajusta Pwf y el sistema recalcula. No hay iteración automática
— es una decisión humana de estrategia.

---

### PASO 3 — Condiciones en la bomba (PIP, GVF, volumen real)

**Física:** Módulo M3 — Gas y Multifásico.
Física adicional nueva para M9: cálculo de PIP y volumen real en la bomba.

**Cálculos:**

```javascript
// PIP — Pump Intake Pressure
// Presión en la succión de la bomba (entre el nivel dinámico y la bomba)
PIP = Pwf - γ_fluido × (D_fondo - D_bomba)
// [SIMPLIFIED: gradiente uniforme desde Pwf hasta la bomba]

// GVF en succión — Gas Volume Fraction
if (PIP >= Pb) {
  GVF = 0.0   // gas totalmente disuelto
} else {
  // Gas libre liberado por debajo del punto de burbuja
  GOR_libre = GOR × (1 - PIP / Pb)   // [aprox. lineal — educativo]
  GVF = GOR_libre / (GOR_libre + 1)  // fracción volumétrica
}

// Volumen real de fluido a condiciones de bomba
Q_petroleo = Q_resultante × (1 - BSW/100) / Bo   // STB/d → condiciones bomba
Q_agua     = Q_resultante × (BSW/100) / Bw
Q_liquido  = Q_petroleo + Q_agua
Q_gas_libre = Q_liquido × GVF / (1 - GVF)
Q_total_bomba = Q_liquido + Q_gas_libre            // volumen real que maneja la bomba

// Corrección por viscosidad (Hydraulic Institute)
// Solo aplica si μ > 10 cp
if (μ > 10) {
  factor_visc = hydraulic_institute_correction(μ, Q_total_bomba, D_bomba)
  // Reduce H efectiva y Q efectivo de la curva de la bomba
  H_factor    = factor_visc.H    // < 1.0
  Q_factor    = factor_visc.Q    // < 1.0
  η_factor    = factor_visc.eta  // < 1.0
}
```

**Decisiones por GVF:**

| GVF en succión | Diagnóstico | Acción requerida |
|---|---|---|
| < 5% | Sin restricción | Continuar |
| 5–15% | Advertencia — vigilar | Continuar con alerta |
| 15–30% | Gas lock posible | **CICLO A: agregar AGS rotativo** |
| 30–50% | Gas lock probable | **CICLO A: gas handler activo** |
| > 50% | Gas lock inevitable | **CICLO A: gas handler + revisión de Pwf** |

**CICLO A — iteración de gas:**
```
GVF > 15%
  ↓
Usuario selecciona mitigación:
  - AGS rotativo (reduce GVF efectivo ~60–70%)
  - Gas handler activo (reduce GVF efectivo ~85–90%)
  ↓
Sistema recalcula GVF_efectivo con separación
  ↓
¿GVF_efectivo < 15%? → OK → continuar
                     → NO → escalar mitigación o revisar Pwf
```

**Salida hacia el siguiente paso:**
- Q_total_bomba → caudal real que entra a la bomba
- PIP → insumo para número de etapas
- GVF_efectivo → estado de gas para alerta de riesgo en PASO 8
- H_factor, Q_factor → modificadores de curva de bomba en PASO 4

---

### PASO 4 — TDH y selección de bomba

**Física:** Módulo M2 — TDH, Ns, Leyes de Afinidad.

**Cálculos de TDH:**

```javascript
// Darcy-Weisbach + Colebrook-White para fricción en tubing
H_friccion = friction_head(Q_total_bomba, D_bomba, D_tubing_in, μ, ρ)

// Contrapresión en cabezal
H_contrapresion = WHP / γ

// Altura estática neta
H_estatica = D_bomba - PIP / γ

// TDH total
TDH = H_estatica + H_friccion + H_contrapresion

// Aplicar factores de viscosidad si μ > 10 cp
TDH_ajustado = TDH / H_factor   // más etapas si la bomba trabaja peor

// Número de etapas
etapas = Math.ceil(TDH_ajustado / H_etapa_BEP)
```

**Selección de serie de bomba:**

```javascript
// Entrada: Q_total_bomba
// Proceso: comparar contra rangos de las series disponibles
// Criterio de selección: Q_total_bomba debe quedar en BEP ± 30%

series_candidatas = pump_series.filter(s =>
  Q_total_bomba >= s.Q_min_operativo &&
  Q_total_bomba <= s.Q_max_operativo
)

// Para cada serie candidata, calcular BEP ratio
serie.bep_ratio = Q_total_bomba / serie.Q_bep

// Seleccionar la serie con BEP ratio más cercano a 1.0
serie_seleccionada = series_candidatas.sort_by(abs(bep_ratio - 1.0))[0]

// Verificación de Velocidad Específica
Ns = specific_speed(N_rpm, Q_bep_serie, H_etapa_serie)
tipo_impulsor = impeller_type(Ns)
// Ns 1.500–4.500 → flujo mixto → ideal para BES
```

**Optimización con VSD:**

```javascript
// Si BEP ratio está fuera de 70–130%, intentar ajuste de frecuencia
// Leyes de Afinidad:
//   Q₂ = Q₁ × (f₂/f₁)
//   H₂ = H₁ × (f₂/f₁)²
//   P₂ = P₁ × (f₂/f₁)³

// Buscar frecuencia que lleve BEP ratio a 90–110% (zona óptima)
f_objetivo = f_red × (Q_bep_serie / Q_total_bomba)
f_objetivo = clamp(f_objetivo, 0.67 × f_red, 1.20 × f_red)  // 40–72 Hz
```

**Tabla de decisión por BEP ratio:**

| BEP ratio | Diagnóstico | Acción |
|---|---|---|
| < 70% | Recirculación interna → cavitación → sobrecalentamiento | **CICLO B: bajar frecuencia o cambiar serie** |
| 70–90% | Operativo, lado izquierdo del BEP | Continuar con nota |
| 90–110% | Zona óptima | ✅ Continuar |
| 110–130% | Operativo, lado derecho del BEP | Continuar con nota |
| > 130% | Surging → cavitación → desgaste de impulsor | **CICLO B: subir frecuencia o cambiar serie** |

**CICLO B — iteración de bomba:**
```
BEP ratio fuera de 70–130%
  ↓
Intentar ajuste de frecuencia VSD (Leyes de Afinidad)
  ↓
¿Nueva frecuencia en rango 40–72 Hz? → recalcular → verificar BEP ratio
                                     → OK → continuar
Si no hay frecuencia que funcione:
  → cambiar serie de bomba → recalcular
  Si no hay serie disponible en catálogo:
    → CICLO MAYOR: revisar Q_total_bomba → revisar Pwf (PASO 2)
```

**Salida hacia el siguiente paso:**
- TDH, etapas, serie, frecuencia_operativa
- HP_hidraulico = Q_total_bomba × TDH × γ / (3960 × η_bomba)
- OD_bomba (para verificación mecánica)

---

### PASO 5 — Selección de motor

**Física nueva exclusiva de M9.** No hay módulo equivalente en M1–M8.

**Cálculos de potencia:**

```javascript
// HP hidráulico (del PASO 4)
HP_hidraulico = Q_total_bomba × TDH × γ / (3960 × η_bomba)

// HP en el eje del motor (aguas arriba de protector y cable)
// η_protector ≈ 0.98, η_cable ≈ 0.97–0.99 (depende del calibre)
HP_motor_requerido = HP_hidraulico / (η_protector × η_cable_estimado)

// Margen de diseño: 15% sobre el HP calculado
HP_seleccionado = HP_motor_requerido × 1.15

// Corriente nominal del motor
I_nominal = HP_seleccionado × 746 / (√3 × V_motor × FP × η_motor)
// FP (factor de potencia) ≈ 0.85–0.92 para motores BES
// η_motor ≈ 0.87–0.94

// Calor generado por el motor
Q_calor_kW = HP_motor_requerido × (1 - η_motor) × 0.7457

// Velocidad de fluido para enfriamiento del motor
// (fluido que pasa entre OD_motor y ID_casing)
A_anular = π/4 × (ID_cas² - OD_motor²)   // ft²
v_fluido = Q_total_bomba / (A_anular × 86400)  // ft/s → m/s
```

**Selección de voltaje:**

| HP del motor | Voltaje típico BES |
|---|---|
| < 100 HP | 1.000–2.000 V |
| 100–300 HP | 2.000–3.300 V |
| 300–500 HP | 3.300–4.500 V |
| > 500 HP | 4.500–6.600 V |

**Criterio de temperatura del motor:**

```javascript
// Temperatura máxima de operación del motor
T_motor_op = T_fond + ΔT_joule
// ΔT_joule = Q_calor_kW / (ρ_fluido × Cp_fluido × caudal_anular)
// [SIMPLIFIED: ΔT estimado de 5–15°C según caudal anular]

// Verificación contra T_rated del motor seleccionado
// T_rated típicos: 120°C (estándar), 150°C (alta T°), 200°C (ultra alta T°)
```

**Decisión de shroud:**

| Velocidad de fluido anular | Diagnóstico | Acción |
|---|---|---|
| > 0,6 m/s | Enfriamiento adecuado | ✅ Sin shroud |
| 0,3–0,6 m/s | Enfriamiento marginal | ⚠️ Evaluar shroud |
| < 0,3 m/s | Riesgo de sobrecalentamiento | **CICLO C: shroud obligatorio** |

**CICLO C — iteración de temperatura:**
```
v_fluido < 0,3 m/s  o  T_motor_op > T_rated
  ↓
Agregar shroud
  (el shroud fuerza el fluido a pasar entre el motor y el shroud,
   aumentando velocidad y enfriamiento)
  ↓
Recalcular A_anular con shroud → nueva v_fluido
  ↓
¿v_fluido > 0,3 m/s? → OK
                     → Motor de menor OD (actualiza OD_motor en PASO 7)
```

**Salida hacia el siguiente paso:**
- HP_seleccionado, V_motor, I_nominal, OD_motor, shroud_requerido
- OD_motor y OD_shroud (para verificación mecánica en PASO 7)

---

### PASO 6 — Cable y sistema eléctrico

**Física:** Módulo M4 — Eléctrico/VSD.

**Cálculos de cable:**

```javascript
// Resistencia del cable corregida por temperatura
T_avg = (T_sup + T_fond) / 2
R_T = R_20_por_calibre[AWG] × (1 + α_Cu × (T_avg - 20))
// α_Cu = 0.00393 /°C

// Caída de voltaje total (3 conductores trifásicos)
V_drop = I_nominal × R_T × D_bomba / 1000 × 3
V_drop_pct = V_drop / V_motor × 100

// Vida útil relativa del aislamiento (Arrhenius)
// T_rated_aislamiento: NBR=120°C, EPDM=160°C, PEEK=200°C
life_factor = 2^((T_rated_aislamiento - T_avg) / 10)
// < 1.0 si T_avg > T_rated → vida útil reducida
```

**Tabla de selección de calibre AWG:**

| Corriente nominal (A) | AWG recomendado | R base (Ω/km) |
|---|---|---|
| < 40 A | AWG 6 | 13,3 |
| 40–60 A | AWG 4 | 8,4 |
| 60–90 A | AWG 2 | 5,3 |
| 90–130 A | AWG 1 | 4,2 |
| > 130 A | AWG 1/0 | 3,3 |

**CICLO D — iteración de cable:**
```
Caída de voltaje > 5%
  ↓
Reducir calibre AWG (número menor = conductor más grueso)
  ↓
Recalcular V_drop_pct
  ↓
¿V_drop_pct ≤ 5%? → OK
Si AWG 1/0 sigue sin alcanzar → alertar y evaluar transformador elevador
```

**Selección de aislamiento (NACE MR0175 / ISO 15156):**

| Condición del fluido | Material de aislamiento | Estándar |
|---|---|---|
| Condiciones normales, T° < 120°C | NBR (Nitrile) | API RP 11S6 |
| T° entre 120–160°C | EPDM | API RP 11S6 |
| T° > 160°C | PEEK | — |
| Presencia de H₂S (cualquier nivel) | Lead Sheath + fases Monel 400 | NACE MR0175 |
| Inyección de solventes | PEEK | — |

**THD según topología VSD (IEEE 519-2014):**

| Topología | THD estimado | Cumple IEEE 519 (< 5%) |
|---|---|---|
| Estándar 6 pulsos | 25–35% | ❌ No |
| Multipulso 12 pulsos | 15–20% | ❌ No |
| Multipulso 18 pulsos | < 5% | ✅ Sí |
| AFE (Active Front End) | < 3% | ✅ Sí |

> Si el VSD disponible en superficie no cumple IEEE 519-2014,
> advertir que puede requerir filtro activo adicional.

**Salida hacia el siguiente paso:**
- AWG_seleccionado, V_drop_pct, aislamiento_tipo, THD_estimado
- OD_cable (para verificación mecánica)

---

### PASO 7 — Verificación mecánica

**Física nueva exclusiva de M9.** No tiene módulo equivalente en M1–M8.
**Este es el único paso con BLOQUEO DURO.**

**Cálculos de holgura:**

```javascript
// OD máximo del string completo
// (el componente más ancho determina si entra al casing)
componentes = [
  { nombre: "Bomba",     OD: OD_bomba },
  { nombre: "Protector", OD: OD_protector },   // ≈ OD_motor para la misma serie
  { nombre: "Motor",     OD: OD_motor },
  { nombre: "Separador", OD: OD_ags, aplica: GVF_requiere_ags },
  { nombre: "Shroud",    OD: OD_shroud, aplica: shroud_requerido },
]

OD_string = max(componentes.filter(c => c.aplica).map(c => c.OD))

// Holgura entre string y casing
holgura_mm = (ID_cas_pulg - OD_string_pulg) * 25.4 / 2  // por lado

// Verificación de dogleg
// Para pozos desviados: el cable necesita doblar con el pozo
// Radio mínimo de curvatura del cable ≈ función del OD del cable y tipo de armado
radio_curvatura_min = cable_min_bend_radius[AWG]   // metros
dogleg_admisible = Math.atan(radio_curvatura_min / 30) × (180/π)  // °/30m
```

**Tabla de decisión por holgura:**

| Holgura (por lado) | Diagnóstico | Acción |
|---|---|---|
| > 12 mm | Holgura adecuada | ✅ Continuar |
| 6–12 mm | Holgura reducida | ⚠️ Verificar desviación y centralizers |
| < 6 mm | Holgura insuficiente | ❌ **BLOQUEO DURO** |
| < 0 mm | No entra al pozo | ❌ **BLOQUEO DURO** |

**CICLO E — iteración mecánica (BLOQUEO DURO):**
```
Holgura < 6 mm
  ↓
BLOQUEO: no se puede continuar el diseño
  ↓
Opciones para resolver (el usuario elige):
  1. Seleccionar serie de bomba de menor OD → vuelve a PASO 4
  2. Motor de menor OD → vuelve a PASO 5
  3. Eliminar shroud (solo si T° lo permite) → recalcula
  4. Si nada funciona → el pozo no es candidato a BES con este casing
```

**Verificación adicional de dogleg:**
```javascript
if (Dev > dogleg_admisible) {
  warnings.push({
    tipo: "advertencia",
    msg: `Dogleg ${Dev}°/30m supera el radio de curvatura mínimo del cable AWG ${AWG}.
           Verificar con fabricante. Puede requerir cable de armado especial o centralizers.`
  })
}
```

**Salida hacia el siguiente paso:**
- holgura_mm, dogleg_ok, OD_string, status (ok | condicional | bloqueado)

---

### PASO 8 — Evaluación de riesgos operativos

**Física:** Módulos M3 (GVF, viscosidad), M4 (temperatura, THD), M6 (DIFA).

**Mapa de riesgos:**

| Riesgo | Indicador | Umbral alerta | Umbral crítico | Mitigación estándar |
|---|---|---|---|---|
| Gas lock | GVF_efectivo | > 10% | > 20% | AGS / gas handler (ya gestionado en PASO 3) |
| Sobrecalentamiento motor | v_fluido_anular | < 0,5 m/s | < 0,3 m/s | Shroud (ya gestionado en PASO 5) |
| Degradación de aislamiento | T_avg / T_rated | > 0,85 | > 1,0 | Cambiar tipo de cable (ya en PASO 6) |
| Corrosión H₂S | H2S = Sí | Siempre | — | Lead Sheath + Monel (ya en PASO 6) |
| Incrustaciones (scale) | API < 25 + BSW > 30% | Combinación | — | Inhibidor de scale / tratamiento químico |
| Abrasión por sólidos | Sólidos = Medio/Alto | Medio | Alto | Bomba tungsteno / protección en impulsor |
| Emulsión | BSW × μ | > umbral | — | Tratamiento de emulsión / separación |
| Fatiga por vibración | Dev + v_fluido | > 15°/30m + alta Q | — | Centralizers / frecuencia reducida |
| Slugging / flujo intermitente | GOR alto + BSW variable | — | — | Control adaptativo de VSD |

**Salida:** tabla semáforo de 9 riesgos con estado (✅ / ⚠️ / ❌)
y mitigación recomendada para cada riesgo identificado.

**CICLO F — mitigaciones que impactan OD:**
```
Si la mitigación de abrasión requiere bomba de mayor OD
  → recalcular OD_string → volver a PASO 7
Si la mitigación de vibración requiere centralizers
  → reducir OD disponible en el casing → volver a PASO 7
```

---

### PASO 9 — Estrategia de operación

**Física:** Módulo M5 (sensores y monitoreo) + lógica VSD del M4.

**Parámetros calculados:**

```javascript
// Frecuencia de arranque
f_arranque = f_operativa × 0.67    // ≈ 40 Hz si f_operativa = 60 Hz
f_arranque = max(35, f_arranque)   // mínimo 35 Hz para autoenfriamiento

// Rampa de subida recomendada
rampa_Hz_min = f_operativa < 55 ? 0.5 : 1.0  // Hz/minuto

// Set points de protección del VSD
setpoints = {
  sobrecorriente:    I_nominal × 1.15,   // A — paro por sobrecarga
  undercurrent:      I_nominal × 0.75,   // A — paro por falta de fluido
  T_max_motor:       T_motor_op + 10,    // °C — alerta térmica
  PIP_min:           PIP × 0.70,         // psi — inicio de cavitación
  vibracion_alerta:  4.0,                // mm/s RMS
  vibracion_paro:    8.0,                // mm/s RMS
}

// Parámetros de monitoreo recomendados
monitoreo = {
  carta_amperimetrica: true,   // variación de corriente con el tiempo
  P_T_downhole: true,          // sensor de fondo si está disponible
  vibracion: true,             // acelerómetro en superficie o downhole
  THD_superficie: topologia_VSD != "afe",  // si hay riesgo de armónicos
}
```

---

### PASO 10 — Validación técnico-económica

**Física:** Módulo M7 (MTBF y confiabilidad) + cálculos económicos orientativos.

**Métricas técnicas:**

```javascript
// Caudal esperado validado
Q_esperado = Q_resultante  // confirmado contra IPR, bomba y restricciones

// Run life esperada — base en MTBF de referencia (data/mtbf-benchmarks.json)
// ajustado por factores de riesgo del PASO 8
MTBF_base = mtbf_benchmarks[ambiente]  // días
// Factores de penalización
factor_gas     = GVF_efectivo > 15 ? 0.85 : 1.0
factor_T       = T_motor_op > T_rated × 0.9 ? 0.80 : 1.0
factor_solidos = solidos == "Alto" ? 0.70 : solidos == "Medio" ? 0.90 : 1.0
factor_H2S     = H2S && !nace_compliant ? 0.60 : 1.0

run_life_estimada = MTBF_base × factor_gas × factor_T × factor_solidos × factor_H2S

// Supervivencia exponencial
R_at_runlife = Math.exp(-run_life_estimada / MTBF_base)  // siempre < 36.77%
```

**Métricas económicas (orientativas — sin valores reales de mercado):**

```javascript
// CAPEX orientativo por categoría
// [SIMPLIFIED: rangos educativos, no costos contractuales]
capex_categoria = HP_seleccionado < 100  ? "Bajo"
                : HP_seleccionado < 300  ? "Medio"
                : HP_seleccionado < 500  ? "Alto"
                :                          "Muy Alto"

// Incrementos por condiciones especiales
if (H2S)          capex_extra += "+20–30% por materiales NACE"
if (T_fond > 150) capex_extra += "+15–25% por equipo de alta temperatura"
if (GVF > 15)     capex_extra += "+10–15% por separador de gas"
if (shroud)       capex_extra += "+5–10% por shroud"

// Payback simplificado (educativo)
// Solo muestra orden de magnitud, no valor absoluto
delta_Q_m3d = Q_esperado - Q_base_sin_BES  // si se conoce
// payback ≈ CAPEX / (delta_Q × precio_crudo × 30 días)
// Se muestra como "X meses" sin precios absolutos
```

---

### PASO 11 — Hoja de selección BES final

**Física:** ninguna. Render del estado completo acumulado.
**Output pedagógico principal de M9.**

Ver formato completo en la [Sección 11](#11-hoja-de-selección).

---

## 6. Ciclos de iteración

### Resumen de los 6 ciclos + 1 ciclo mayor

```
╔══════════════════════════════════════════════════════════════════╗
║                    CICLOS DE ITERACIÓN M9                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  CICLO A — Gas en succión (PASO 3)                               ║
║  Condición: GVF_efectivo > 15%                                   ║
║  Acción:    agregar AGS rotativo o gas handler                   ║
║  Recalcula: GVF_efectivo con separación                          ║
║  Impacto:   aumenta OD_string → puede activar CICLO E (PASO 7)  ║
║                                                                  ║
║  CICLO B — Selección de bomba (PASO 4)                           ║
║  Condición: BEP ratio < 70% o > 130%                             ║
║  Acción 1:  ajustar frecuencia VSD (Leyes de Afinidad)           ║
║  Acción 2:  cambiar serie de bomba                               ║
║  Retorno:   si no hay solución → CICLO MAYOR                     ║
║                                                                  ║
║  CICLO C — Temperatura del motor (PASO 5)                        ║
║  Condición: v_fluido < 0,3 m/s o T_motor > T_rated              ║
║  Acción:    agregar shroud                                       ║
║  Recalcula: velocidad fluido anular con shroud                   ║
║  Impacto:   aumenta OD_string → puede activar CICLO E            ║
║                                                                  ║
║  CICLO D — Cable eléctrico (PASO 6)                              ║
║  Condición: V_drop_pct > 5%                                      ║
║  Acción:    reducir calibre AWG (número menor)                   ║
║  Recalcula: V_drop_pct con nuevo AWG                             ║
║  Impacto:   OD cable ligeramente mayor → verificar PASO 7        ║
║                                                                  ║
║  CICLO E — Holgura mecánica (PASO 7)  ← BLOQUEO DURO            ║
║  Condición: holgura < 6 mm                                       ║
║  Acción:    reducir serie de bomba o motor de menor OD           ║
║  Retorno:   vuelve a PASO 4 con restricción de OD máximo         ║
║  Nota:      única iteración que genera un BLOQUEO real           ║
║                                                                  ║
║  CICLO F — Riesgos y mitigaciones (PASO 8)                       ║
║  Condición: mitigación seleccionada agrega componente con OD     ║
║  Acción:    recalcular OD_string                                 ║
║  Retorno:   vuelve a PASO 7 para verificación de holgura         ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  CICLO MAYOR — Sin solución posible                              ║
║  Condición: CICLO B no encuentra bomba + CICLO E bloquea         ║
║  Acción:    revisar Pwf estratégico con el usuario               ║
║  Retorno:   vuelve a PASO 2 con nuevo Pwf                        ║
║  Mensaje:   "No existe equipo BES disponible para este           ║
║             Pwf y este casing. Revisar la estrategia de          ║
║             explotación con el equipo de yacimientos."           ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Registro de iteraciones (log pedagógico)

Cada ciclo queda registrado en `iterationLog` para que el usuario
vea el historial de decisiones:

```javascript
iterationLog = [
  {
    ciclo: "A",
    paso: 3,
    condicion: "GVF = 22% > 15%",
    accion: "Se agregó AGS rotativo",
    resultado: "GVF efectivo = 8% → OK",
    timestamp: "paso3_iter1"
  },
  {
    ciclo: "B",
    paso: 4,
    condicion: "BEP ratio = 0.61 < 0.70",
    accion: "Frecuencia ajustada de 60 → 52 Hz",
    resultado: "BEP ratio = 0.89 → OK",
    timestamp: "paso4_iter1"
  },
  // ...
]
```

---

## 7. Física nueva vs. módulos existentes

| Paso | Función | Origen |
|---|---|---|
| PASO 0 | Validación de datos de entrada | Nuevo en M9 |
| PASO 1 | Tabla de criterios BES | Nuevo en M9 |
| PASO 2 | `ipr_pwf_to_q(Pwf, Pr, Pb, IP)` | **M1** |
| PASO 2 | Validaciones de drawdown | Nuevo en M9 |
| PASO 3 | Cálculo de PIP | Nuevo en M9 |
| PASO 3 | `gvf_en_succion(PIP, Pb, GOR)` | **M3** |
| PASO 3 | `volumen_real_bomba(Q, BSW, GOR, PIP)` | Nuevo en M9 |
| PASO 3 | `viscosity_correction(μ, Q, D)` | **M3** |
| PASO 4 | `friction_head(Q, L, D, μ, ρ)` | **M2** |
| PASO 4 | `total_dynamic_head(Q, D, WHP, γ)` | **M2** |
| PASO 4 | `specific_speed(N, Q, H)` | **M2** |
| PASO 4 | `affinity_laws(Q, H, P, f1, f2)` | **M2** |
| PASO 4 | Selección de serie de catálogo | Nuevo en M9 |
| PASO 5 | HP motor, corriente, calor, v_fluido | Nuevo en M9 |
| PASO 6 | `cable_voltage_drop(AWG, L, I, T)` | **M4** |
| PASO 6 | `arrhenius_life_factor(T_op, T_rated)` | **M4** |
| PASO 6 | `thd_estimate(topologia_vsd)` | **M4** |
| PASO 6 | Selección de aislamiento NACE | **M4** |
| PASO 7 | Cálculo de holgura casing | Nuevo en M9 |
| PASO 7 | Verificación de dogleg | Nuevo en M9 |
| PASO 8 | Tabla de riesgos integrada | **M3 + M4 + M6** |
| PASO 9 | Set points de protección | **M5** |
| PASO 9 | Parámetros de rampa VSD | Nuevo en M9 |
| PASO 10 | `mtbf_mle`, `survival_prob` | **M7** |
| PASO 10 | Factores de penalización por riesgo | Nuevo en M9 |
| PASO 10 | Estimación CAPEX orientativa | Nuevo en M9 |
| PASO 11 | Render hoja de selección | Nuevo en M9 |

---

## 8. Estructura de archivos

```
frontend/src/components/modules/Module9_BESDesign/
│
├── Module9_BESDesign.jsx           ← componente raíz del módulo
│
├── steps/
│   ├── Step0_DataEntry.jsx         ← formulario de entrada de datos
│   ├── Step1_Candidacy.jsx         ← tabla de criterios BES
│   ├── Step2_IPR.jsx               ← Q resultante a Pwf, curva IPR
│   ├── Step3_PumpConditions.jsx    ← PIP, GVF, volumen real, viscosidad
│   ├── Step4_TDH_Pump.jsx          ← TDH, serie, etapas, BEP
│   ├── Step5_Motor.jsx             ← HP, voltaje, temperatura, shroud
│   ├── Step6_Cable.jsx             ← AWG, caída tensión, aislamiento, THD
│   ├── Step7_Mechanical.jsx        ← OD string vs. drift, dogleg
│   ├── Step8_Risks.jsx             ← tabla semáforo 9 riesgos
│   ├── Step9_Operation.jsx         ← set points, rampa, monitoreo
│   ├── Step10_Economics.jsx        ← run life, CAPEX orientativo
│   └── Step11_DataSheet.jsx        ← hoja de selección final
│
├── hooks/
│   ├── useBESDesign.js             ← estado global + lógica de flujo
│   └── useIterationEngine.js       ← lógica de ciclos A–F + ciclo mayor
│
├── physics/
│   ├── pip.js                      ← cálculo de PIP
│   ├── pump_volume.js              ← volumen real a condiciones de bomba
│   ├── motor.js                    ← HP, calor generado, velocidad fluido
│   ├── mechanical.js               ← holgura casing, dogleg, OD string
│   └── economics.js                ← run life ajustado, CAPEX orientativo
│
└── data/
    ├── candidacy-criteria.json     ← umbrales PASO 1
    ├── pump-series.json            ← catálogo de series BES (genérico)
    ├── motor-catalog.json          ← HP / voltaje / OD / T_rated (genérico)
    ├── awg-table.json              ← AWG vs resistencia vs corriente máx
    └── risk-thresholds.json        ← umbrales tabla semáforo PASO 8
```

**Nota sobre los archivos `.json` de catálogo:**
Son datos genéricos representativos, no catálogos de fabricante.
Deben indicar claramente: `"fuente": "representativo educativo — no usar para diseño real"`.

---

## 9. Estado global

Todo el estado del módulo vive en un único objeto gestionado por
`useBESDesign.js`. Cada paso lee del estado y escribe al completarse.
Ningún paso almacena estado local permanente.

```javascript
const initialDesignState = {

  // ── Inputs (PASO 0) ──────────────────────────────────────────
  inputs: {
    // Yacimiento
    Pr: null, Pb: null, IP: null,
    Pwf: null,          // ← decisión estratégica del usuario

    // Pozo
    D_bomba: null, D_total: null,
    WHP: null, gamma: null,
    T_fond: null, T_sup: null,
    ID_cas: null, Dev: null,

    // Fluido
    GOR: null, BSW: null,
    visc: null, API: null,
    H2S: false, CO2: false,
    solidos: "Bajo",

    // Superficie
    V_sup: null, f_red: 60, VSD: "standard_6pulse",
  },

  // ── Resultados por paso ───────────────────────────────────────
  step1: {
    completado: false,
    isCandidate: null,          // true / false / "conditional"
    criterios: [],              // array con resultado de cada criterio
    sistemas_alternativos: [],  // si no es candidato
  },

  step2: {
    completado: false,
    Q_resultante: null,         // m³/d — calculado de IPR a Pwf ingresado
    drawdown_pct: null,
    zona_ipr: null,             // "Darcy" | "Vogel"
    AOF: null,
    alerts: [],
  },

  step3: {
    completado: false,
    PIP: null,
    GVF_crudo: null,
    GVF_efectivo: null,         // después de separación si aplica
    separador_tipo: null,       // null | "AGS" | "gas_handler"
    Q_total_bomba: null,        // volumen real a condiciones de bomba
    H_factor: 1.0,              // corrección viscosidad sobre H
    Q_factor: 1.0,              // corrección viscosidad sobre Q
    iteraciones_cicloA: 0,
  },

  step4: {
    completado: false,
    TDH: null,
    serie_bomba: null,
    etapas: null,
    f_operativa: null,
    bep_ratio: null,
    Ns: null,
    tipo_impulsor: null,
    OD_bomba: null,
    HP_hidraulico: null,
    iteraciones_cicloB: 0,
  },

  step5: {
    completado: false,
    HP_seleccionado: null,
    V_motor: null,
    I_nominal: null,
    T_motor_op: null,
    v_fluido_anular: null,
    shroud_requerido: false,
    OD_motor: null,
    OD_shroud: null,
    iteraciones_cicloC: 0,
  },

  step6: {
    completado: false,
    AWG: null,
    V_drop_pct: null,
    aislamiento_tipo: null,
    life_factor: null,
    THD_estimado: null,
    cumple_ieee519: null,
    OD_cable: null,
    iteraciones_cicloD: 0,
  },

  step7: {
    completado: false,
    OD_string: null,
    holgura_mm: null,
    dogleg_ok: null,
    status: null,               // "ok" | "conditional" | "blocked"
    iteraciones_cicloE: 0,
  },

  step8: {
    completado: false,
    riesgos: [
      // { nombre, indicador, valor, umbral_alerta, umbral_critico,
      //   estado: "ok"|"warning"|"danger", mitigacion }
    ],
    mitigaciones_con_OD: false, // si alguna mitigación agrega OD
    iteraciones_cicloF: 0,
  },

  step9: {
    completado: false,
    f_arranque: null,
    rampa_Hz_min: null,
    setpoints: {},
    monitoreo_recomendado: [],
  },

  step10: {
    completado: false,
    Q_esperado: null,
    run_life_dias: null,
    factores_penalizacion: {},
    capex_categoria: null,
    capex_extras: [],
  },

  step11: {
    completado: false,
    datasheet_ready: false,
  },

  // ── Control de flujo ─────────────────────────────────────────
  currentStep: 0,
  completedSteps: [],

  iterationLog: [],   // historial de todos los ciclos A–F con motivo y resultado

  designStatus: "in_progress",
  // "in_progress" | "approved" | "conditional" | "invalid"

  designStatusReason: null,
  // Texto explicativo del estado final

}
```

---

## 10. Criterios de validación del diseño final

El diseño se clasifica automáticamente al completar el PASO 11.

### Aprobado ✅

Todos los siguientes criterios son verdaderos:

| Criterio | Condición requerida |
|---|---|
| Candidatura | isCandidate = true o "conditional" |
| Caudal | Q_resultante ≥ Q_mínimo_operativo |
| GVF en succión | GVF_efectivo < 15% |
| BEP ratio | 70% ≤ bep_ratio ≤ 130% |
| Caída de voltaje | V_drop_pct ≤ 5% |
| Temperatura motor | T_motor_op < T_rated_motor |
| Temperatura aislamiento | T_avg < T_rated_aislamiento |
| Holgura mecánica | holgura_mm ≥ 6 mm |
| Riesgos críticos | Ningún riesgo en estado "danger" sin mitigación definida |

### Aprobado con condiciones ⚠️

Todos los criterios anteriores se cumplen, pero existe al menos uno de:
- isCandidate = "conditional"
- Algún criterio en valor límite (ej. holgura 6–8 mm)
- Algún riesgo en estado "warning" sin mitigación
- THD > 5% (no cumple IEEE 519) con VSD disponible en superficie
- Run life estimada < 180 días

### Inválido ❌

Al menos uno de:
- holgura_mm < 6 mm (bloqueo mecánico sin solución)
- T_motor_op ≥ T_rated_motor con todas las opciones agotadas
- Ninguna serie de bomba compatible en catálogo
- GVF_efectivo > 50% con todas las mitigaciones aplicadas

---

## 11. Hoja de selección

Formato del output final del PASO 11:

```
╔══════════════════════════════════════════════════════════════════╗
║           HOJA DE SELECCIÓN BES — SIMBES M9                      ║
╠══════════════════════════════════════════════════════════════════╣

DATOS DEL POZO
  Profundidad bomba:      XXXX m
  Presión reservorio Pr:  XXXX psi
  Presión burbuja Pb:     XXXX psi
  Pwf estratégico:        XXXX psi   (↑ decisión de yacimientos)
  Índice de Productividad: X.XX m³/d/psi
  Drawdown operativo:     XX.X%   (zona: Darcy / Vogel)
  Temperatura fondo:      XXX°C
  Casing drift ID:        X.XXX pulg

SUBSISTEMA HIDRÁULICO
  Q de diseño (a Pwf):    XX.X m³/d
  Q real en bomba:        XX.X m³/d (inc. gas libre y agua)
  GVF en succión:         X.X% (efectivo tras separación)
  Separador de gas:       [Ninguno / AGS rotativo / Gas handler]
  Corrección viscosidad:  [Sí μ=XX cp → H×X.XX, Q×X.XX / No]
  PIP (succión bomba):    XXXX psi

  Bomba — Serie:          [Serie seleccionada]
  Número de etapas:       XX
  Frecuencia operativa:   XX.X Hz
  BEP / Q operativo:      XX.X / XX.X m³/d → XX% BEP  ✅/⚠️
  TDH requerido:          XXXX ft
  TDH por fricción:       XXX ft   |   TDH estático: XXXX ft

SUBSISTEMA MOTOR
  Motor — HP seleccionado: XXX HP
  Voltaje:                 XXXX V
  Corriente nominal:       XX.X A
  Velocidad fluido anular: X.XX m/s   ✅/⚠️
  T° motor estimada:       XXX°C / T_rated: XXX°C   ✅/⚠️
  Shroud:                  [Sí / No]
  OD motor:                X.XXX pulg

SUBSISTEMA ELÉCTRICO
  Cable — Calibre:         AWG X
  Longitud:                XXXX m
  Caída de voltaje:        X.X% (límite 5%)   ✅/⚠️/❌
  T° promedio cable:       XXX°C
  Factor de vida Arrhenius: X.XX
  Tipo de aislamiento:     [NBR / EPDM / PEEK / Lead Sheath]
  VSD — Topología:         [6P / 12P / 18P / AFE]
  THD estimado:            XX% (IEEE 519-2014: < 5%)   ✅/❌

VERIFICACIÓN MECÁNICA
  OD máximo del string:    X.XXX pulg
  ID casing drift:         X.XXX pulg
  Holgura por lado:        X.X mm   ✅/⚠️/❌
  Dogleg admisible:        OK / Verificar con fabricante

RIESGOS OPERATIVOS
  Gas lock:                ✅/⚠️/❌  [mitigación]
  Sobrecalentamiento:      ✅/⚠️/❌  [mitigación]
  Corrosión H₂S:           ✅/⚠️/❌  [mitigación]
  Incrustaciones:          ✅/⚠️/❌  [mitigación]
  Abrasión sólidos:        ✅/⚠️/❌  [mitigación]
  Fatiga vibración:        ✅/⚠️/❌  [mitigación]
  Emulsión:                ✅/⚠️/❌  [mitigación]
  THD armónicos:           ✅/⚠️/❌  [mitigación]
  Temperatura aislamiento: ✅/⚠️/❌  [mitigación]

PARÁMETROS DE ARRANQUE
  Frecuencia inicial:      XX Hz
  Rampa de subida:         X.X Hz/min
  Frecuencia objetivo:     XX.X Hz

SET POINTS DE PROTECCIÓN
  Sobrecorriente (paro):   XX.X A
  Undercurrent (paro):     XX.X A
  T° motor (alerta):       XXX°C
  PIP mínimo (alerta):     XXXX psi
  Vibración (alerta):      4,0 mm/s RMS
  Vibración (paro):        8,0 mm/s RMS

VALIDACIÓN TÉCNICO-ECONÓMICA
  Q esperado en operación: XX.X m³/d
  Run life estimada:       XXX días
  Factores de penalización: [listado aplicados]
  CAPEX orientativo:       [Bajo / Medio / Alto / Muy Alto + extras]

ITERACIONES REALIZADAS
  [Log resumido de ciclos A–F con motivo y resultado]

╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ESTADO DEL DISEÑO: ✅ APROBADO                                 ║
║                    : ⚠️  APROBADO CON CONDICIONES                ║
║                    : ❌  INVÁLIDO — [motivo]                     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 12. Diferencias pedagógicas vs. M1–M8

### Tabla comparativa

| Aspecto | M1–M8 | M9 |
|---|---|---|
| Propósito | Entender física por subsistema | Proceso de diseño integrado real |
| Estructura | Tabs libres (Teoría / Sim / Caso / Eval) | Wizard secuencial de 12 pasos |
| Navegación | Cualquier orden, sin dependencias | Secuencial; paso siguiente bloqueado hasta completar el actual |
| Variables de entrada | El usuario controla todos los sliders | El usuario ingresa datos una vez (PASO 0); el resto es calculado o elegido entre opciones |
| Errores | Alertas informativas — el simulador sigue funcionando | Bloqueos que impiden avanzar + CICLO E es un bloqueo duro |
| Iteración | Manual y libre — el usuario explora | Guiada por el sistema: el simulador detecta el problema, propone la acción y registra el ciclo |
| Resultado | "Entendí el fenómeno X" | Hoja de selección BES completa lista para revisión técnica |
| Evaluación pedagógica | 5 preguntas de opción múltiple | Rúbrica de diseño: "¿Este diseño sería aprobado en campo? ¿Por qué?" |
| Conexión con otros módulos | Ninguna — cada módulo es independiente | Llama explícitamente a la física de M1, M2, M3, M4, M5, M6, M7 |
| Pwf | Variable de salida (resultado de la VLP) | Variable de entrada estratégica (decisión del equipo de yacimientos) |

### La pregunta de evaluación del M9

Al completar el diseño, el simulador hace la pregunta central:

> **"El diseño anterior sería llevado a revisión técnica con tu supervisor.
> Identifica los 3 aspectos que más reforzarías antes de esa reunión
> y justifica cada uno con un criterio técnico concreto."**

Esta pregunta no tiene respuesta de opción múltiple. El ingeniero
debe escribir su análisis. El simulador ofrece una rúbrica de referencia
al finalizar, comparando la respuesta con los criterios técnicos del diseño.

---

*Documento de arquitectura pedagógica — SIMBES M9*
*Versión 1.1 — Pwf como dato de entrada estratégico (corrección implementada)*
*Próximo paso: implementación en VS Code siguiendo esta especificación*
