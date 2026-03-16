/**
 * SIMBES — Evaluación Módulo 4: Eléctrico y VSD
 * ==============================================
 * 5 preguntas sobre cable, Arrhenius, THD, IEEE 519-2014 y NACE MR0175.
 */

export const M4_QUESTIONS = [
  {
    id: 'm4q1',
    text: 'La "Regla de Arrhenius" aplicada al aislamiento eléctrico de un motor BES establece que:',
    options: [
      { id: 'a', text: 'Por cada 5°C sobre el límite nominal, la vida útil se reduce a la mitad' },
      { id: 'b', text: 'Por cada 10°C sobre el límite nominal, la vida útil del aislamiento se reduce a la mitad' },
      { id: 'c', text: 'La vida útil es independiente de la temperatura si se usa PEEK' },
      { id: 'd', text: 'La degradación es lineal: 10°C extra = 10% menos de vida útil' },
    ],
    correct: 'b',
    explanation:
      'La regla de Arrhenius (simplificación pedagógica de la ley de velocidad de reacción) establece que por cada 10°C de exceso sobre la temperatura nominal del aislamiento, la vida útil se reduce al 50%. Matemáticamente: τ₂/τ₁ = 2^((T₁−T₂)/10). Ejemplo: si el aislamiento es clase H (límite 180°C) y el motor opera a 200°C (20°C de exceso), la vida útil cae a 2^(−2) = 25% del nominal. Esta es la razón por la que el monitoreo de temperatura de fondo es crítico en BES.',
  },
  {
    id: 'm4q2',
    text: 'Al seleccionar el cable para un BES en un pozo de 2500 m, el ingeniero compara AWG #4 vs AWG #8. ¿Cuál es la diferencia principal?',
    options: [
      { id: 'a', text: 'AWG #8 es más grueso y tiene menor resistencia que AWG #4' },
      { id: 'b', text: 'AWG #4 es más grueso y tiene menor resistencia que AWG #8' },
      { id: 'c', text: 'Ambos tienen la misma resistencia; la diferencia es solo la temperatura de operación' },
      { id: 'd', text: 'AWG #4 requiere NACE MR0175 mientras que AWG #8 no' },
    ],
    correct: 'b',
    explanation:
      'En la escala AWG (American Wire Gauge), a menor número = mayor diámetro de conductor = menor resistencia. AWG #4 tiene R ≈ 0.249 Ω/1000ft vs AWG #8 con R ≈ 0.628 Ω/1000ft. Para pozos profundos donde la caída de voltaje es significativa, se selecciona el calibre más bajo (más grueso) para minimizar pérdidas. La compensación es el mayor costo y diámetro exterior del cable.',
  },
  {
    id: 'm4q3',
    text: 'Un VSD de 6 pulsos estándar genera un THD ≈ 30%. La norma IEEE 519-2014 exige THDv < 5% en el PCC. ¿Cuál topología cumple el estándar?',
    options: [
      { id: 'a', text: '6 pulsos con filtro pasivo de sintonía fija (THD ≈ 25%)' },
      { id: 'b', text: '12 pulsos (THD ≈ 17.5%)' },
      { id: 'c', text: '18 pulsos o Active Front End (THD < 5%)' },
      { id: 'd', text: 'Cualquier VSD cumple si se instala en una sala eléctrica aislada' },
    ],
    correct: 'c',
    explanation:
      'IEEE 519-2014 establece THDv < 5% en el Punto de Acoplamiento Común (PCC). Los VSD de 18 pulsos generan THD ≈ 4% y el Active Front End (AFE/IGBT) genera THD < 3%, ambos dentro del límite. El de 12 pulsos (≈ 17.5%) no cumple por sí solo. La importancia: el THD alto deteriora equipos de medición, transformadores y motores en la misma barra eléctrica, y puede generar multas de las compañías distribuidoras.',
  },
  {
    id: 'm4q4',
    text: 'En un pozo con H₂S (gas amargo), la norma NACE MR0175 / ISO 15156 exige para el cable del motor BES:',
    options: [
      { id: 'a', text: 'Cable con aislamiento EPDM color verde para identificación' },
      { id: 'b', text: 'Cable con cubierta exterior de plomo (Lead Sheath) y blindaje Monel 400' },
      { id: 'c', text: 'Cable de aluminio en lugar de cobre (resistente a SSC)' },
      { id: 'd', text: 'Cualquier cable estándar si la concentración de H₂S < 100 ppm' },
    ],
    correct: 'b',
    explanation:
      'NACE MR0175 / ISO 15156 establece que en ambientes con H₂S el cable del motor requiere cubierta de plomo (Lead Sheath) para protección contra el Sulfide Stress Cracking (SSC) y la corrosión por gas amargo. El blindaje adicional en Monel 400 (aleación Ni-Cu) proporciona resistencia mecánica y química. El plomo actúa como barrera impermeable al H₂S. El uso de cable estándar en ambientes amargos es causa frecuente de falla prematura de aislamiento.',
  },
  {
    id: 'm4q5',
    text: 'Un motor BES (AWG #6, 2000 ft de profundidad, I = 80 A, T_fondo = 150°C) presenta caída de voltaje de 18.9 V (≈ 1.9% de 1000 V). Si se aumenta la profundidad a 4000 ft sin cambiar el cable, ¿qué ocurre?',
    options: [
      { id: 'a', text: 'La caída de voltaje se mantiene igual porque la temperatura también sube' },
      { id: 'b', text: 'La caída se duplica a ≈ 37.8 V (≈ 3.8%) al doblar la longitud del cable' },
      { id: 'c', text: 'La caída se cuadruplica porque la resistencia crece con el cuadrado de la longitud' },
      { id: 'd', text: 'La caída disminuye porque mayor longitud de cable implica mayor inductancia' },
    ],
    correct: 'b',
    explanation:
      'La resistencia total del cable es proporcional a la longitud: R_total = R_20 × (L/1000) × corrección de temperatura. Al doblar la profundidad de 2000 a 4000 ft, la resistencia se duplica y por tanto la caída de voltaje también (V = I × R). Esta relación lineal es fundamental para el diseño de cable en BES: pozos más profundos requieren calibre más grueso (AWG menor) para mantener la caída dentro del límite operativo (< 5% = advertencia, < 10% = operación segura).',
  },
];

/**
 * Califica una respuesta al Módulo 4.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM4(answers) {
  const total = M4_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M4_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
