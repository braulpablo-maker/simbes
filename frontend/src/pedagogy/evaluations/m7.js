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
    incorrect_feedback: {
      a: '❌ Incorrecto: Confundes MTBF con Mediana. En la distribución exponencial el 50% de los elementos mueren antes de alcanzar su MTBF.',
      c: '❌ Incorrecto: A nivel estadístico, sin mantenimiento condicionado exhaustivo es matemáticamente inviable que una curva exponencial mantenga al 70% vivo al llegar al MTBF.',
      d: '❌ Incorrecto: MTBF no es una garantía del 100% de éxito ni el tiempo programado de falla individual, es un volumen de tiempo dispersado entre muchísimas variables.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Descartar los que han sobrevivido ignora el tiempo acumulado de vida sin falla del resto, generando un sesgo de subestimación brutal.',
      b: '❌ Incorrecto: Dividir por 8 asume que los que siguen operando ya fallaron en ese momento, recortando prematuramente su aporte y dando un promedio falso.',
      d: '❌ Incorrecto: Se pueden sacar estimaciones tempranas con menos de 5 fallas si se utiliza MLE sumando el peso de los sobrevivientes (censurados).'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Ignoras los 3500 días de operación libre de falla de los otros 10 equipos. Estás "castigando" al campo evaluando solo lo mal que le fue a los que fracasaron.',
      c: '❌ Incorrecto: Esa es simplemente la media aritmética de operación de los activos vivos, lo que no refleja ninguna métrica de confiabilidad estadística de falla general.',
      d: '❌ Incorrecto: La estimación de máxima verosimilitud permite usar el tiempo individual o promedio (si son datos sumarizados simples) de vida de todos los supervivientes sumados.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Las matemáticas del test probabilístico son elásticamente amplias cuando "n" es diminuto (extrema falta de certeza para el límite superior).',
      c: '❌ Incorrecto: "Definitivamente" no existe en la estadística sin límites rígidos poblacionales probados.',
      d: '❌ Incorrecto: Chi-cuadrado ampara a las estimaciones de densidad exponencial MLE a partir de 1 evento siempre y cuando se asuman tasas constantes de falla, Weibull modela el desgaste gradual no la falta de datos.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: La distribución de fallas empieza desde el día uno con una probabilidad. Al año 2 una porción contundente y calculable ya pereció.',
      c: '❌ Incorrecto: Un equipo se considera en la ventana exponencial (riesgo constante) asumiendo uso ordinario. Weibull definiría esto a la larga, pero igual más de la mitad ya habrían fallado sin importar su uso base.',
      d: '❌ Incorrecto: Que la tasa sea constante (MTBF general continuo) no implica que todos vivan hasta tal promedio y expiren el mismo día.'
    },
    explanation:
      'R(730) = e^(−730/913) = e^(−0.7998) ≈ 0.449. Es decir, al año 2 (día 730), solo el 44.9% de los equipos seguirán operativos — más del 55% ya habrán fallado. El gerente confunde MTBF con "tiempo mínimo de operación". La distribución exponencial tiene tasa de falla desde el primer día. Para un plan de mantenimiento conservador (90% de equipos operativos), t = −MTBF × ln(0.90) ≈ 96 días. El MTBF siempre debe complementarse con R(t) para decisiones de reemplazo.',
  },
  {
    id: 'm7q6',
    text: 'Un campo quiere asegurar que al menos el 80% de los BES estén operativos en el día 400. El MTBF del campo es 600 días. ¿Se cumple el objetivo?',
    options: [
      { id: 'a', text: 'Sí — R(400) = e^(−400/600) = e^(−0.667) ≈ 0.513, que es mayor al 80%' },
      { id: 'b', text: 'No — R(400) = e^(−400/600) ≈ 0.513 = 51.3%, muy por debajo del 80% requerido' },
      { id: 'c', text: 'Sí — MTBF > 400 días garantiza que > 80% operarán al día 400' },
      { id: 'd', text: 'No se puede calcular sin conocer el número total de equipos en el campo' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Matemáticamente 51% es mucho menor que 80%. Tu ecuación está bien pero tu afirmación final lógica falla.',
      c: '❌ Incorrecto: Que el tiempo evaluado sea menor al MTBF de ninguna manera garantiza que se alcance el 80% operativo.',
      d: '❌ Incorrecto: R(t) es una curva de probabilidad universal que escala para 5 ó 5000 equipos independiente de "N".'
    },
    explanation:
      'R(400) = e^(−400/600) = e^(−0.6667) ≈ 0.513. Solo el 51.3% estarán operativos al día 400 — el objetivo del 80% no se cumple. Para lograr R(t) ≥ 0.80 con MTBF = 600: t = −600 × ln(0.80) = −600 × (−0.223) ≈ 134 días. El campo solo puede garantizar el 80% de disponibilidad durante los primeros 134 días. Tener MTBF > t NO garantiza R(t) > 50% — la distribución exponencial tiene R(MTBF) = 36.8%, no 50%.',
  },
  {
    id: 'm7q7',
    text: 'La mediana de la distribución de fallas de una BES con MTBF = 730 días es:',
    options: [
      { id: 'a', text: '730 días — la mediana es igual al MTBF en la distribución exponencial' },
      { id: 'b', text: '365 días — exactamente la mitad del MTBF' },
      { id: 'c', text: '≈ 506 días — t_mediana = MTBF × ln(2) = 730 × 0.693' },
      { id: 'd', text: 'No se puede calcular — la mediana requiere una distribución de Weibull' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: MTBF no es Mediana. La caída inicia abruptamente disminuyendo los chances de vida cada día, cruzando el 50% de mortandad mucho antes del promedio aritmético.',
      b: '❌ Incorrecto: La función exponencial decae logarítmicamente constante a lo largo de un marco asintótico, la mitad del tiempo es ~60% de sobrevivencia, no 50%.',
      d: '❌ Incorrecto: La mediana en exponencial se interpola limpiamente calculando Ln(2) x MTBF.'
    },
    explanation:
      'Para la distribución exponencial: R(t_mediana) = 0.5 → e^(−t/MTBF) = 0.5 → t_mediana = MTBF × ln(2) = 730 × 0.693 ≈ 506 días. La mediana (el tiempo en que falla el 50% de los equipos) es SIEMPRE menor que el MTBF. Esto es contraintuitivo pero fundamental: "promedio de vida = MTBF = 730 días" y "tiempo en que falla la mitad = 506 días" son dos conceptos distintos. Para planificación de reemplazos, la mediana suele ser más útil que el MTBF.',
  },
  {
    id: 'm7q8',
    text: 'Se tienen 5 fallas con tiempos: 120, 280, 450, 680, 900 días. Además, 3 equipos activos con 200, 350 y 500 días sin fallar (censurados). ¿Cuál es el MTBF MLE?',
    options: [
      { id: 'a', text: 'MTBF = (120+280+450+680+900) / 5 = 486 días' },
      { id: 'b', text: 'MTBF = (120+280+450+680+900+200+350+500) / 5 = 696 días' },
      { id: 'c', text: 'MTBF = (120+280+450+680+900) / 8 = 304 días' },
      { id: 'd', text: 'No se puede calcular con menos de 10 fallas' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Sumaste solo los quemados. Ignoraste el peso de vida de los vivos que están sosteniendo el ratio de confiabilidad poblacional.',
      c: '❌ Incorrecto: Sumaste los quemados, contaste a los censurados abajo en "N", pero olvidaste rellenar su tiempo vital en el numerador. Sesgo de subestimación mixta.',
      d: '❌ Incorrecto: Los modelos MLE pueden extraer conocimiento desde "r" de fallas muy corto (incluso 1 o 2). Obviamente amplía la incertidumbre de predicción.'
    },
    explanation:
      'MTBF_MLE = T_total / r, donde T_total incluye TODOS los tiempos (fallas + censurados) y r es el número de fallas. T_total = (120+280+450+680+900) + (200+350+500) = 2430 + 1050 = 3480 días. r = 5. MTBF = 3480 / 5 = 696 días. La opción A ignora los censurados (T_total = 2430/5 = 486 días) — esto subestima el MTBF porque los 3 equipos activos aportaron 1050 días de operación sin fallar, información que no se puede descartar.',
  },
  {
    id: 'm7q9',
    text: 'El sesgo de sobrevivencia en análisis de MTBF de BES ocurre cuando:',
    options: [
      { id: 'a', text: 'Se incluyen solo equipos nuevos en el análisis, ignorando los viejos' },
      { id: 'b', text: 'Solo se analizan los equipos que fallaron, ignorando los que siguen operativos — subestimando el MTBF real' },
      { id: 'c', text: 'Se usa distribución exponencial en lugar de Weibull, lo que sobreestima el MTBF' },
      { id: 'd', text: 'El MTBF de campo siempre es mayor que el MTBF de fábrica — esto es el sesgo esperado' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Ignorar a los equipos antiguos ("sesgo de novedad") no es lo que se conoce universalmente como sesgo de sobrevivencia.',
      c: '❌ Incorrecto: Un modelo logarítmico vs un lineal modela un patrón diferente, no es un sesgo de subconjunto poblacional.',
      d: '❌ Incorrecto: Es un escenario de subestimación real, no un postulado teórico del fabricante vs operador.'
    },
    explanation:
      'El sesgo de sobrevivencia es el error de analizar solo los "sobrevivientes visibles" (los que fallaron y están en el taller para teardown) ignorando los que siguen corriendo. Si hay 20 equipos y 8 fallaron en 18 meses, analizar solo los 8 falla da MTBF ≈ tiempo promedio de esos 8, ignorando que los otros 12 llevan 18 meses sin fallar. El MLE con datos censurados corrige este sesgo. En la práctica: los datos de "solo fallas" producen un MTBF artificialmente bajo, generando decisiones de sobreinversión en mantenimiento.',
  },
  {
    id: 'm7q10',
    text: 'Un ingeniero de confiabilidad quiere saber el tiempo t en que el 10% de los equipos habrán fallado (percentil 10). Con MTBF = 500 días, ¿cuál es ese tiempo?',
    options: [
      { id: 'a', text: 't₁₀% = MTBF × 0.10 = 50 días' },
      { id: 'b', text: 't₁₀% = −MTBF × ln(0.90) ≈ 52.7 días' },
      { id: 'c', text: 't₁₀% = −MTBF × ln(0.10) ≈ 1151 días' },
      { id: 'd', text: 't₁₀% = MTBF / ln(0.90) ≈ −4740 días (no tiene solución real)' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Es un acercamiento líneal muy burdo en una función probabilística logarítmica / exponencial que no funciona.',
      c: '❌ Incorrecto: Ln(0.10) computaría el percentil del 90% (los que morirían tras dejar en pie solo el 10%).',
      d: '❌ Incorrecto: Sí que dispone de una solución viable calculada por despeje: la ecuación en negativo es t = -MTBF * ln(1 - probabilidad_falla).'
    },
    explanation:
      'Percentil 10% significa R(t) = 0.90 (90% aún operativos, 10% fallados). R(t) = e^(−t/MTBF) = 0.90 → t = −MTBF × ln(0.90) = −500 × (−0.1054) ≈ 52.7 días. Interpretación: el 10% de los equipos fallará antes de los 53 días. Este es el "t_10%" o B10 en la terminología de confiabilidad. La opción A (MTBF × 0.10 = 50 días) es coincidentemente cercana pero matemáticamente incorrecta — no es una relación lineal sino logarítmica.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M7_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 7.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM7(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M7_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
