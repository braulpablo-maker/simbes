/**
 * SIMBES — Evaluación Módulo 3: Gas y Flujo Multifásico
 * =====================================================
 * 5 preguntas sobre GVF, gas lock, degradación H-Q, viscosidad y separadores.
 */

export const M3_QUESTIONS = [
  {
    id: 'm3q1',
    text: 'El "gas lock" en una bomba BES ocurre típicamente cuando:',
    options: [
      { id: 'a', text: 'GVF > 5% en la succión de la bomba' },
      { id: 'b', text: 'GVF > 15% en la succión sin separación activa de gas' },
      { id: 'c', text: 'La presión de succión Ps supera la presión de burbuja Pb' },
      { id: 'd', text: 'El GOR superficial supera los 100 scf/STB' },
    ],
    correct: 'b',
    explanation:
      'El umbral industrial de gas lock para BES es GVF > 15% en la succión de la bomba (sin separador). Por encima de ese valor, la bomba comienza a recircular gas en lugar de bombearlo, perdiendo altura y caudal hasta el paro total. El GOR superficial no es el parámetro de control directo — lo que importa es el GVF a las condiciones de presión y temperatura del fondo.',
  },
  {
    id: 'm3q2',
    text: 'En un pozo con GVF wellbore = 25%, se instala un AGS pasivo con eficiencia de separación del 65%. ¿Cuál es el GVF efectivo en la succión de la bomba?',
    options: [
      { id: 'a', text: '25% — el AGS no cambia el GVF a esa eficiencia' },
      { id: 'b', text: '8.75% — GVF_bomba = 25% × (1 − 0.65)' },
      { id: 'c', text: '16.25% — GVF_bomba = 25% − 65% ÷ 4' },
      { id: 'd', text: '0% — el AGS elimina completamente el gas libre' },
    ],
    correct: 'b',
    explanation:
      'GVF_bomba = GVF_pozo × (1 − η_sep) = 25% × (1 − 0.65) = 25% × 0.35 = 8.75%. El AGS no elimina el 100% del gas — la fracción no separada (35%) sigue llegando a la bomba. Con 8.75% en succión, la operación está en zona segura (< 15%), aunque en la zona "leve" del diagrama de degradación.',
  },
  {
    id: 'm3q3',
    text: 'A medida que el GVF en la succión aumenta de 5% a 20%, la curva H-Q de la bomba BES:',
    options: [
      { id: 'a', text: 'Se desplaza hacia arriba (más altura por la menor densidad del fluido)' },
      { id: 'b', text: 'Permanece sin cambios — el gas no afecta bombas centrífugas' },
      { id: 'c', text: 'Se degrada: la altura y la capacidad de caudal disminuyen' },
      { id: 'd', text: 'Solo se desplaza el BEP a mayor caudal; la forma no cambia' },
    ],
    correct: 'c',
    explanation:
      'El gas libre en la succión reduce la capacidad hidráulica de la bomba centrífuga. A GVF > 10%, la altura cae de forma apreciable; a GVF > 15%, la degradación es severa y puede llevar a pérdida total de altura (gas lock). El mecanismo: el gas compresible no transfiere presión como los líquidos, reduciendo la eficiencia de cada etapa.',
  },
  {
    id: 'm3q4',
    text: 'Una bomba BES maneja un crudo con viscosidad de 30 cP (vs. agua = 1 cP). Según la corrección del Hydraulic Institute, ¿qué ocurre con H, Q y eficiencia?',
    options: [
      { id: 'a', text: 'H y Q aumentan porque el fluido tiene mayor masa' },
      { id: 'b', text: 'H, Q y eficiencia disminuyen — la curva H-Q se degrada' },
      { id: 'c', text: 'Solo la eficiencia disminuye; H y Q permanecen constantes' },
      { id: 'd', text: 'El flujo se vuelve laminar, lo que hace la operación más estable' },
    ],
    correct: 'b',
    explanation:
      'El método HI (ANSI/HI 9.6.7) establece tres factores de corrección: CQ < 1, CH < 1, CE < 1. Para 30 cP, CQ ≈ 0.86, CH ≈ 0.93, CE ≈ 0.74 (valores típicos). Esto significa que la bomba produce menos caudal, menos altura y opera con menor eficiencia que en agua. El diseñador debe sobredimensionar para compensar.',
  },
  {
    id: 'm3q5',
    text: 'Un pozo presenta GVF = 18% y síntomas de gas lock (caída de caudal, vibración elevada). ¿Cuál es la solución más directa y efectiva?',
    options: [
      { id: 'a', text: 'Aumentar la frecuencia del VSD a 70 Hz' },
      { id: 'b', text: 'Instalar un AGS o Gas Handler en la intake de la bomba' },
      { id: 'c', text: 'Aumentar la altura H₀ por etapa usando otra bomba' },
      { id: 'd', text: 'Reducir la presión de cabezal abriendo el choke' },
    ],
    correct: 'b',
    explanation:
      'Con GVF > 15%, la solución de raíz es reducir el GVF efectivo en la succión de la bomba — no incrementar velocidad ni cambiar la bomba. Un AGS pasivo (η ≈ 65%) o Gas Handler (η ≈ 82%) reduciría el GVF de 18% a ~6.3% o ~3.2% respectivamente, eliminando el gas lock. Aumentar frecuencia agrava el problema al reducir Ps (mayor drawdown). Reducir Pwh reduce ligeramente Ps pero no soluciona el GVF fundamentalmente.',
  },
];

/**
 * Califica una respuesta al Módulo 3.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM3(answers) {
  const total = M3_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M3_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
