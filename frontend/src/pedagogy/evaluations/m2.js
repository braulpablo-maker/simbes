/**
 * SIMBES — Evaluación Módulo 2: Diseño Hidráulico
 * ================================================
 * 5 preguntas que cubren TDH, Colebrook-White, Ns, fricción y etapas.
 */

export const M2_QUESTIONS = [
  {
    id: 'm2q1',
    text: 'El TDH (Total Dynamic Head) que debe generar una bomba BES se calcula como:',
    options: [
      { id: 'a', text: 'TDH = H_estático + H_fricción + H_contrapresión' },
      { id: 'b', text: 'TDH = Pr − Pwf' },
      { id: 'c', text: 'TDH = H_bomba − gradiente × profundidad' },
      { id: 'd', text: 'TDH = IP × (Pr − Pwf) + H_fricción' },
    ],
    correct: 'a',
    explanation:
      'El TDH integra los tres componentes que la bomba debe vencer: (1) la altura estática (columna de fluido = profundidad), (2) las pérdidas por fricción en el tubing (Darcy-Weisbach) y (3) la contrapresión del cabezal. Un error común es confundir TDH con drawdown del yacimiento (Pr − Pwf).',
  },
  {
    id: 'm2q2',
    text: 'Un pozo produce 400 m³/d por tubing de 2-7/8" (D interno = 2.441"). Densidad = 0.876 kg/L, viscosidad = 5 cP. ¿Cuál es el régimen de flujo y qué correlación de fricción aplica?',
    options: [
      { id: 'a', text: 'Laminar (Re < 2300) — f = 64/Re (Hagen-Poiseuille)' },
      { id: 'b', text: 'Transición (2300 < Re < 4000) — factor de fricción impredecible' },
      { id: 'c', text: 'Turbulento (Re > 4000) — aplica ecuación de Colebrook-White' },
      { id: 'd', text: 'No se puede determinar sin la rugosidad del tubing' },
    ],
    correct: 'c',
    explanation:
      'Para estas condiciones: v ≈ 1.53 m/s, Re ≈ 16 600 → flujo turbulento. La ecuación de Colebrook-White es la correlación estándar para flujo turbulento en tubing de acero. La rugosidad afecta el VALOR de f, no si aplica o no la ecuación.',
  },
  {
    id: 'm2q3',
    text: 'Una bomba BES tiene Ns = 2 800 (unidades US). ¿Qué tipo de impulsor corresponde y qué implica para el diseño?',
    options: [
      { id: 'a', text: 'Radial (Ns < 1 500) — alta altura por etapa, bajo caudal' },
      { id: 'b', text: 'Flujo Mixto (1 500 < Ns < 4 500) — típico de la mayoría de BES modernos' },
      { id: 'c', text: 'Axial (Ns > 4 500) — diseñado para altísimos caudales con baja altura' },
      { id: 'd', text: 'La Ns sola no es suficiente para clasificar el impulsor' },
    ],
    correct: 'b',
    explanation:
      'Ns = 2 800 cae en la zona de flujo mixto (1 500–4 500), que es la geometría dominante en BES modernos. Los impulsores radiales (Ns < 1 500) generan más altura por etapa pero son menos eficientes a alto caudal. La Ns es el parámetro de diseño que define la forma del impulsor.',
  },
  {
    id: 'm2q4',
    text: 'Las pérdidas por fricción en el tubing son el 35% del TDH. ¿Qué acción reduce el TDH total de forma más significativa?',
    options: [
      { id: 'a', text: 'Aumentar la frecuencia del VSD de 60 Hz a 65 Hz' },
      { id: 'b', text: 'Aumentar el diámetro interno del tubing (fricción ∝ 1/D⁵)' },
      { id: 'c', text: 'Instalar un separador de gas (AGS) en la succión de la bomba' },
      { id: 'd', text: 'Reducir la presión estática del reservorio' },
    ],
    correct: 'b',
    explanation:
      'Las pérdidas por fricción escalan como h_f ∝ 1/D⁵ (Darcy-Weisbach con v ∝ 1/D²). Un incremento moderado en diámetro reduce enormemente la fricción: pasar de 2.441" a 2.992" reduce h_f ≈ 64%. Aumentar frecuencia no reduce TDH; solo cambia dónde opera la bomba sobre la misma curva de sistema.',
  },
  {
    id: 'm2q5',
    text: 'Una bomba tiene H₀ = 50 ft/etapa a Q = 0 y 60 Hz. El TDH requerido en el punto de operación es de 3 250 ft. ¿Cuántas etapas necesita la bomba como primera aproximación?',
    options: [
      { id: 'a', text: '50 etapas' },
      { id: 'b', text: '65 etapas' },
      { id: 'c', text: '82 etapas' },
      { id: 'd', text: '100 etapas' },
    ],
    correct: 'b',
    explanation:
      'N_etapas = ceil(TDH / H_por_etapa) = ceil(3 250 / 50) = 65. En la práctica se evalúa H por etapa en el punto de operación (no en shutoff), lo que puede requerir 1–2 etapas adicionales. La aproximación con H₀ es válida como primer dimensionamiento.',
  },
];

/**
 * Califica una respuesta al Módulo 2.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, results }}
 */
export function gradeM2(answers) {
  const total   = M2_QUESTIONS.length;
  let   correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q       = M2_QUESTIONS.find(q => q.id === id);
    const isOk    = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
