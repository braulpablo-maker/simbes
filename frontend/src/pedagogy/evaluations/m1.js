/**
 * SIMBES — Evaluación Módulo 1: Análisis Nodal / IPR
 * ====================================================
 * Preguntas de evaluación y rúbrica de calificación.
 */

export const M1_EVALUATION = {
  module_id: 'm1',
  title:     'Evaluación — Análisis Nodal / IPR',
  passing_score: 70, // % mínimo para aprobar

  questions: [
    {
      id: 'q1',
      type: 'conceptual',
      question: 'Un pozo tiene Pr = 3000 psi y Pb = 1500 psi. Cuando la Pwf es 2000 psi, ¿qué modelo IPR aplica?',
      options: [
        { id: 'a', text: 'Vogel, porque hay gas libre en el yacimiento' },
        { id: 'b', text: 'Darcy, porque Pwf > Pb (todo el gas está disuelto)' },
        { id: 'c', text: 'Fetkovich, siempre se usa en pozos BES' },
        { id: 'd', text: 'El modelo compuesto, independientemente de Pwf' },
      ],
      correct: 'b',
      explanation: 'Cuando Pwf ≥ Pb, todo el gas permanece disuelto en el petróleo. El fluido se comporta como monofásico y aplica la ley de Darcy: Q = IP × (Pr − Pwf).',
      points: 20,
    },
    {
      id: 'q2',
      type: 'conceptual',
      question: '¿Qué ocurre con el punto de operación si aumentas la frecuencia del VSD de 50 Hz a 60 Hz?',
      options: [
        { id: 'a', text: 'El caudal se mantiene igual; solo cambia la presión' },
        { id: 'b', text: 'El caudal disminuye porque la bomba trabaja más fuerte' },
        { id: 'c', text: 'La curva VLP sube: la bomba aporta más altura y el caudal aumenta' },
        { id: 'd', text: 'No hay efecto porque el yacimiento controla la producción' },
      ],
      correct: 'c',
      explanation: 'Por las Leyes de Afinidad: H ∝ (f)² y Q ∝ f. Al subir de 50→60 Hz, la bomba genera más altura y la curva VLP se desplaza hacia la derecha-abajo, intersectando la IPR a mayor caudal.',
      points: 20,
    },
    {
      id: 'q3',
      type: 'calculation',
      question: 'Un pozo tiene IP = 2 STB/d/psi, Pr = 2000 psi, Pb = 2000 psi (yacimiento saturado). ¿Cuál es el AOF?',
      options: [
        { id: 'a', text: '4000 STB/d' },
        { id: 'b', text: '2222 STB/d' },
        { id: 'c', text: '3600 STB/d' },
        { id: 'd', text: '1800 STB/d' },
      ],
      correct: 'b',
      explanation: 'Si Pr = Pb, toda la producción es por Vogel (Qb = 0). AOF = (IP × Pb) / 1.8 = (2 × 2000) / 1.8 = 2222 STB/d.',
      points: 20,
    },
    {
      id: 'q4',
      type: 'diagnostic',
      question: 'La carta ampériométrica muestra corriente estable al 95% del nominal y el caudal está al 120% del BEP. ¿Cuál es el riesgo principal?',
      options: [
        { id: 'a', text: 'Recirculación interna y sobrecalentamiento del motor' },
        { id: 'b', text: 'Surging (cavitación) con posible daño a impulsores' },
        { id: 'c', text: 'Gas lock inminente' },
        { id: 'd', text: 'El sistema opera en condiciones óptimas' },
      ],
      correct: 'b',
      explanation: 'Operar sobre el 110–115% del BEP ingresa a la zona de surging: la bomba cavita en los canales de descarga, generando vibración, erosión de impulsores y posible colapso del punto de operación.',
      points: 20,
    },
    {
      id: 'q5',
      type: 'action',
      question: 'El drawdown es del 85% (Pwf = 15% de Pr). ¿Cuál es la acción correcta?',
      options: [
        { id: 'a', text: 'Subir la frecuencia del VSD para producir más' },
        { id: 'b', text: 'Bajar la frecuencia del VSD para reducir el drawdown y proteger el yacimiento' },
        { id: 'c', text: 'Instalar un separador de gas (AGS)' },
        { id: 'd', text: 'Aumentar el diámetro del tubing' },
      ],
      correct: 'b',
      explanation: 'Un drawdown > 82% (Pwf muy baja) indica sobre-explotación del yacimiento. Riesgos: conificación de gas/agua, producción de arena, colapso de formación. La acción correcta es bajar la frecuencia del VSD para subir Pwf.',
      points: 20,
    },
  ],
};

/**
 * Califica una respuesta al Módulo 1.
 *
 * @param {Object} answers  - { q1: 'b', q2: 'c', ... }
 * @returns {{ score_pct, passed, feedback }}
 */
export function gradeM1(answers) {
  let total = 0, earned = 0;
  const feedback = [];

  for (const q of M1_EVALUATION.questions) {
    total += q.points;
    const correct = answers[q.id] === q.correct;
    if (correct) earned += q.points;
    feedback.push({
      question_id: q.id,
      correct,
      selected:    answers[q.id],
      correct_ans: q.correct,
      explanation: q.explanation,
      points:      correct ? q.points : 0,
    });
  }

  const score_pct = Math.round((earned / total) * 100);
  return {
    score_pct,
    earned_points: earned,
    total_points:  total,
    passed:        score_pct >= M1_EVALUATION.passing_score,
    feedback,
  };
}
