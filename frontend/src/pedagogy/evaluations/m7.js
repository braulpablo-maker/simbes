/**
 * SIMBES — Evaluación Módulo 7: Confiabilidad y MTBF
 * ====================================================
 * 5 preguntas sobre distribución exponencial, sesgo de sobrevivencia,
 * MTBF MLE con datos censurados e intervalos de confianza Chi².
 */

export const M7_QUESTIONS = [
  {
    id: 'm7q1',
    text: 'Un campo tiene 10 BES con MTBF nominal de 730 días (2 años). ¿Cuántos equipos se espera que estén aún operativos exactamente al cumplir los 730 días?',
    options: [
      { id: 'a', text: '5 equipos — el MTBF es el tiempo en que falla la mitad (mediana)' },
      { id: 'b', text: '3 a 4 equipos — R(MTBF) = e⁻¹ ≈ 36.77%' },
      { id: 'c', text: '7 equipos — el 70% supera el MTBF en sistemas bien diseñados' },
      { id: 'd', text: '10 equipos — el MTBF es el tiempo mínimo garantizado de operación' },
    ],
    correct: 'b',
    explanation:
      'R(MTBF) = e^(−MTBF/MTBF) = e⁻¹ ≈ 0.3679. Con 10 equipos, se espera que 3–4 sigan operativos al cumplir el MTBF nominal. Este es el resultado más contraintuitivo de la distribución exponencial: el MTBF NO es la mediana (que sería 0.693×MTBF ≈ 507 días). La mediana es el tiempo en que falla el 50% — siempre menor que el MTBF.',
  },
  {
    id: 'm7q2',
    text: 'Se analizan 8 BES extraídos de un campo. De los 8 equipos, solo 3 fallaron. Los otros 5 fueron extraídos por fin de contrato y están en excelente estado. ¿Cuál es el enfoque correcto para calcular el MTBF?',
    options: [
      { id: 'a', text: 'Usar solo los 3 tiempos de falla: MTBF = (t₁ + t₂ + t₃) / 3' },
      { id: 'b', text: 'Usar solo el promedio de los 8 tiempos: MTBF = T_todos / 8' },
      { id: 'c', text: 'MTBF MLE = T_total / r = (Σ t_fallas + Σ t_censurados) / 3' },
      { id: 'd', text: 'No se puede calcular MTBF con menos de 5 fallas observadas' },
    ],
    correct: 'c',
    explanation:
      'Los 5 equipos extraídos sin falla son datos censurados (Tipo I): sabemos que operaron hasta t_extracción sin fallar, pero no cuándo habrían fallado. El estimador MLE correcto es MTBF = T_total / r, donde T_total incluye TODO el tiempo acumulado (fallas + censurados) y r es solo el número de fallas. Ignorar los censurados (opción A) subestima el T_total y produce un MTBF artificialmente bajo — sesgo de sobrevivencia inverso.',
  },
  {
    id: 'm7q3',
    text: 'Análisis MTBF: 12 equipos instalados, 2 han fallado. Tiempos de falla: 180 y 420 días. Los 10 restantes llevan en promedio 350 días operativos. ¿Cuál es el MTBF MLE?',
    options: [
      { id: 'a', text: 'MTBF = (180 + 420) / 2 = 300 días' },
      { id: 'b', text: 'MTBF = (180 + 420 + 10×350) / 2 = 2050 días' },
      { id: 'c', text: 'MTBF = 350 días (promedio del tiempo operativo de todos)' },
      { id: 'd', text: 'No se puede calcular sin conocer los tiempos exactos de los censurados' },
    ],
    correct: 'b',
    explanation:
      'T_total = t_falla₁ + t_falla₂ + Σ t_censurados = 180 + 420 + (10 × 350) = 4100 días. r = 2 fallas. MTBF_MLE = 4100 / 2 = 2050 días. Aunque solo hay 2 fallas, los 10 equipos funcionando aportan 3500 días de tiempo acumulado — esta es la información que capturan los datos censurados. La opción A comete el error clásico de ignorar los censurados.',
  },
  {
    id: 'm7q4',
    text: 'Para el caso anterior (MTBF = 2050 días, T_total = 4100 días, r = 2), se calcula el IC 90%: MTBF_lower = 556 días, MTBF_upper = 12.745 días. ¿Cómo se interpreta el intervalo superior tan amplio?',
    options: [
      { id: 'a', text: 'El cálculo tiene un error — el IC superior no puede ser > 3×MTBF' },
      { id: 'b', text: 'Con solo 2 fallas, la incertidumbre es enorme. El MTBF real puede ser mucho mayor que el MLE' },
      { id: 'c', text: 'Significa que el MTBF real es definitivamente < 12.745 días con 90% de confianza' },
      { id: 'd', text: 'Con r=2 el IC Chi² no es aplicable — se necesita distribución de Weibull' },
    ],
    correct: 'b',
    explanation:
      'Con solo r=2 fallas, la muestra es muy pequeña y la incertidumbre estadística es enorme. El IC ancho no es un error — refleja correctamente que 2 fallas son insuficientes para estimar el MTBF con precisión. El límite inferior (556 días) es el valor "pesimista" relevante para la toma de decisiones: con 90% de confianza, el MTBF real es al menos 556 días. En gestión de confiabilidad, el límite inferior es el número accionable. El IC Chi² es válido para cualquier r ≥ 1 con distribución exponencial.',
  },
  {
    id: 'm7q5',
    text: 'Un campo tiene MTBF_MLE = 913 días (ambiente moderado). Un gerente afirma: "Como el MTBF es > 2 años, no necesitamos reemplazos antes del año 2". ¿Cuál es el error en este razonamiento?',
    options: [
      { id: 'a', text: 'Ningún error — si el MTBF > 730 días, menos del 50% fallará antes del año 2' },
      { id: 'b', text: 'R(730 días) = e^(−730/913) ≈ 0.45 → 55% de los equipos ya habrán fallado al año 2' },
      { id: 'c', text: 'El MTBF de 913 días es solo válido para equipos nuevos — los usados tienen MTBF distinto' },
      { id: 'd', text: 'La tasa de falla exponencial es constante, así que la predicción es correcta' },
    ],
    correct: 'b',
    explanation:
      'R(730) = e^(−730/913) = e^(−0.7998) ≈ 0.449. Es decir, al año 2 (día 730), solo el 44.9% de los equipos seguirán operativos — más del 55% ya habrán fallado. El gerente confunde MTBF con "tiempo mínimo de operación". La distribución exponencial tiene tasa de falla desde el primer día. Para un plan de mantenimiento conservador (90% de equipos operativos), t = −MTBF × ln(0.90) ≈ 96 días. El MTBF siempre debe complementarse con R(t) para decisiones de reemplazo.',
  },
];

/**
 * Califica una respuesta al Módulo 7.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM7(answers) {
  const total = M7_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M7_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
