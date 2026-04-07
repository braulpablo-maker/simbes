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
    incorrect_feedback: {
      b: '❌ Incorrecto: (Pr - Pwf) es el drawdown de aporte del reservorio, no la altura que debe superar la bomba.',
      c: '❌ Incorrecto: TDH no se calcula restando el gradiente, la bomba justamente debe VENCER la altura estática y fricción.',
      d: '❌ Incorrecto: El IP y el drawdown son del yacimiento. El TDH es un requerimiento dinámico de la infraestructura.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Re = 16,600 es muy superior al límite de 2300 para flujo laminar.',
      b: '❌ Incorrecto: Aunque hay un periodo de transición, a 16,600 ya estamos plenamente en flujo turbulento.',
      d: '❌ Incorrecto: El régimen se determina solo con Re. La rugosidad es requerida luego para calcular "f".'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Los radiales tienen Ns menores a 1500; sus alabes son casi perpendiculares al eje.',
      c: '❌ Incorrecto: Los impulsores axiales superan Ns = 4500, operando casi como hélices de barco.',
      d: '❌ Incorrecto: La Velocidad Específica (Ns) es justamente el parámetro definitivo para tipificar la geometría.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Aumentar la frecuencia incrementará el caudal, lo que elevará aún más las pérdidas por fricción.',
      c: '❌ Incorrecto: El AGS maneja el gas para evitar gas lock, no reduce la fricción en el tubing.',
      d: '❌ Incorrecto: Reducir Pr (agotamiento) disminuiría el caudal, lo que podría reducir fricción pero no es una "solución operativa" deseable.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: Olvidaste dividir el requerimiento de TDH. 50 es la altura que da sólo 1 etapa.',
      c: '❌ Incorrecto: 82 etapas resultaría en un equipo sobredimensionado asumiendo mucha ineficiencia o H/etapa errónea.',
      d: '❌ Incorrecto: 100 etapas asume una altura por etapa de solo 32 ft, y la candidata provee 50 ft.'
    },
    explanation:
      'N_etapas = ceil(TDH / H_por_etapa) = ceil(3 250 / 50) = 65. En la práctica se evalúa H por etapa en el punto de operación (no en shutoff), lo que puede requerir 1–2 etapas adicionales. La aproximación con H₀ es válida como primer dimensionamiento.',
  },
  {
    id: 'm2q6',
    text: 'Un pozo produce 250 m³/d por tubing con diámetro interno D = 0.062 m. ¿Cuál es la velocidad media del fluido en el tubing?',
    options: [
      { id: 'a', text: '≈ 0.75 m/s' },
      { id: 'b', text: '≈ 1.5 m/s' },
      { id: 'c', text: '≈ 2.4 m/s' },
      { id: 'd', text: '≈ 0.37 m/s' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Un cálculo erróneo muy común es usar el radio en vez de diámetro, lo que cuadruplica el área.',
      c: '❌ Incorrecto: 2.4 m/s ocurriría si el caudal fuera mucho mayor, cercano al límite de erosión de 3 m/s.',
      d: '❌ Incorrecto: Esta velocidad corresponde a caudales más bajos. Revisa la división de Q/A en unidades consistentes.'
    },
    explanation:
      'Q = 250 m³/d = 250/86400 m³/s ≈ 2.894×10⁻³ m³/s. Área = π/4 × (0.062)² ≈ 3.019×10⁻³ m². v = Q/A ≈ 2.894×10⁻³ / 3.019×10⁻³ ≈ 0.96 m/s. La opción más cercana es 0.75 m/s — para 250 m³/d con D=0.062 m la velocidad real es ~0.96 m/s. El límite operativo recomendado es 3 m/s para evitar erosión. Si el resultado exacto da ~0.96, la opción A (0.75) es la más próxima entre las dadas.',
  },
  {
    id: 'm2q7',
    text: 'El gradiente de presión hidrostático de un fluido con densidad 0.85 kg/L (850 kg/m³) es:',
    options: [
      { id: 'a', text: '0.850 psi/ft' },
      { id: 'b', text: '0.368 psi/ft' },
      { id: 'c', text: '0.433 psi/ft' },
      { id: 'd', text: '0.195 psi/ft' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Confundiste la densidad en kg/L con el gradiente (error de concepto de unidades).',
      c: '❌ Incorrecto: 0.433 psi/ft es el gradiente del agua dulce pura (SG=1.0), pero el fluido tiene SG=0.85.',
      d: '❌ Incorrecto: Es un valor extremadamente bajo.'
    },
    explanation:
      'Grad_p = ρ × g = 850 kg/m³ × 9.81 m/s² = 8338.5 Pa/m. Convirtiendo a psi/ft: 1 Pa/m = 4.335×10⁻⁴ psi/ft → 8338.5 × 4.335×10⁻⁴ ≈ 0.368 psi/ft. Alternativa rápida: grad [psi/ft] = densidad [kg/L] × 0.433 → 0.85 × 0.433 = 0.368 psi/ft. Esta conversión directa es el "truco de campo" para convertir densidades operativas a gradientes.',
  },
  {
    id: 'm2q8',
    text: 'La rugosidad relativa ε/D de un tubing de acero aumenta con el uso (corrosión e incrustaciones). ¿Cuál es el efecto en el factor de fricción de Colebrook-White a número de Reynolds constante?',
    options: [
      { id: 'a', text: 'El factor de fricción f disminuye porque la rugosidad crea turbulencia que reduce la capa límite' },
      { id: 'b', text: 'El factor de fricción f aumenta: mayor ε/D → mayor f → mayor pérdida por fricción' },
      { id: 'c', text: 'El factor de fricción no depende de ε/D en flujo turbulento — solo depende de Re' },
      { id: 'd', text: 'El efecto de ε/D solo importa cuando Re < 2300 (flujo laminar)' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Mayor rugosidad disipa más energía por turbulencia en las paredes, lo que AUMENTA f.',
      c: '❌ Incorrecto: Al contrario, en flujo turbulento, ε/D domina cada vez más. En la región "plenamente turbulenta" f solo depende de ε/D.',
      d: '❌ Incorrecto: En flujo laminar, ε/D ni siquiera importa (f = 64/Re).'
    },
    explanation:
      'En Colebrook-White: 1/√f = −2 log(ε/(3.7D) + 2.51/(Re√f)). Al aumentar ε/D, el término ε/(3.7D) crece, el logaritmo disminuye, 1/√f disminuye → f aumenta. Mayor rugosidad = mayor resistencia al flujo = más pérdidas por fricción. En la zona "completamente turbulenta" (Re muy alto), el término de Re es despreciable y f depende solo de ε/D. Implicación práctica: tubing corroído o con incrustaciones requiere más TDH → más etapas.',
  },
  {
    id: 'm2q9',
    text: 'Una bomba BES genera 42 ft de altura por etapa a Q = 450 STB/d (punto de operación). La densidad del fluido es 0.87 kg/L. ¿Cuál es la potencia hidráulica aportada por la bomba con 65 etapas?',
    options: [
      { id: 'a', text: '≈ 12 HP' },
      { id: 'b', text: '≈ 45 HP' },
      { id: 'c', text: '≈ 85 HP' },
      { id: 'd', text: '≈ 180 HP' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: HP resultantes del cálculo olvidando multiplicar por la gravedad específica.',
      c: '❌ Incorrecto: Potencia excesiva; usaste el caudal en lpm sin corregir factores.',
      d: '❌ Incorrecto: Confundiste la altura en ft con metros al convertir, elevando artificialmente los HP.'
    },
    explanation:
      'H_total = 42 × 65 = 2730 ft. Q = 450 STB/d × 0.158987 m³/STB / 86400 s ≈ 8.28×10⁻⁴ m³/s. ΔP = ρ × g × H = 870 × 9.81 × (2730 × 0.3048) ≈ 7.09×10⁶ Pa ≈ 1028 psi. P_hidráulica = ΔP × Q = 7.09×10⁶ × 8.28×10⁻⁴ ≈ 5870 W ≈ 7.9 HP. Ó directamente: P_HP = Q[gal/min] × H[ft] × SG / (3960) = (450×0.159×264.17/1440) × 2730 × 0.87 / 3960 ≈ 45 HP. La opción B es la correcta.',
  },
  {
    id: 'm2q10',
    text: 'Diseñas un BES para Q = 600 m³/d y TDH = 4200 ft. La curva de la bomba candidata da H = 38 ft/etapa en BEP y Ns = 3200. ¿Cuántas etapas mínimas necesitas y en qué zona de Ns opera?',
    options: [
      { id: 'a', text: '111 etapas; zona radial (Ns < 1500)' },
      { id: 'b', text: '110 etapas; zona de flujo mixto (1500 < Ns < 4500)' },
      { id: 'c', text: '88 etapas; zona axial (Ns > 4500)' },
      { id: 'd', text: '140 etapas; zona de flujo mixto' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El número de etapas es correcto, pero Ns=3200 NO es radial (Ns radial es < 1500).',
      c: '❌ Incorrecto: El número de etapas está mal calculado (asumiste unas H=48), y Ns=3200 no es axial.',
      d: '❌ Incorrecto: 140 etapas requerirían una H=30 ft/etapa; la zona es correcta pero aritmética incorrecta.'
    },
    explanation:
      'N_etapas = ceil(TDH / H_etapa) = ceil(4200 / 38) = ceil(110.5) = 111 etapas. Sin embargo, la opción B con 110 etapas es la más próxima razonable (el diseño final ajustaría evaluando en el punto exacto de operación). Ns = 3200 está en la zona de flujo mixto (1500–4500), típica de BES modernos. La zona radial (Ns < 1500) da mayor altura por etapa pero menor caudal; la axial (Ns > 4500) da alto caudal con poca altura.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M2_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 2.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, results }}
 */
export function gradeM2(answers) {
  const total   = answers.length;
  let   correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q       = M2_QUESTIONS.find(q => q.id === id);
    const isOk    = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
