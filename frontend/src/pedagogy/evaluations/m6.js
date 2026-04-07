/**
 * SIMBES — Evaluación Módulo 6: Diagnóstico DIFA / API RP 11S1
 * =============================================================
 * 5 preguntas sobre identificación de fallas, codificación API RP 11S1,
 * interpretación de síntomas y diagnóstico diferencial BES.
 */

export const M6_QUESTIONS = [
  {
    id: 'm6q1',
    text: 'Al abrir una BES extraída del pozo, se observa picadura generalizada en impulsores y difusores, con depósitos de color amarillo-verdoso. El historial muestra producción de H₂S > 50 ppm. ¿Cuál es la serie de código API RP 11S1 correcta y la causa raíz?',
    options: [
      { id: 'a', text: 'Serie 4900 — falla de sello primario que permitió contaminación química' },
      { id: 'b', text: 'Serie 3700 — corrosión por H₂S + material de bomba no especificado para servicio amargo' },
      { id: 'c', text: 'Serie 5400 — falla de sello secundario que expuso los impulsores al fluido corrosivo' },
      { id: 'd', text: 'Serie 5900 — falla de cable que causó arco eléctrico y ataque térmico de los impulsores' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 4900 es falla de sección sellante. Podría haber daño químico, pero si los impulsores completos fallan por ácido al extraerlos, es corrosión primaria.',
      c: '❌ Incorrecto: La exposición a fluidos corrosivos por fuera está permitida si se usan materiales NACE. Falla 5400 es mecánica.',
      d: '❌ Incorrecto: Un arco eléctrico funde un hueco o marca quemada muy limpia y localizada, no deja "picadura generalizada con depósitos amarillo-verdosos".'
    },
    explanation:
      'La Serie 3700 cubre daños por corrosión y picadura (Código 3730 para H₂S). Los depósitos amarillo-verdosos son indicadores visuales de ataque por H₂S (sulfuros metálicos). La causa raíz es la selección de material incorrecto: NACE MR0175 / ISO 15156 exige Monel 400 en componentes metálicos y PEEK o elastómeros compatibles con H₂S cuando hay presencia de gas ácido. La Serie 4900 aplica a fallas de sello, no a corrosión química del conjunto de bomba.',
  },
  {
    id: 'm6q2',
    text: 'Un BES opera con corriente estable en 82 A (nominal 80 A) durante 3 meses. Luego la corriente comienza a aumentar progresivamente hasta 98 A en 6 semanas, con reducción de caudal del 18%. La presión de descarga aumentó. ¿Cuál es el diagnóstico más probable?',
    options: [
      { id: 'a', text: 'Gas lock — el GVF subió por encima del 15% en succión' },
      { id: 'b', text: 'Surging — la bomba excedió el BEP por variación de la curva IPR' },
      { id: 'c', text: 'Incrustación de escala — bloqueo progresivo de etapas (Serie 3700)' },
      { id: 'd', text: 'Falla de rodamiento — el arrastre mecánico aumentó la corriente' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: El gas lock presentaría una baja a < 20% en amperaje y presión de descarga nula o muy baja por no impulsar líquido.',
      b: '❌ Incorrecto: El surging mostraría corrientes oscilantes y vibración alta continua.',
      d: '❌ Incorrecto: El daño de rodamiento sería rápido, elevando vibraciones sin reducir sustancialmente el caudal en tan poco tiempo, y la presión de descarga no subiría.'
    },
    explanation:
      'El patrón clásico de incrustación es: aumento gradual de corriente + reducción de caudal + aumento de presión de descarga. El fluido debe trabajar más para pasar por las etapas parcialmente bloqueadas (mayor diferencial de presión = mayor corriente). La clave diferenciadora es que la reducción de caudal es GRADUAL (semanas), no abrupta. El gas lock produce caída abrupta de caudal con corriente ERRÁTICA o baja, no progresivamente alta. Código API: 3720 (depósitos en impulsor).',
  },
  {
    id: 'm6q3',
    text: 'En un BES de 2400 m, el equipo de superficie mide IR = 0.4 MΩ (límite operativo: 1 MΩ). La corriente es estable y el caudal normal. No hubo sobrecalentamiento registrado. El pozo produce agua de formación con H₂S = 120 ppm. ¿Cuál es la acción correcta?',
    options: [
      { id: 'a', text: 'Continuar operando — el IR > 0.1 MΩ indica que el equipo puede seguir funcionando indefinidamente' },
      { id: 'b', text: 'Reducir la frecuencia VSD al 50 Hz para bajar la corriente y el calentamiento del cable' },
      { id: 'c', text: 'Planificar extracción inmediata — IR < 1 MΩ en presencia de H₂S indica ataque del aislamiento en progreso' },
      { id: 'd', text: 'Inyectar inhibidor de corrosión superficial y monitorear semanalmente' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: Seguir operando con < 1 Megohm es operar con aislamiento comprometido (condición insegura ante un arco).',
      b: '❌ Incorrecto: Reducir Hz bajará calor (tensión) pero no revertirá o detendrá una falla del dieléctrico que ya fue invadido por H2S.',
      d: '❌ Incorrecto: Inhibidor superficial no baja al fondo a proteger el cable del motor y el aislamiento ya fue rasgado químicamente.'
    },
    explanation:
      'IR < 1 MΩ es señal de degradación del aislamiento. Con H₂S = 120 ppm la causa probable es corrosión química del aislamiento (Serie 3700 / código 3730). El H₂S ataca el plomo del cable y los elastómeros. Una vez iniciado, el proceso es irreversible y progresivo. La operación continua con IR en caída puede derivar en falla a tierra y arco eléctrico downhole, causando pérdida total del equipo. Continuar operando con IR < 1 MΩ es una práctica contraria a API RP 11S2 (Electric Submersible Pump Cable Systems).',
  },
  {
    id: 'm6q4',
    text: 'Se extrae una BES después de 14 meses de operación. El teardown muestra: sello primario con elastómero hinchado y agrietado, aceite dieléctrico del motor contaminado con agua de formación, bobinas del motor con manchas oscuras. IR final = 0.05 MΩ. ¿Cuál es la secuencia de falla correcta y el código API?',
    options: [
      { id: 'a', text: 'Falla eléctrica → degradó el sello → invasión de fluido. Código 5900.' },
      { id: 'b', text: 'Sello primario falló primero → invasión de fluido al motor → falla del aislamiento. Código 4930.' },
      { id: 'c', text: 'Incrustación en bomba → aumentó corriente → sobrecalentó el sello. Código 3720.' },
      { id: 'd', text: 'Rodamiento dañado → vibración → fatiga del sello → invasión. Código 5430.' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Una falla eléctrica no hincha elastómeros; genera arcos térmicos localizados u ollines puros.',
      c: '❌ Incorrecto: Faltan datos que corroboren alta presión e incrustación. Lo visual inicial es deterioro del elastómero.',
      d: '❌ Incorrecto: El rodamiento no tiene relación causal directa para hinchar un sello químicamente.'
    },
    explanation:
      'La secuencia de falla clásica de sello primario es: (1) elastómero se degrada (temperatura alta o material inadecuado), (2) el fluido de pozo pasa al aceite dieléctrico del sello, (3) el aceite contaminado llega al motor, (4) el aislamiento se degrada (IR cae), (5) falla eléctrica final. El código API RP 11S1 es 4930 (Falla de elastómero de sello primario + invasión de fluido). Los daños en las bobinas y el IR bajo son CONSECUENCIAS, no causas originales. La clave es el elastómero hinchado/agrietado como primer daño observado.',
  },
  {
    id: 'm6q5',
    text: 'Un operador reporta los siguientes síntomas simultáneos en un BES: corriente oscila entre 55 A y 105 A (nominal 80 A), vibración 6.8 mm/s RMS, caudal fluctúa con picos y valles cada ~3 segundos, presión de descarga inestable. ¿Cuál es el diagnóstico y la intervención prioritaria?',
    options: [
      { id: 'a', text: 'Incrustación de escala — la oscilación es por etapas con distinto nivel de bloqueo. Acción: inhibidor químico.' },
      { id: 'b', text: 'Falla de sello secundario — el fluido entrante altera el balance hidráulico. Acción: extraer equipo.' },
      { id: 'c', text: 'Surging severo (Serie 5400) — la bomba opera sobre el BEP con ingesta intermitente de gas. Acción: reducir frecuencia VSD inmediatamente.' },
      { id: 'd', text: 'Falla de rodamiento (Serie 5430) — la vibración genera corriente errática y oscilación de caudal.' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: La incrustación no genera picos y valles cíclicos cada 3 segundos, genera variables constantes con paulatina obstrucción.',
      b: '❌ Incorrecto: La falla de sello provocaría al final una caída repentina de aislamiento (IR), no oscilaciones hidráulicas.',
      d: '❌ Incorrecto: Fallas de rodamiento son frecuencias altísimas, pero no explican presiones inestables e ingestas bruscas.'
    },
    explanation:
      'El conjunto de síntomas —corriente oscilante con rango amplio (55–105 A), vibración > 6.3 mm/s (Zona C: paro recomendado), caudal fluctuante con ciclo de ~3 s— es la firma típica del surging severo. La bomba opera sobre el BEP: la descarga genera recirculación que colapsa momentáneamente el flujo, la bomba vuelve a cebar, y el ciclo se repite. Código 5410 (Daño mecánico por operación fuera de rango). Acción INMEDIATA: reducir frecuencia VSD hasta que la corriente se estabilice dentro del ±10% del nominal. Si el surging persiste a menor frecuencia, el diseño de etapas/TDH debe revisarse.',
  },
  {
    id: 'm6q6',
    text: 'La resistencia de aislamiento (IR) de un BES cae de 250 MΩ (arranque) a 1.8 MΩ en 8 meses de operación continua. ¿Cuál es la acción correcta según API RP 11S2?',
    options: [
      { id: 'a', text: 'No hay acción — IR > 1 MΩ es el límite de paro, y 1.8 MΩ está sobre el límite' },
      { id: 'b', text: 'Planificar extracción preventiva — la tendencia de caída indica degradación activa del aislamiento' },
      { id: 'c', text: 'Aumentar el voltaje de operación para "reformar" el aislamiento' },
      { id: 'd', text: 'El IR no es un indicador confiable — solo importa la corriente de fuga directa' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 1 MΩ es límite, cierto, pero esperar a que se cruce teniendo la tasa de caída actual (99% en 8 meses) es riesgoso y casi seguro llevará a un disparo intempestivo en días.',
      c: '❌ Incorrecto: "Reformar" con alto voltaje reventaría completamente la brecha dieléctrica restante, destruyendo el motor para siempre.',
      d: '❌ Incorrecto: El Megger / IR en fondo es el indicador directo más universal para monitorear el cable y sello del motor.'
    },
    explanation:
      'Aunque 1.8 MΩ está sobre el límite operativo de 1 MΩ, la TENDENCIA es el indicador clave: caer de 250 MΩ a 1.8 MΩ en 8 meses (reducción de 99.3%) señala degradación activa del aislamiento. A este ritmo, el IR cruzará el límite de 1 MΩ en las próximas semanas. API RP 11S2 recomienda planificar extracción cuando la tendencia de IR es descendente y sostenida, no esperar al límite absoluto. La acción preventiva evita la falla catastrófica que puede dañar el motor irreparablemente.',
  },
  {
    id: 'm6q7',
    text: 'Un BES es extraído con vibración creciente y teardown muestra: dos rodamientos con pitting severo en la pista exterior. La operación fue 14 meses. ¿Cuál es el código API RP 11S1 y la causa raíz más probable?',
    options: [
      { id: 'a', text: 'Código 3720 — incrustación en impulsores que generó desbalanceo y dañó rodamientos' },
      { id: 'b', text: 'Código 5430 — falla de rodamiento por fatiga de contacto (Hertz), posiblemente acelerada por vibración externa' },
      { id: 'c', text: 'Código 4930 — sello primario comprometió el lubricante de los rodamientos' },
      { id: 'd', text: 'Código 5900 — falla eléctrica que generó corrientes parásitas y dañó los rodamientos' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Aunque podría haber dañado rodamientos secundarios, el "pitting masivo en pista" sugiere daño propio del elemento en su fatiga natural o por mala lubricación directa (Código 5430).',
      c: '❌ Incorrecto: Si el sello hubiera fallado el motor se quemaba (falla de aislamiento general 4930), la falla reportada es mecánica en el rodamiento por vibración.',
      d: '❌ Incorrecto: Arco eléctrico produce soldadura en sitio y fulminación (fluting severo), no un pitting por impacto mecánico persistente de esferas.'
    },
    explanation:
      'El pitting severo en la pista exterior (raceway) es la firma de falla por fatiga de contacto de Hertz (rolling contact fatigue). Código API 5430 (Bearing Failure — Fatigue). Las causas posibles: ciclos de carga excesivos, lubricante inadecuado o contaminado, desalineación, o simplemente fin de vida por ciclos de fatiga. 14 meses es dentro del rango normal de MTBF de rodamientos en BES (12–36 meses según condición). El código 5900 aplica cuando se observa evidencia de arco eléctrico (marcas de quemado en la pista).',
  },
  {
    id: 'm6q8',
    text: 'El operador reporta que el BES "patea" (arranca y se detiene) múltiples veces al día con la protección de sobrecorriente. La corriente de arranque es normal (≈ 6× nominal por 0.5 s) pero luego sube a 140% del nominal. ¿Diagnóstico y acción?',
    options: [
      { id: 'a', text: 'Gas lock — el motor no puede arrancar porque hay gas en la bomba. Acción: ajustar temporizador de anti-ciclado.' },
      { id: 'b', text: 'Rotor atascado (stuck rotor) — posible arena o incrustación en el eje. Acción: intentar inversión de fase para desatascar.' },
      { id: 'c', text: 'Sobrecarga mecánica real — el fluido es más denso de lo esperado o hay obstrucción parcial. Acción: verificar IP y densidad del fluido antes de reiniciar.' },
      { id: 'd', text: 'Sobrevoltaje en la red — ajustar el tap del transformador.' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: Gas lock haría la bomba muy liviana de mover, la corriente en arranque pasaría normal y se mantendría bajísima, no en 140%.',
      b: '❌ Incorrecto: Rotor atascado prolonga el LRA (Locked Rotor Amp) de 6x sobre mucho tiempo sin lograr estabilizar o si quiera girar, disparando la protección extrema.',
      d: '❌ Incorrecto: 140% no coincide con variaciones ligeras de Tap; la máquina arranca bien y luego sufre un lastre altísimo en plena operación fluida.'
    },
    explanation:
      'El arranque normal (corriente 6× nominal durante 0.5 s) descarta rotor atascado. El problema es la corriente sostenida al 140% después del arranque, activando sobrecorriente repetidamente. La causa más probable es sobrecarga mecánica real: el fluido producido es más denso de lo diseñado (cambio en la mezcla petróleo-agua, por ejemplo), o hay obstrucción parcial (sand screen bloqueado). Acción: verificar densidad y IP del fluido actual, comparar con el diseño original, y ajustar la frecuencia del VSD si el fluido cambió.',
  },
  {
    id: 'm6q9',
    text: 'Se analiza el historial de fallas de un campo con 20 BES durante 5 años. El 60% de las fallas son códigos 4xxx (sello). El 20% son códigos 3xxx (corrosión/incrustación). El 10% son 5xxx (mecánico). ¿Cuál es la intervención de mayor impacto para mejorar el MTBF del campo?',
    options: [
      { id: 'a', text: 'Invertir en rodamientos de mayor calidad (ataca el 10% de fallas mecánicas)' },
      { id: 'b', text: 'Revisar el diseño y selección de sellos — ataca el 60% de fallas' },
      { id: 'c', text: 'Aumentar el inhibidor de corrosión en tubing para reducir las fallas 3xxx' },
      { id: 'd', text: 'Instalar VSD en todos los pozos para reducir los ciclos de arranque' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Resolver el 10% del problema deja el otro 90% haciendo trizas el presupuesto; no es el mayor impacto directo.',
      c: '❌ Incorrecto: Representa solo el 20%, el dolor principal (60%) no ha sido tratado.',
      d: '❌ Incorrecto: Instalar VSD mitiga choques eléctricos/mecánicos, pero no repara diseños de sello deficientes para ese fluido.'
    },
    explanation:
      'El análisis de Pareto muestra que las fallas de sello (código 4xxx) son el 60% del total — la intervención con mayor impacto en el MTBF es resolver la causa raíz de estas fallas. Posibles acciones: revisar compatibilidad de elastómeros con el fluido producido, mejorar procedimientos de instalación (daño mecánico durante bajada), evaluar temperatura de operación vs. límites del sello, o cambiar a sello de mayor especificación. Atacar las fallas mecánicas (10%) o de corrosión (20%) tiene menor retorno por unidad de esfuerzo.',
  },
  {
    id: 'm6q10',
    text: 'En el árbol de diagnóstico DIFA, la corriente baja sostenida (< 60% del nominal) con caudal nulo lleva al nodo "¿la bomba gira?". Si la respuesta es SÍ (el amperímetro confirma corriente de movimiento), ¿cuál es el diagnóstico?',
    options: [
      { id: 'a', text: 'Gas lock — la bomba gira en gas y no puede impulsar fluido' },
      { id: 'b', text: 'Rotor atascado — la corriente es baja porque el rotor no se mueve' },
      { id: 'c', text: 'Falla de cable — la corriente baja indica resistencia adicional en el circuito' },
      { id: 'd', text: 'Sobrecarga — la corriente alta se disparó la protección' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Si la corriente está baja es porque el rotor está rodando libre; atascado marcaría 600%. Además, la premisa dice expresamente "¿bomba gira?: SÍ".',
      c: '❌ Incorrecto: Resistencia adicional disminuye I según Ohm, pero no anularía el caudal a cero de inmediato en un equipo que gira nominal.',
      d: '❌ Incorrecto: Hablamos explícitamente de corriente BAJA, no alta (sobrecarga).'
    },
    explanation:
      'Si la bomba gira (hay corriente de movimiento, no paro) pero el caudal es nulo y la corriente es muy baja, el diagnóstico es gas lock: la bomba está girando en gas, que no opone resistencia mecánica significativa (baja corriente) y no se puede comprimir para generar caudal. El rotor atascado produce corriente MUY alta (intento de arrancar contra el estátor) o disparo del VSD. La falla de cable produce sobretemperatura pero no nula corriente de movimiento. Este es el nodo crítico del árbol DIFA: "gira + no fluye + corriente baja = gas lock".',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M6_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 6.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM6(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M6_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
