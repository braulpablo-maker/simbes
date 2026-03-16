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
    explanation:
      'El conjunto de síntomas —corriente oscilante con rango amplio (55–105 A), vibración > 6.3 mm/s (Zona C: paro recomendado), caudal fluctuante con ciclo de ~3 s— es la firma típica del surging severo. La bomba opera sobre el BEP: la descarga genera recirculación que colapsa momentáneamente el flujo, la bomba vuelve a cebar, y el ciclo se repite. Código 5410 (Daño mecánico por operación fuera de rango). Acción INMEDIATA: reducir frecuencia VSD hasta que la corriente se estabilice dentro del ±10% del nominal. Si el surging persiste a menor frecuencia, el diseño de etapas/TDH debe revisarse.',
  },
];

/**
 * Califica una respuesta al Módulo 6.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM6(answers) {
  const total = M6_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M6_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
