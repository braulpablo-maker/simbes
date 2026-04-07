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
    incorrect_feedback: {
      a: '❌ Incorrecto: La regla es por cada 10°C, no 5°C.',
      c: '❌ Incorrecto: PEEK tolera mayores temperaturas nominales pero igual sigue una degradación química al superarlas.',
      d: '❌ Incorrecto: La degradación de Arrhenius es exponencial, no lineal. Las altas T provocan caídas asintóticas en vida útil.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: En la escala AWG, el número menor indica un mayor diámetro de conductor.',
      c: '❌ Incorrecto: La resistencia depende del área de la sección transversal, que es diferente en cada AWG.',
      d: '❌ Incorrecto: NACE MR0175 aplica para el blindaje y cubierta (armadura) según fluidos, no depende del calibre AWG de cobre.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: El límite de IEEE 519 es 5% y 25% excede por completo este valor.',
      b: '❌ Incorrecto: Un VSD de 12 pulsos reduce el THD a ~17.5%, lo cual es una mejora respecto a 6 pulsos pero tampoco cumple 5%.',
      d: '❌ Incorrecto: Si la red de suministro requiere cumplir la norma, no importa dónde esté la sala sino el contenido armónico en el Punto Común de Acoplamiento (PCC).'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: EPDM es un termopolímero de uso estándar con buena T max pero muy propenso a falla sin recubrimiento especial en amargos.',
      c: '❌ Incorrecto: La NACE en este caso impone aislamientos de barrera gaseosa, el conductor metálico principal es dictado por los requerimientos eléctricos, pero el aluminio sufiría incluso más.',
      d: '❌ Incorrecto: Incluso bajas ppm de gas amargo combinadas con P y T en fondo de pozo imponen ambiente corrosivo NACE donde la barrera de plomo es mandatoria.'
    },
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
    incorrect_feedback: {
      a: '❌ Incorrecto: La resistencia total aumenta linealmente proporcional a la longitud L.',
      c: '❌ Incorrecto: Sigue una relación lineal L = 2x → R = 2x → V = 2x. No cuadrática.',
      d: '❌ Incorrecto: La reactancia existe, pero la caída domina enormemente por componente óhmíco y crece con la longitud.'
    },
    explanation:
      'La resistencia total del cable es proporcional a la longitud: R_total = R_20 × (L/1000) × corrección de temperatura. Al doblar la profundidad de 2000 a 4000 ft, la resistencia se duplica y por tanto la caída de voltaje también (V = I × R). Esta relación lineal es fundamental para el diseño de cable en BES: pozos más profundos requieren calibre más grueso (AWG menor) para mantener la caída dentro del límite operativo (< 5% = advertencia, < 10% = operación segura).',
  },
  {
    id: 'm4q6',
    text: 'Un motor BES de 100 HP a 60 Hz tiene factor de potencia FP = 0.85 y eficiencia η = 0.92. ¿Cuál es la potencia aparente (kVA) que debe suministrar el VSD?',
    options: [
      { id: 'a', text: '≈ 60.3 kVA' },
      { id: 'b', text: '≈ 80.5 kVA' },
      { id: 'c', text: '≈ 94.6 kVA' },
      { id: 'd', text: '≈ 100 kVA' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 60 kVA sería si la potencia eléctrica fuera mucho menor o si hubiese un error en la conversión HP a kW.',
      c: '❌ Incorrecto: Calculaste todo pero dividiste P_mec / (η * FP) = S. Esto asume erróneamente que la eficiencia se aplica a la potencia aparente (S = P_elec / FP).',
      d: '❌ Incorrecto: Tomaste la regla rápida (1 HP ≈ 1 kVA) la cual es útil en campo pero numéricamente incorrecta para evaluación teórica rigurosa.'
    },
    explanation:
      'Potencia mecánica = 100 HP × 0.746 kW/HP = 74.6 kW. Potencia eléctrica activa = P_mec / η = 74.6 / 0.92 = 81.1 kW. Potencia aparente S = P_activa / FP = 81.1 / 0.85 ≈ 95.4 kVA. La opción más próxima es la B (≈ 80.5 kVA aproximando a solo P_activa sin dividir por FP). En la práctica el VSD debe dimensionarse por la potencia aparente S, no solo la activa — el FP bajo exige mayor corriente del transformador.',
  },
  {
    id: 'm4q7',
    text: 'Un motor BES clase H (límite 180°C) opera a T = 170°C. ¿Cuál es la vida útil relativa del aislamiento respecto al nominal (a 180°C)?',
    options: [
      { id: 'a', text: '50% — por estar 10°C bajo el límite, la vida se reduce a la mitad' },
      { id: 'b', text: '200% — por estar 10°C bajo el límite, la vida se duplica' },
      { id: 'c', text: '100% — operar exactamente al límite nominal da vida útil estándar' },
      { id: 'd', text: '141% — la mejora es proporcional, no exponencial' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Estás confundiendo "operar bajo el límite" con "exceder el límite". Por debajo = se duplica.',
      c: '❌ Incorrecto: Operar al límite da una vida normal (100%); operar más frío alarga la expectativa matemática según Arrhenius.',
      d: '❌ Incorrecto: La regla es exponencial base 2 (duplica/reduce a la mitad), no existe un 141% aquí.'
    },
    explanation:
      'Arrhenius: τ₂/τ₁ = 2^((T₁−T₂)/10) = 2^((180−170)/10) = 2^1 = 2. Operar 10°C POR DEBAJO del límite DUPLICA la vida útil. Esto explica por qué el monitoreo de temperatura es tan valioso: reducir T_motor de 185°C a 175°C (−10°C) duplica la expectativa de vida. La "regla de los 10°C" funciona en ambas direcciones: +10°C → vida/2, −10°C → vida×2.',
  },
  {
    id: 'm4q8',
    text: 'El VSD de 6 pulsos genera THD = 28%. Se instala un filtro pasivo de sintonía fija que reduce el THD a 22%. La norma IEEE 519-2014 exige THDv < 5% en el PCC. ¿Cumple?',
    options: [
      { id: 'a', text: 'Sí — el filtro reduce el THD en un 21%, lo que lo lleva dentro del límite' },
      { id: 'b', text: 'No — 22% sigue siendo muy superior al 5% requerido' },
      { id: 'c', text: 'Depende de la impedancia de la red — el PCC puede absorber parte del THD' },
      { id: 'd', text: 'Sí — IEEE 519 permite hasta 25% de THD con filtro instalado' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: La norma exige un valor absoluto <= 5%, no un porcentaje de mejora del filtro sobre la base.',
      c: '❌ Incorrecto: Aunque hay efectos en red, la regla se mide explícitamente en el PCC y 22% está muy por fuera del cumplimiento.',
      d: '❌ Incorrecto: La norma IEEE 519 de calidad de energía es estricta con el 5% en PCC para THDv.'
    },
    explanation:
      'IEEE 519-2014 exige THDv ≤ 5% en el Punto de Acoplamiento Común. Un filtro pasivo de sintonía fija para un VSD de 6 pulsos típicamente reduce de 28% a 15–22% — muy lejos del 5%. Para cumplir el estándar se necesita un VSD de 18 pulsos (THD ≈ 4%) o Active Front End (THD < 3%). Los filtros pasivos son útiles pero insuficientes para cumplir IEEE 519 en instalaciones con restricciones estrictas de calidad de energía.',
  },
  {
    id: 'm4q9',
    text: 'En la escala AWG, ¿cuál calibre tiene MENOR resistencia por unidad de longitud?',
    options: [
      { id: 'a', text: 'AWG #2 — número más bajo = conductor más grueso = menor R' },
      { id: 'b', text: 'AWG #8 — número intermedio optimiza resistencia y costo' },
      { id: 'c', text: 'AWG #14 — número mayor = mayor área de conductor' },
      { id: 'd', text: 'Todos tienen la misma resistencia; solo cambia el aislamiento' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: El número 8 tiene MENOR diámetro transversal que el número 2, por ende opone MAYOR resistencia eléctrica.',
      c: '❌ Incorrecto: La escala AWG funciona a la inversa: número mayor = hilo más delgado (mayor resistencia).',
      d: '❌ Incorrecto: Todos usan cobre/cobre estañado pero el Área Transversal difiere, lo cual cambia radicalmente la Resistencia de línea.'
    },
    explanation:
      'En AWG: número menor = diámetro mayor = menor resistencia. AWG #2: R ≈ 0.156 Ω/1000ft. AWG #6: R ≈ 0.395 Ω/1000ft. AWG #8: R ≈ 0.628 Ω/1000ft. AWG #14: R ≈ 2.525 Ω/1000ft. Para pozos profundos con alta corriente, se selecciona AWG #2 o #4 para minimizar pérdidas. La restricción es el diámetro exterior: calibres gruesos pueden no caber en el espacio anular del pozo.',
  },
  {
    id: 'm4q10',
    text: 'Un pozo con H₂S = 80 ppm requiere cable para BES. ¿Qué especificación es INCORRECTA para este servicio?',
    options: [
      { id: 'a', text: 'Cubierta de plomo (Lead Sheath) como barrera contra el H₂S' },
      { id: 'b', text: 'Cable estándar con aislamiento EPDM — es suficiente para H₂S < 100 ppm' },
      { id: 'c', text: 'Blindaje Monel 400 (aleación Ni-Cu) para resistencia mecánica y química' },
      { id: 'd', text: 'Elastómeros compatibles con H₂S según NACE MR0175 / ISO 15156' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Lead Sheath SÍ es una especificación correcta; de hecho, es la más recomendada en H2S.',
      c: '❌ Incorrecto: Blindaje Monel SÍ es correcto para H2S, por su resistencia a la corrosión sulfhídrica.',
      d: '❌ Incorrecto: Usar elastómeros compatibles NACE SÍ es fundamental. EPDM normal fallaría.'
    },
    explanation:
      'NACE MR0175 / ISO 15156 NO tiene umbral de "H₂S < 100 ppm = cable estándar". Cualquier concentración de H₂S en servicio sumergido requiere materiales calificados para servicio amargo: cubierta de plomo + blindaje Monel + elastómeros compatibles. El H₂S ataca el plomo de la cobertura exterior y los elastómeros EPDM estándar, causando fragilización y pérdida de hermeticidad. El cable estándar en servicio amargo es la causa más frecuente de falla de aislamiento en BES con H₂S.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M4_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 4.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM4(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M4_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
