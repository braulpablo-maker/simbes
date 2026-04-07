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
      incorrect_feedback: {
        a: '❌ Incorrecto: Al ser Pwf > Pb no existe gas libre, ya que la presión supera la de burbujeo.',
        c: '❌ Incorrecto: Fetkovich se usa principalmente en gas o casos particulares, no está ligado a BES en sí.',
        d: '❌ Incorrecto: El modelo compuesto solo aplica si Pwf < Pb.'
      },
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
      incorrect_feedback: {
        a: '❌ Incorrecto: Las leyes de afinidad dictan que Q aumenta proporcional a la frecuencia.',
        b: '❌ Incorrecto: La bomba trabajará más fuerte para entregar más caudal y más cabeza (altura), no menos caudal.',
        d: '❌ Incorrecto: El yacimiento controla la IPR, pero la bomba genera la VLP; al moverse la VLP, cambia el punto de operación.'
      },
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
      incorrect_feedback: {
        a: '❌ Incorrecto: Calculaste AOF = IP × Pr lo cual es erróneo porque Pr=Pb implica Vogel al 100%.',
        c: '❌ Incorrecto: La fórmula del AOF para yacimientos saturados es (IP × Pb) / 1.8.',
        d: '❌ Incorrecto: El valor de (IP × Pb) / 1.8 no da este resultado.'
      },
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
      incorrect_feedback: {
        a: '❌ Incorrecto: La recirculación interna ocurre cuando el caudal está muy *por debajo* del BEP (ej. < 60%).',
        c: '❌ Incorrecto: El gas lock depende del gas libre y GVF, no del caudal relativo al BEP en sí mismo.',
        d: '❌ Incorrecto: El 120% del BEP está fuera de la zona óptima de la bomba (generalmente 70-110%).'
      },
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
      incorrect_feedback: {
        a: '❌ Incorrecto: Subir la frecuencia aumentaría la producción pero hundiría la Pwf más, agravando el riesgo.',
        c: '❌ Incorrecto: Un AGS no soluciona el problema de fondo que es la sobre-explotación del yacimiento.',
        d: '❌ Incorrecto: Aumentar el tubing puede cambiar la fricción, pero no aborda el exceso de potencia de bombeo aplicado.'
      },
      explanation: 'Un drawdown > 82% (Pwf muy baja) indica sobre-explotación del yacimiento. Riesgos: conificación de gas/agua, producción de arena, colapso de formación. La acción correcta es bajar la frecuencia del VSD para subir Pwf.',
      points: 20,
    },
    {
      id: 'q6',
      type: 'calculation',
      question: 'Un pozo tiene Pr = 2500 psi, Pb = 2500 psi (saturado), IP = 1.8 STB/d/psi. ¿Cuál es el caudal de burbuja (Qb) y el AOF usando el modelo de Vogel completo?',
      options: [
        { id: 'a', text: 'Qb = 0 STB/d; AOF = 2500 STB/d' },
        { id: 'b', text: 'Qb = 0 STB/d; AOF = 2500 STB/d (= IP×Pb/1.8)' },
        { id: 'c', text: 'Qb = 4500 STB/d; AOF = 2500 STB/d' },
        { id: 'd', text: 'Qb = 1800 STB/d; AOF = 1800 STB/d' },
      ],
      correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Aunque Qb es 0 y el AOF final numérico sea igual, teóricamente no se expresa de esta forma parcial.',
        c: '❌ Incorrecto: El caudal de burbuja es nulo; Pwf solo puede decrecer por debajo de Pb.',
        d: '❌ Incorrecto: Revisa la fórmula del AOF para el modelo de Vogel en yacimientos saturados.'
      },
      explanation: 'Cuando Pr = Pb (yacimiento completamente saturado), el punto de burbuja coincide con la presión de reservorio, por lo que Qb = 0 (no hay flujo por Darcy). El AOF = (IP × Pb) / 1.8 = (1.8 × 2500) / 1.8 = 2500 STB/d. Las opciones A y B son equivalentes numéricamente: la distinción es que Qb=0 y todo el flujo se describe por Vogel.',
      points: 20,
    },
    {
      id: 'q7',
      type: 'conceptual',
      question: 'En el modelo IPR compuesto (Darcy + Vogel), ¿qué ocurre con la curva IPR en la transición Pwf = Pb?',
      options: [
        { id: 'a', text: 'La curva tiene una discontinuidad (quiebre abrupto) en Pwf = Pb' },
        { id: 'b', text: 'La pendiente cambia suavemente: de lineal (Pwf > Pb) a cóncava (Pwf < Pb), pero la curva es continua' },
        { id: 'c', text: 'La curva se vuelve vertical en Pwf = Pb porque el gas libre bloquea el flujo' },
        { id: 'd', text: 'No hay cambio de modelo — Vogel aplica para todo el rango de Pwf' },
      ],
      correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El modelo fue diseñado precisamente para evitar una discontinuidad.',
        c: '❌ Incorrecto: La curva no se vuelve vertical; solo reduce su aporte de caudal (se aplana).',
        d: '❌ Incorrecto: Vogel no puede modelar la región lineal por encima del punto de burbuja.'
      },
      explanation: 'El modelo compuesto garantiza continuidad en Pwf = Pb: la recta de Darcy (Q = IP×(Pr−Pwf) para Pwf ≥ Pb) se une suavemente con la parábola de Vogel (Q = Qb × [1 − 0.2(Pwf/Pb) − 0.8(Pwf/Pb)²] para Pwf < Pb). La pendiente sí cambia en Pb — la curva se vuelve más aplanada porque el gas liberado reduce la movilidad del petróleo.',
      points: 20,
    },
    {
      id: 'q8',
      type: 'calculation',
      question: 'Una bomba opera a 50 Hz con Q = 350 STB/d y H = 4000 ft. Se sube a 60 Hz. Por las Leyes de Afinidad, ¿cuáles son el nuevo Q y la nueva H aproximados?',
      options: [
        { id: 'a', text: 'Q₂ = 420 STB/d; H₂ = 4800 ft' },
        { id: 'b', text: 'Q₂ = 420 STB/d; H₂ = 5760 ft' },
        { id: 'c', text: 'Q₂ = 350 STB/d; H₂ = 5760 ft' },
        { id: 'd', text: 'Q₂ = 504 STB/d; H₂ = 5760 ft' },
      ],
      correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Calculaste la altura linealmente (como el caudal), pero la altura varía con el *cuadrado* de la relación.',
        c: '❌ Incorrecto: El caudal debe aumentar con la frecuencia.',
        d: '❌ Incorrecto: Calculaste todo incorrectamente; revisa (60/50) * Q1.'
      },
      explanation: 'Leyes de Afinidad: Q₂/Q₁ = f₂/f₁ → Q₂ = 350 × (60/50) = 420 STB/d. H₂/H₁ = (f₂/f₁)² → H₂ = 4000 × (60/50)² = 4000 × 1.44 = 5760 ft. Importante: H escala con el CUADRADO de la relación de frecuencia, por eso el incremento de cabeza es proporcionalmente mayor que el de caudal.',
      points: 20,
    },
    {
      id: 'q9',
      type: 'diagnostic',
      question: 'El punto de operación está al 70% del BEP (Q_op = 0.7 × Q_BEP). ¿Cuál es el riesgo principal y la consecuencia observable?',
      options: [
        { id: 'a', text: 'Surging — la bomba opera sobre el BEP y cavita en descarga' },
        { id: 'b', text: 'Recirculación interna — la bomba opera bajo el BEP, genera vibración y calentamiento' },
        { id: 'c', text: 'Gas lock — la presión baja demasiado y el gas se libera' },
        { id: 'd', text: 'No hay riesgo — operar al 70% del BEP es zona segura' },
      ],
      correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El surging cavita en la descarga de la bomba operando muy a la *derecha* del BEP, no a la izquierda.',
        c: '❌ Incorrecto: Operar a bajo caudal no disminuye la presión de entrada (Pwf), de hecho comúnmente la *aumenta*.',
        d: '❌ Incorrecto: 70% del BEP está en el umbral de recirculación que causa daño mecánico a mediano plazo.'
      },
      explanation: 'Operar por debajo del BEP (< 80% del BEP) genera recirculación interna en los canales del impulsor: el fluido gira sin avanzar, generando calentamiento por disipación viscosa y vibración por impacto de vórtices. El surging ocurre en el extremo opuesto (> 110–115% BEP). Zona de operación segura: 80–110% del BEP. La corriente también cae bajo el BEP, lo que puede activar protección de subcarga.',
      points: 20,
    },
    {
      id: 'q10',
      type: 'action',
      question: 'Un pozo BES tiene IP medido = 3.0 STB/d/psi pero el pozo está skin (+15). Si se hace estimulación y se elimina el skin, ¿qué ocurre con el IP efectivo y cómo cambia el punto de operación?',
      options: [
        { id: 'a', text: 'El IP no cambia — el skin solo afecta la presión de boca de pozo' },
        { id: 'b', text: 'El IP aumenta porque el daño de formación ya no restringe el flujo; la curva IPR se desplaza a mayor caudal' },
        { id: 'c', text: 'El IP disminuye porque la estimulación reduce la presión del yacimiento' },
        { id: 'd', text: 'El IP se duplica exactamente al eliminar todo el skin' },
      ],
      correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El skin no es algo físico en superficie, está en el downhole; el IP mejorará (aumentando Q).',
        c: '❌ Incorrecto: Reducir el daño de formación no reduce la presión de reservorio; favorece el flujo.',
        d: '❌ Incorrecto: Calcular el doble exacto es fortuito; el cambio real depende matemáticamente del factor de daño.'
      },
      explanation: 'El skin positivo (+15) actúa como una resistencia adicional al flujo. El IP medido ya incluye el efecto del skin (IP_medido < IP_real). Al eliminarlo, el IP efectivo aumenta: IP_real = IP_medido / (1 − S_corrección). La curva IPR se desplaza hacia la derecha (mayor AOF), y si la bomba opera a la misma frecuencia, el punto de operación se mueve a mayor caudal. El operador debe verificar que el nuevo caudal no supere el BEP de la bomba.',
      points: 20,
    },
  ],
};

/**
 * Devuelve una muestra aleatoria de n preguntas del pool.
 * @param {number} n
 * @returns {Array}
 */
export function sampleQuestions(n = 5) {
  const pool = [...M1_EVALUATION.questions];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 1.
 *
 * @param {Object} answers   - { q1: 'b', q2: 'c', ... }
 * @param {Array}  questions - subconjunto muestreado (por defecto todas)
 * @returns {{ score_pct, passed, feedback }}
 */
export function gradeM1(answers, questions = M1_EVALUATION.questions) {
  let total = 0, earned = 0;
  const feedback = [];

  for (const q of questions) {
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
