/**
 * SIMBES — Evaluación Módulo 5: Sensores y Monitoreo
 * ==================================================
 * 5 preguntas sobre cartas amperimétricas, vibración, P/T downhole y diagnóstico integrado.
 */

export const M5_QUESTIONS = [
  {
    id: 'm5q1',
    text: 'En una carta amperimérica BES, se observa que la corriente del motor oscila entre 65 A y 95 A con una frecuencia de aproximadamente 0.4 Hz (período ≈ 2.5 s). La corriente nominal es 80 A. ¿Qué condición describe este patrón?',
    options: [
      { id: 'a', text: 'Gas lock — la bomba gira en gas y pierde succión' },
      { id: 'b', text: 'Surging — la bomba opera fuera del BEP con ingesta intermitente de gas' },
      { id: 'c', text: 'Operación normal — variaciones de corriente dentro del ±20% son aceptables' },
      { id: 'd', text: 'Overload — el motor está jalando más corriente de lo nominal' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El gas lock produciría una caída abrúpta a menos del 20% y estable (mientras no recupere cebo), no oscilante en ~0.4 Hz.',
      c: '❌ Incorrecto: Oscilaciones repetitivas y sostenidas son un síntoma patológico, no operación normal, y acortan drásticamente la vida útil.',
      d: '❌ Incorrecto: Overload (sobrecarga) mostraría una amperimétrica alta sobre 80A, constante, debido al mayor esfuerzo (fluido pesado, arrastre mecánico).'
    },
    explanation:
      'El patrón de corriente oscilante (surging) es característico de una bomba operando fuera del BEP, generalmente a caudal muy alto o con ingesta cíclica de gas. La frecuencia de oscilación (0.3–0.8 Hz) refleja el ciclo de llenado-vaciado de la etapa afectada. El gas lock produce una caída ABRUPTA y sostenida de corriente a <20% nominal, no oscilaciones. La solución típica del surging es reducir la frecuencia VSD o aumentar la presión de succión.',
  },
  {
    id: 'm5q2',
    text: 'Un sensor de vibración instalado en el cabezal de un BES registra un RMS de 5.2 mm/s y picos de 8.5 mm/s. Según los criterios de alerta operativa:',
    options: [
      { id: 'a', text: 'Operación normal — el umbral de alerta es 10 mm/s RMS' },
      { id: 'b', text: 'Alerta temprana — RMS está entre 4–6.3 mm/s (zona B), investigar causa' },
      { id: 'c', text: 'Paro inmediato — RMS > 4 mm/s es siempre condición de paro' },
      { id: 'd', text: 'No hay acción — solo importan los picos, no el RMS' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 10 mm/s es un valor crítico en zona de falla destructiva, no el límite normal de operación.',
      c: '❌ Incorrecto: > 4 mm/s RMS entra a zona de alerta o investigación (Zona B), pero el paro inmediato aplica generalmente cuando excede los umbrales de Zona C.',
      d: '❌ Incorrecto: El valor RMS es el estándar métrico de la energía vibratoria sostenida en maquinaria rotativa. Los picos también importan para fatiga, pero el RMS clasifica el estado de ISO.'
    },
    explanation:
      'Según ISO 10816-3 y API RP 11S5, los umbrales de vibración para BES son: Zona A (<4 mm/s RMS) = normal, Zona B (4–6.3 mm/s) = alerta temprana — investigar causa sin paro inmediato, Zona C (>6.3 mm/s) = paro recomendado. Con 5.2 mm/s RMS estamos en Zona B: el equipo puede seguir operando pero se debe identificar la causa (desbalanceo, rodamiento, cavitación) y planificar inspección.',
  },
  {
    id: 'm5q3',
    text: 'El sensor DPTS (Downhole Pressure & Temperature Sensor) de un BES en un pozo de 2000 m registra T_motor = 195°C. El motor tiene aislamiento clase H (límite 180°C). ¿Qué implica esto?',
    options: [
      { id: 'a', text: 'La temperatura es normal — los motores BES operan sobre 200°C habitualmente' },
      { id: 'b', text: 'ΔT = 15°C sobre límite → vida del aislamiento reducida a ~35% por Arrhenius' },
      { id: 'c', text: 'El sensor está fallando — no puede haber temperatura sobre la nominal' },
      { id: 'd', text: 'Solo importa si la temperatura supera 220°C (clase C)' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Todos los motores tienen una clase de aislamiento que marca su vida estándar. De 180 a 195 hay un daño exponencial sistemático.',
      c: '❌ Incorrecto: No es una falla del sensor, el motor se calienta por sobrecarga o falta de enfriamiento.',
      d: '❌ Incorrecto: 220°C es el límite de los polímeros tipo PEEK y aislamientos super-premium (Clase C), los cables clase H se derretirían antes.'
    },
    explanation:
      'Con T_motor = 195°C y límite clase H = 180°C, ΔT = 15°C. Aplicando Arrhenius: factor = 2^(−15/10) = 2^(−1.5) ≈ 0.354, es decir, la vida útil del aislamiento cae al ~35% del nominal. Esto NO es una lectura de sensor fallido — es una condición operativa real que requiere acción: verificar el caudal de refrigeración (depende del fluido producido), evaluar reducir la frecuencia VSD, o considerar un motor de mayor clase térmica.',
  },
  {
    id: 'm5q4',
    text: 'Un análisis de vibración muestra impactos periódicos de alta frecuencia (≈300 Hz) con amplitudes de 7–9 mm/s, sobre un nivel de ruido base de 0.5 mm/s. ¿Cuál es el diagnóstico más probable?',
    options: [
      { id: 'a', text: 'Desbalanceo de rotor — componente dominante a 1× frecuencia de rotación (60 Hz)' },
      { id: 'b', text: 'Defecto de rodamiento (Ball Pass Frequency) — impactos periódicos de alta frecuencia' },
      { id: 'c', text: 'Cavitación — ruido broadband distribuido uniformemente en frecuencia' },
      { id: 'd', text: 'Operación normal — frecuencias sobre 200 Hz no son relevantes en BES' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El desbalanceo provoca frecuencias de giro a 1X (ej. 60Hz), no impactos de alta frecuencia.',
      c: '❌ Incorrecto: La cavitación produce un ruido distribuido (broadband) que chilla contínuo, no en marcados picos periódicos altos.',
      d: '❌ Incorrecto: Las altas frecuencias determinan armónicos complejos y resonancias de rodamientos desgastados, son datos diagnósticos fundamentales.'
    },
    explanation:
      'Los impactos periódicos de alta frecuencia son característicos de fallas de rodamiento (Ball Pass Frequency Outer race — BPFO). Para un rodamiento típico BES a 3600 RPM (60 Hz), el BPFO suele estar entre 4×–6× la frecuencia de rotación (240–360 Hz). El desbalanceo genera componente dominante a 1× (60 Hz), la cavitación genera ruido aleatorio broadband, y la frecuencia alta con impactos periódicos define el patrón de rodamiento. Acción: planificar extracción inmediata antes de falla catastrófica.',
  },
  {
    id: 'm5q5',
    text: 'Un BES muestra simultáneamente: (1) corriente baja ≈60% nominal, (2) vibración elevada 5.8 mm/s, (3) Ps = 420 psi con Pb = 1200 psi. ¿Cuál es el diagnóstico integrado más probable?',
    options: [
      { id: 'a', text: 'Motor en perfectas condiciones — los tres síntomas no están relacionados' },
      { id: 'b', text: 'Alta viscosidad del crudo — produce sobrecarga y vibración simultáneamente' },
      { id: 'c', text: 'Gas libre en bomba (Ps << Pb) → subcarga + cavitación/surging + vibración' },
      { id: 'd', text: 'Falla de cable eléctrico — la caída de voltaje explica todos los síntomas' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: Estas lecturas componen un patrón clásico unificado de fallas con fluidos bifásicos (alta vibración por choque, corriente errática, caída de P).',
      b: '❌ Incorrecto: Alta viscosidad produce amperajes elevadisimos (overload) para poder mover la emulsión espesa.',
      d: '❌ Incorrecto: Una baja de tensión da un overload aparente, pero no explica por sí sola la caída drástica de un gradiente de fluido bajo la Pb.'
    },
    explanation:
      'La clave es la correlación: Ps = 420 psi con Pb = 1200 psi significa GVF alto en succión (Ps << Pb). El gas libre en la bomba explica los tres síntomas simultáneamente: (1) corriente baja porque la bomba gira en fluido de baja densidad/gas (subcarga), (2) vibración elevada por la ingesta intermitente de gas que genera cavitación y surging, (3) el patrón integrado señala un problema de presión de succión, no un fallo mecánico o eléctrico aislado. Solución: instalar separador AGS o reducir el drawdown aumentando Pwf.',
  },
  {
    id: 'm5q6',
    text: 'La carta amperiométrica de un BES muestra corriente constante en 105 A durante 6 horas (nominal 80 A), sin oscilaciones. ¿Cuál es el diagnóstico más probable?',
    options: [
      { id: 'a', text: 'Surging — corriente oscilante por ingesta cíclica de gas' },
      { id: 'b', text: 'Sobrecarga (overload) — el motor jala más corriente del nominal de forma sostenida' },
      { id: 'c', text: 'Subcarga — corriente alta indica poca carga mecánica en el rotor' },
      { id: 'd', text: 'Gas lock — el motor se carga al intentar impulsar fluido muy denso' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Surging mostraría oscilaciones erráticas constantes de la corriente eléctrica, no un estado estable en 105 A.',
      c: '❌ Incorrecto: Al contrario, el motor está consumiendo más corriente de placa, indicando mayor carga (esfuerzo electromecánico).',
      d: '❌ Incorrecto: Gas lock hace caer el amperaje bruscamente a niveles bajos sostenidos debido a pérdida de fluido para mover (subcarga o vacío).'
    },
    explanation:
      'Corriente estable > 100% del nominal durante horas es el patrón clásico de overload (sobrecarga). Causas posibles: fluido más denso de lo diseñado, incrustaciones en impulsores (mayor fricción interna), bomba corriendo sobre el BEP. El overload sostenido activa las protecciones del VSD y acelera la degradación térmica del motor (Arrhenius activo). Diferencia con surging: el surging es OSCILANTE (períodos de segundos); el overload es ESTABLE y elevado. Acción: reducir frecuencia o investigar causa de mayor carga.',
  },
  {
    id: 'm5q7',
    text: 'El sensor DPTS registra T_motor = 175°C (motor clase H, límite 180°C) y una tendencia de aumento de 2°C/día. ¿Cuántos días antes de alcanzar el límite y qué acción tomar?',
    options: [
      { id: 'a', text: '2.5 días — acción inmediata: reducir frecuencia VSD o aumentar caudal de refrigeración' },
      { id: 'b', text: '25 días — no hay urgencia, monitorear semanalmente' },
      { id: 'c', text: 'El límite ya fue superado — el sensor está mal calibrado' },
      { id: 'd', text: 'La tendencia de 2°C/día es normal y no requiere intervención' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Matemáticamente 180-175 = 5 grados remanentes. A 2° por día, cruzarás el umbral en 2.5 días, no en 25.',
      c: '❌ Incorrecto: No has cruzado el límite, solo estás por abordarlo apresuradamente.',
      d: '❌ Incorrecto: Un aumento constante de temperatura del motor en fondo casi siempre señala sobrecarga en proceso mecánico y eléctrico y requiere inmediata acción.'
    },
    explanation:
      'Con T = 175°C y tendencia +2°C/día, en (180−175)/2 = 2.5 días se alcanza el límite clase H. La acción es inmediata: (1) reducir frecuencia del VSD para bajar la corriente y el calentamiento del motor, (2) verificar que el caudal de producción (que refrigera el motor) sea suficiente, (3) si la temperatura sigue subiendo, planificar extracción preventiva. Esperar 25 días sería ignorar una tendencia alarmante que puede derivar en falla de aislamiento irreversible.',
  },
  {
    id: 'm5q8',
    text: 'El nivel de vibración de un BES sube de 3.2 mm/s a 6.8 mm/s RMS en una semana. Según ISO 10816 para BES:',
    options: [
      { id: 'a', text: 'No es preocupante — ambos valores están dentro de la zona A (<7 mm/s)' },
      { id: 'b', text: 'El valor inicial era zona A (normal); el actual es zona C (>6.3 mm/s): paro recomendado' },
      { id: 'c', text: 'Ambos están en zona B (alerta); monitorear cada 48 horas' },
      { id: 'd', text: 'Se requiere paro inmediato porque cualquier aumento de vibración es señal de falla catastrófica' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El límite superior de Zona A suele ser 4 mm/s, no 7. 6.8 ya es crítico (Zona C).',
      c: '❌ Incorrecto: Zona B (alerta) abarca de 4 a 6.3 mm/s. El equipo superó ese nivel.',
      d: '❌ Incorrecto: Paro recomendado según criterio técnico y operativo (Zona C), pero decir "cualquier aumento" es exagerado (hasta 4 mm/s RMS es normal y fluctúa).'
    },
    explanation:
      'Zona A: < 4 mm/s (normal). Zona B: 4–6.3 mm/s (alerta, investigar). Zona C: > 6.3 mm/s (paro recomendado). 3.2 mm/s era zona A (normal). 6.8 mm/s es zona C — el equipo entró en paro recomendado. La transición de A→C en una semana indica deterioro rápido: posible inicio de falla de rodamiento o degradación por cavitación. La velocidad del cambio es tan importante como el valor absoluto — un cambio gradual de meses en zona B es diferente a un salto semanal de A a C.',
  },
  {
    id: 'm5q9',
    text: 'El sensor de presión intake (Ps) de un BES muestra una caída progresiva de 1800 psi a 900 psi en 3 meses, mientras el caudal se mantiene estable. La Pb del yacimiento es 1200 psi. ¿Qué indica esta tendencia?',
    options: [
      { id: 'a', text: 'El yacimiento se está agotando — Pr disminuye y con él la Ps' },
      { id: 'b', text: 'La bomba está perdiendo eficiencia — genera menos presión diferencial' },
      { id: 'c', text: 'El drawdown aumentó y Ps ya cruzó por debajo de Pb: hay gas libre en succión creciente' },
      { id: 'd', text: 'El sensor de presión está descalibrado — Ps no puede caer sin cambios en caudal' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: El agotamiento de un yacimiento (Pr reducida) no asume caudal mantenido estable.',
      b: '❌ Incorrecto: Si la bomba perdiera eficiencia hidráulica, mantendría la presión de succión o subiría, no caería forzosamente arrastrando a Ps.',
      d: '❌ Incorrecto: Descalibraciones ocurren, pero la caída sistemática por abatir el nivel dinámico mientras se exprime un fluido con el choke es un problema real.'
    },
    explanation:
      'Cuando Ps cruza por debajo de Pb (1200 psi), el gas en solución se libera y el GVF en la succión aumenta. La Ps cayó de 1800 (> Pb) a 900 psi (< Pb), lo que significa que el pozo está sobreproduciendo: el drawdown aumentó y el sistema está operando con gas libre creciente en la succión. El caudal estable puede ser ilusorio — si el GVF sigue subiendo, eventualmente la bomba comenzará a perder altura. Acción: reducir frecuencia VSD para subir Ps sobre Pb.',
  },
  {
    id: 'm5q10',
    text: 'Un BES registra estos datos simultáneos: corriente = 110% del nominal, vibración = 2.1 mm/s, Ps = 1850 psi (Pb = 1200 psi), T_motor = 168°C (clase H). ¿Cuál es el diagnóstico integrado?',
    options: [
      { id: 'a', text: 'Gas libre en succión — corriente baja + vibración alta son la firma' },
      { id: 'b', text: 'Overload: fluido más denso o incrustaciones — corriente alta sin otras alarmas críticas' },
      { id: 'c', text: 'Falla de rodamiento inminente — vibración baja engaña pero es la señal temprana' },
      { id: 'd', text: 'Sistema en perfectas condiciones — todos los parámetros son normales' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El gas libre tendería a mostrar baja corriente (subcarga), y aquí está en overload (110%).',
      c: '❌ Incorrecto: Un rodamiento gastado se anuncia sobre todo con subidas rápidas e incrementales en RMS y de pico, pero acá está nominal (2.1 mm/s = Zona A).',
      d: '❌ Incorrecto: Corriente por encima del 100% en condiciones base amerita atención de seguridad, no se puede dejar "en perfectas condiciones".'
    },
    explanation:
      'Análisis integrado: (1) corriente 110% nominal = sobrecarga — la bomba trabaja más de lo diseñado; (2) vibración 2.1 mm/s = zona A, normal — no hay problema mecánico; (3) Ps = 1850 > Pb = 1200 — sin gas libre, no hay gas lock; (4) T = 168°C < 180°C — dentro del rango. El único dato anómalo es la corriente alta. Diagnóstico: overload por fluido más denso de lo diseñado (ej. cambio en mezcla agua-petróleo) o incrustaciones incipientes. Sin alarmas de vibración ni de gas, la prioridad es investigar el cambio de densidad o calcular el TDH actual.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M5_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 5.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM5(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M5_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
