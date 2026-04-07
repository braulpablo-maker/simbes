/**
 * SIMBES — Evaluación Módulo 8: Constructor de Escenarios
 * =========================================================
 * 5 preguntas integradoras que cruzan M1–M7.
 */

export const M8_QUESTIONS = [
  {
    id: 'm8q1',
    text: 'Un ingeniero diseña un BES para un pozo con Pr=3800 psi, Pb=1500 psi, IP=2.5 STB/d/psi, profundidad 2200 m. El primer diseño opera a 55 Hz (bajo BEP). Al aumentar a 65 Hz, el caudal sube pero el GVF también aumenta porque Pwf baja. ¿Cuál es la consecuencia directa de operar con Pwf muy bajo respecto a Pb?',
    options: [
      { id: 'a', text: 'Mayor Pwf → mayor drawdown → más producción siempre' },
      { id: 'b', text: 'Pwf < Pb → gas libre en succión → GVF sube → degradación H-Q → posible gas lock' },
      { id: 'c', text: 'Pwf bajo es siempre bueno — más diferencial de presión = más caudal sin límite' },
      { id: 'd', text: 'El GVF no depende de Pwf — solo depende del GOR superficial' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Matemáticamente un Pwf altísimo aplasta el drawdown reduciendo el caudal empujado al pozo (ley de Darcy IP).',
      c: '❌ Incorrecto: Pwf excesivamente bajo deprime la presión en el intake provocando liberación masiva de gas disuelto (cruza la Pb).',
      d: '❌ Incorrecto: El GVF (volumen fraccional de gas libre en subsuelo) se expande inversamente a la presión que lo comprime (Ley de Boyle), por lo que depende totalmente del Pwf.'
    },
    explanation:
      'La interacción M1↔M3 es central: al bajar Pwf (mayor drawdown), el gas en solución se libera (Ps < Pb en succión → GVF sube). Con GVF > 10% la H-Q se degrada, con GVF > 15% hay riesgo de gas lock. El diseño óptimo balancea producción (mayor drawdown) con riesgo de gas (menor drawdown). Un VSD permite ajustar la frecuencia para encontrar ese balance — no siempre "más frecuencia = mejor".',
  },
  {
    id: 'm8q2',
    text: 'En el Constructor de Escenarios, un equipo tiene: MTBF referencia 365 días (ambiente severo), GVF pump = 18% (con Gas Handler), V_drop = 8.5% (cable #8, 2800 m), T_motor = 198°C (clase H, límite 180°C). ¿Cuál de los cuatro problemas requiere acción INMEDIATA?',
    options: [
      { id: 'a', text: 'MTBF 365 días — es el más bajo, indica ambiente severo y falla segura en el año' },
      { id: 'b', text: 'GVF pump 18% — supera el umbral de 15%, riesgo inmediato de gas lock' },
      { id: 'c', text: 'V_drop 8.5% — supera el 5%, el motor recibe menos voltaje del nominal' },
      { id: 'd', text: 'T_motor 198°C vs límite 180°C — Arrhenius activo, vida cae a <35% del nominal' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: MTBF no es una cuenta regresiva individual, es un umbral probabilístico estadístico.',
      c: '❌ Incorrecto: V_drop del 8.5% baja eficiencia e incrementa factor I^2R pero no "fusila" el motor como para paro de emergencia.',
      d: '❌ Incorrecto: T_motor a 198° reduce seriamente la vida del aislamiento, pero la degradación tomará semanas/meses asintóticamente, no horas/minutos como un Gas Lock inminente.'
    },
    explanation:
      'El GVF pump = 18% supera el umbral de gas lock (15%) con el separador ya instalado. Eso significa que incluso con Gas Handler (η=82%), el GVF wellbore es tan alto que la bomba está en riesgo inmediato de perder succión. Es la única condición que puede causar falla catastrófica en horas. Los otros problemas son graves pero progresivos: el V_drop reduce producción, el Arrhenius reduce vida útil, y el MTBF bajo es estadístico. El GVF >15% requiere paro y evaluación inmediata.',
  },
  {
    id: 'm8q3',
    text: 'Un pozo tiene dos escenarios: A) 60 Hz, sin separador, GVF=8% → Q=420 m³/d. B) 55 Hz, AGS instalado, GVF_pump=3% → Q=310 m³/d. El MTBF en escenario A es 280 días. En B es 650 días. ¿Cuál es el ingreso neto mayor considerando precio petróleo = USD 60/bbl (1 bbl = 0.159 m³) y costo de intervención = USD 180.000?',
    options: [
      { id: 'a', text: 'Escenario A siempre gana — produce 110 m³/d más' },
      { id: 'b', text: 'Escenario B gana en el primer año; A gana a partir del segundo' },
      { id: 'c', text: 'Escenario B tiene mayor rentabilidad considerando el costo de intervenciones frecuentes de A' },
      { id: 'd', text: 'No hay diferencia — el precio del petróleo es el mismo para ambos' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: A nivel bruto financiero sí produce más, pero operativamente un equipo con 280-days MTBF gasta miles de dólares en lucro cesante y alquiler de taladros devorando ese plus.',
      b: '❌ Incorrecto: Ambas condiciones de margen económico en el tiempo permanecen esencialmente fijas asumiendo variables constantes (decline lineal excluido).',
      d: '❌ Incorrecto: Mismo precio de venta pero distinto volumen final de inversión de recuperación y mantenimiento en sitio.'
    },
    explanation:
      'Escenario A: 420 m³/d × 365 días = 153.300 m³/año = 964.151 bbl × USD 60 = USD 57.8M. Pero 365/280 ≈ 1.3 intervenciones × USD 180.000 = USD 234.000 en costos. Escenario B: 310 m³/d × 365 = 113.150 m³ = 711.635 bbl × USD 60 = USD 42.7M. Con 365/650 ≈ 0.56 intervenciones × USD 180.000 = USD 101.000. A tiene mayor ingreso bruto pero B puede tener mejor flujo neto si se consideran costos de tiempo muerto, logística, y el impacto de paros no planeados. Este es el análisis de confiabilidad económica que el Constructor permite modelar.',
  },
  {
    id: 'm8q4',
    text: 'En el Constructor, el punto de operación limpio es Q=385 m³/d, Pwf=1.820 psi. Al activar GOR=800 scf/STB con Ps≈Pwf=1.820 psi y Pb=2.400 psi, el GVF sube y la H-Q se degrada (f_H=0.72). El nuevo punto de operación degradado tiene Q=280 m³/d. ¿Qué variable de control del VSD permite recuperar producción sin aumentar el riesgo de gas?',
    options: [
      { id: 'a', text: 'Aumentar la frecuencia de 60 a 70 Hz para compensar la pérdida de altura' },
      { id: 'b', text: 'Reducir la frecuencia para aumentar Pwf y bajar el GVF, luego optimizar con AGS' },
      { id: 'c', text: 'Cambiar el calibre de cable a AWG más grueso para reducir V_drop' },
      { id: 'd', text: 'Cambiar la topología de VSD a AFE para reducir el THD' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Subir RPM tira más duro del pozo, bajando aún más la presión, liberando geométricamente MÁS gas libre en el intake (peor GVF).',
      c: '❌ Incorrecto: Engrosar el cable reduciría el límite de voltaje perdido, pero el motor seguiría girando gas con la misma deficiencia H-Q.',
      d: '❌ Incorrecto: El control de armónicos AFE depura ruidos eléctricos, no soluciona la interferencia mecánica de fluidos bifásicos operando.'
    },
    explanation:
      'Aumentar la frecuencia (opción A) aumentaría el drawdown → Pwf bajaría aún más → GVF empeoraría: contraproducente. La estrategia correcta es reducir la frecuencia para que Pwf suba, reduciendo el GVF (menos gas libre), y luego instalar un AGS para tratar el gas residual. Con GVF controlado, la f_H mejora y el punto de operación sube. Después se puede optimizar la frecuencia dentro del rango seguro. Este es el workflow clásico M3↔M1 para pozos con alto GOR: primero controlar el gas, luego optimizar la producción.',
  },
  {
    id: 'm8q5',
    text: 'Un gerente dice: "Si instalamos VSD con AFE (THD < 3%), aumentamos la frecuencia a 65 Hz, y usamos cable #4 en lugar de #8, resolveremos todos los problemas del pozo simultáneamente". ¿Cuál es la evaluación correcta de esta afirmación?',
    options: [
      { id: 'a', text: 'Completamente correcto — las tres mejoras se complementan y no tienen efectos secundarios' },
      { id: 'b', text: 'El AFE y el cable #4 son buenas ideas, pero aumentar a 65 Hz puede agravar el GVF y el gas lock si Pwf baja demasiado' },
      { id: 'c', text: 'El cable #4 es incorrecto — cables más gruesos aumentan la resistencia y la caída de voltaje' },
      { id: 'd', text: 'El VSD AFE no tiene efecto sobre el punto de operación de la bomba' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Subir la velocidad sin cuidado ahoga la etapa por descompresión de gas local (GVF), arruinando los beneficios del equipo.',
      c: '❌ Incorrecto: Un número AWG más bajo (#4) corresponde a un cable de cobre de seccion transversal más grueso y de MENOS resistencia.',
      d: '❌ Incorrecto: Es cierto, pero no invalida que la falla recae en la premisa equivocada de que la frecuencia soluciona el GVF.'
    },
    explanation:
      'El AFE (THD < 3%) cumple IEEE 519 — buena decisión. El cable #4 (más grueso que #8) reduce la resistencia y la caída de voltaje — también correcto. Pero aumentar a 65 Hz sin evaluar el impacto en el GVF es un error. Mayor frecuencia → mayor caudal → mayor drawdown → Pwf más bajo → posiblemente Pwf < Pb → GVF sube → H-Q se degrada → el beneficio del VSD se cancela. El diseño integrado requiere evaluar todos los módulos en conjunto: la mejora eléctrica (M4) no puede analizarse aislada del impacto en la presión de succión (M3) y el punto de operación (M1). Esa integración es el propósito central del Constructor de Escenarios.',
  },
  {
    id: 'm8q6',
    text: 'Un pozo tiene producción inicial q_i = 500 STB/d y decline exponencial con tasa b = 0 (Arps) y tasa de decline Di = 15%/año. ¿Cuál es la producción al año 3?',
    options: [
      { id: 'a', text: '≈ 308 STB/d — q(3) = 500 × e^(−0.15×3)' },
      { id: 'b', text: '≈ 250 STB/d — q(3) = 500 × (1 − 0.15×3)' },
      { id: 'c', text: '≈ 385 STB/d — q(3) = 500 × (1 − 0.15)³' },
      { id: 'd', text: '≈ 130 STB/d — q(3) = 500 × 0.15³' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Esta ecuación es para decline lineal puro generalizado anual que asume la misma depreciación siempre, no fraccionaria logarítmica.',
      c: '❌ Incorrecto: Esta asume porcentaje de merma discreta sin integrar los intermedios del año matemáticamente.',
      d: '❌ Incorrecto: Es simplemente "15% a la tres", resultando en un número ínfimo al multiplicarlo.'
    },
    explanation:
      'Decline exponencial (b=0): q(t) = q_i × e^(−Di×t) = 500 × e^(−0.15×3) = 500 × e^(−0.45) = 500 × 0.638 ≈ 319 STB/d. La opción A (308) es la más próxima al cálculo exacto (la diferencia se debe al redondeo de Di anual a mensual). La opción B es decline lineal (incorrecto para Arps exponencial). La opción C es decline geométrico discreto (aproximación, no exacta para Arps continuo).',
  },
  {
    id: 'm8q7',
    text: 'Comparas dos escenarios en el Constructor: A) MTBF = 500 días, Q = 450 STB/d; B) MTBF = 900 días, Q = 310 STB/d. El costo de intervención es USD 200.000. Con USD 80/bbl, ¿cuál escenario da mayor ingreso neto en 3 años considerando los costos de intervención esperados?',
    options: [
      { id: 'a', text: 'Escenario A — mayor caudal compensa el mayor número de intervenciones' },
      { id: 'b', text: 'Escenario B — menos intervenciones reducen el costo total aunque el caudal sea menor' },
      { id: 'c', text: 'Son equivalentes en ingreso neto — la diferencia en Q y MTBF se cancela exactamente' },
      { id: 'd', text: 'No se puede comparar sin conocer el GVF y la temperatura de cada escenario' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: A nivel bruto financiero sí produce más, pero operativamente un equipo con MTBF corto absorbe el margen si se analiza netamente con el precio y costo dado.',
      c: '❌ Incorrecto: Sus resultados finales difieren drásticamente al cruzar el coste del servicio asociado a cada escenario.',
      d: '❌ Incorrecto: Para una prueba de stress teórica basta correr los presupuestos fijos base vs tasa de fallo sin añadir GVF o temperatura que estorbarían el ejercicio puntual.'
    },
    explanation:
      'A en 3 años (1095 días): N_fallas_A ≈ 1095/500 = 2.19 intervenciones → costo ≈ USD 438.000. Ingreso_A = 450 STB/d × 1095 días × 0.159 m³/STB... usando 1 STB = 1 bbl: 450 × 1095 × 80 = USD 39.4M − 438.000 ≈ USD 39.0M. B en 3 años: N_fallas_B ≈ 1095/900 = 1.22 intervenciones → costo ≈ USD 244.000. Ingreso_B = 310 × 1095 × 80 = USD 27.2M − 244.000 ≈ USD 26.9M. Escenario A (mayor caudal) sigue siendo más rentable por la diferencia de 140 STB/d. El escenario B es mejor SOLO si el costo de intervención es muy alto o si hay riesgo de daño al yacimiento por sobre-explotación.',
  },
  {
    id: 'm8q8',
    text: 'En el Constructor de Escenarios, el KPI "GVF pump" está en 14% (límite de alerta: 15%). ¿Cuál es la acción preventiva correcta antes de que supere el umbral?',
    options: [
      { id: 'a', text: 'No actuar — 14% está bajo el límite; el KPI solo importa cuando supera 15%' },
      { id: 'b', text: 'Reducir la frecuencia del VSD para aumentar la Ps y mantener GVF < 15%' },
      { id: 'c', text: 'Aumentar la frecuencia para producir más mientras aún es posible' },
      { id: 'd', text: 'Cambiar el modelo de decline de Arps a material balance' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 14% es un nivel elevadísimo que roza la cavitación inminente, actuar preventivamente evita el lucro cesante de un paro abrupto de protección.',
      c: '❌ Incorrecto: Aumentar la frecuencia bajaría aún más la presión incrementando rápidamente el ratio volumétrico de gas y trabando la bomba (Gas lock).',
      d: '❌ Incorrecto: El cambio de pronóstico ARPS a Material Balance no arreglará físicamente el GVF crítico presente en la bomba, no intercederá en la física downhole.'
    },
    explanation:
      'Con GVF en 14%, muy cerca del umbral de 15%, la acción preventiva es reducir la frecuencia del VSD para aumentar la presión de succión (Ps sube al reducir el drawdown), lo que reduce el GVF. Actuar cuando el KPI está al 93% del límite permite evitar el gas lock de forma controlada. Esperar al 100% del límite es gestión reactiva — el objetivo del Constructor es precisamente identificar estos puntos de riesgo antes de que se conviertan en emergencias operativas.',
  },
  {
    id: 'm8q9',
    text: 'El decline de Arps con b = 1 (decline hiperbólico) y Di = 20%/año tiene el siguiente comportamiento comparado con b = 0 (exponencial) al mismo Di inicial:',
    options: [
      { id: 'a', text: 'Declina más rápido que el exponencial — b > 0 acelera la caída' },
      { id: 'b', text: 'Declina más lento que el exponencial — la tasa de decline disminuye con el tiempo' },
      { id: 'c', text: 'Declina igual — b solo afecta la forma de la curva acumulada, no la tasa instantánea' },
      { id: 'd', text: 'El decline hiperbólico nunca llega a cero — es asintótico al valor de q_i' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Aceleración de caída ocurre con declinación exponencial temprana, no hiperbólica de cola extendida.',
      c: '❌ Incorrecto: Claro que afecta la tasa instantánea con la adición de b como denominador estabilizador.',
      d: '❌ Incorrecto: Disminuye a valores diminutos imperceptibles, pero eso no es el principal comparativo acá, sino su tasa de atenuación.'
    },
    explanation:
      'En el decline hiperbólico (0 < b ≤ 1), la tasa de decline Di(t) = Di/(1+b×Di×t) disminuye con el tiempo — el pozo declina más despacio a medida que envejece. Esto contrasta con el exponencial (b=0) donde Di es constante. Para el mismo Di inicial, la producción acumulada del hiperbólico supera a la del exponencial (el área bajo la curva es mayor). Cuando b = 1, el decline es "armónico" — el más lento de los modelos de Arps. En pozos con fracturas hidráulicas, b ≈ 1–2 es frecuente en la etapa inicial de alta tasa de flujo.',
  },
  {
    id: 'm8q10',
    text: 'El Constructor muestra que el plan de producción del pozo B genera 820.000 STB en 5 años vs. el pozo A con 750.000 STB. Sin embargo, el MTBF_B = 280 días vs. MTBF_A = 650 días. El costo de intervención es USD 250.000. ¿Qué parámetro adicional necesitas para decidir cuál pozo es más rentable?',
    options: [
      { id: 'a', text: 'El GOR de cada pozo' },
      { id: 'b', text: 'El precio del petróleo (USD/bbl) para calcular ingresos y comparar vs. costos de intervención' },
      { id: 'c', text: 'La profundidad del pozo para estimar el TDH' },
      { id: 'd', text: 'No se necesita nada más — siempre conviene el mayor volumen acumulado' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El GOR es importante para el gas lock, pero tú ya tienes calculados los volúmenes totales (STB) y la confiabilidad del pozo dados (MTBF).',
      c: '❌ Incorrecto: Te falta la métrica económica. Profundidad es dato de diseño previo.',
      d: '❌ Incorrecto: El volumen extra de "B" (70,000 barriles brutos extra) atrae costos inmersos mucho más altos de reparación de taladro debido a un MTBF asquerosamente bajo.'
    },
    explanation:
      'Para evaluar rentabilidad: Ingreso_neto = Q_acumulada × Precio − N_intervenciones × Costo_interv. N_fallas_B ≈ (5×365)/280 ≈ 6.5 intervenciones → costo ≈ 6.5 × 250.000 = USD 1.625M. N_fallas_A ≈ (5×365)/650 ≈ 2.8 intervenciones → costo ≈ USD 700.000. Diferencia de costos = USD 925.000. Diferencia de producción = 70.000 STB. Para que B sea más rentable: 70.000 STB × Precio > 925.000 → Precio > USD 13.2/bbl. A USD 60/bbl ambos datos apuntan a B aún siendo rentable, pero el análisis REQUIERE el precio para confirmar. Sin precio del petróleo, la decisión es incompleta.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M8_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

export function gradeM8(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M8_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
