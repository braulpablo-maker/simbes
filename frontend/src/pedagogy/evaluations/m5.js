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
    explanation:
      'La clave es la correlación: Ps = 420 psi con Pb = 1200 psi significa GVF alto en succión (Ps << Pb). El gas libre en la bomba explica los tres síntomas simultáneamente: (1) corriente baja porque la bomba gira en fluido de baja densidad/gas (subcarga), (2) vibración elevada por la ingesta intermitente de gas que genera cavitación y surging, (3) el patrón integrado señala un problema de presión de succión, no un fallo mecánico o eléctrico aislado. Solución: instalar separador AGS o reducir el drawdown aumentando Pwf.',
  },
];

/**
 * Califica una respuesta al Módulo 5.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM5(answers) {
  const total = M5_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M5_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
