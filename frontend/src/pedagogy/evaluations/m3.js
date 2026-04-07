/**
 * SIMBES — Evaluación Módulo 3: Gas y Flujo Multifásico
 * =====================================================
 * 5 preguntas sobre GVF, gas lock, degradación H-Q, viscosidad y separadores.
 */

export const M3_QUESTIONS = [
  {
    id: 'm3q1',
    text: 'El "gas lock" en una bomba BES ocurre típicamente cuando:',
    options: [
      { id: 'a', text: 'GVF > 5% en la succión de la bomba' },
      { id: 'b', text: 'GVF > 15% en la succión sin separación activa de gas' },
      { id: 'c', text: 'La presión de succión Ps supera la presión de burbuja Pb' },
      { id: 'd', text: 'El GOR superficial supera los 100 scf/STB' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: 5% de gas libre causa degradación leve, pero no lleva al gas lock total.',
      c: '❌ Incorrecto: Al revés. Cuando Ps baja y cae por *debajo* de Pb, el gas se libera del crudo y genera el problema.',
      d: '❌ Incorrecto: El GOR en superficie no determina el estado de las fases en el fondo.'
    },
    explanation:
      'El umbral industrial de gas lock para BES es GVF > 15% en la succión de la bomba (sin separador). Por encima de ese valor, la bomba comienza a recircular gas en lugar de bombearlo, perdiendo altura y caudal hasta el paro total. El GOR superficial no es el parámetro de control directo — lo que importa es el GVF a las condiciones de presión y temperatura del fondo.',
  },
  {
    id: 'm3q2',
    text: 'En un pozo con GVF wellbore = 25%, se instala un AGS pasivo con eficiencia de separación del 65%. ¿Cuál es el GVF efectivo en la succión de la bomba?',
    options: [
      { id: 'a', text: '25% — el AGS no cambia el GVF a esa eficiencia' },
      { id: 'b', text: '8.75% — GVF_bomba = 25% × (1 − 0.65)' },
      { id: 'c', text: '16.25% — GVF_bomba = 25% − 65% ÷ 4' },
      { id: 'd', text: '0% — el AGS elimina completamente el gas libre' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El separador AGS (Advanced Gas Separator) remueve eficiencia gas libre, reduciendo el GVF.',
      c: '❌ Incorrecto: La reducción de GVF no se resta matemáticamente así, se toma el porcentaje residual del GVF original.',
      d: '❌ Incorrecto: Ningún separador AGS pasivo tiene eficiencia del 100%, comúnmente rondan el 60-70%.'
    },
    explanation:
      'GVF_bomba = GVF_pozo × (1 − η_sep) = 25% × (1 − 0.65) = 25% × 0.35 = 8.75%. El AGS no elimina el 100% del gas — la fracción no separada (35%) sigue llegando a la bomba. Con 8.75% en succión, la operación está en zona segura (< 15%), aunque en la zona "leve" del diagrama de degradación.',
  },
  {
    id: 'm3q3',
    text: 'A medida que el GVF en la succión aumenta de 5% a 20%, la curva H-Q de la bomba BES:',
    options: [
      { id: 'a', text: 'Se desplaza hacia arriba (más altura por la menor densidad del fluido)' },
      { id: 'b', text: 'Permanece sin cambios — el gas no afecta bombas centrífugas' },
      { id: 'c', text: 'Se degrada: la altura y la capacidad de caudal disminuyen' },
      { id: 'd', text: 'Solo se desplaza el BEP a mayor caudal; la forma no cambia' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: La mezcla de gases estira un poco el fluido, pero el impulsor pierde "agarre" o cabeza total, no la sube.',
      b: '❌ Incorrecto: Las bombas BES son bombas centrífugas concebidas para líquidos, por lo tanto el gas libre las degrada profundamente.',
      d: '❌ Incorrecto: Toda la curva H-Q se deprime, perdiendo cabeza por etapa y capacidad de caudal máximo.'
    },
    explanation:
      'El gas libre en la succión reduce la capacidad hidráulica de la bomba centrífuga. A GVF > 10%, la altura cae de forma apreciable; a GVF > 15%, la degradación es severa y puede llevar a pérdida total de altura (gas lock). El mecanismo: el gas compresible no transfiere presión como los líquidos, reduciendo la eficiencia de cada etapa.',
  },
  {
    id: 'm3q4',
    text: 'Una bomba BES maneja un crudo con viscosidad de 30 cP (vs. agua = 1 cP). Según la corrección del Hydraulic Institute, ¿qué ocurre con H, Q y eficiencia?',
    options: [
      { id: 'a', text: 'H y Q aumentan porque el fluido tiene mayor masa' },
      { id: 'b', text: 'H, Q y eficiencia disminuyen — la curva H-Q se degrada' },
      { id: 'c', text: 'Solo la eficiencia disminuye; H y Q permanecen constantes' },
      { id: 'd', text: 'El flujo se vuelve laminar, lo que hace la operación más estable' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Mayor viscosidad aumenta la resistencia por corte en el impulsor, bajando el caudal (Q) y la altura (H).',
      c: '❌ Incorrecto: La degradación de bomba afecta la altura (Head) y el caudal (Q), no solamente la eficiencia mecánica.',
      d: '❌ Incorrecto: Flujo laminar requiere Re bajísimos; aunque la viscosidad sea 30cP, la bomba aún genera flujo altamente turbulento local.'
    },
    explanation:
      'El método HI (ANSI/HI 9.6.7) establece tres factores de corrección: CQ < 1, CH < 1, CE < 1. Para 30 cP, CQ ≈ 0.86, CH ≈ 0.93, CE ≈ 0.74 (valores típicos). Esto significa que la bomba produce menos caudal, menos altura y opera con menor eficiencia que en agua. El diseñador debe sobredimensionar para compensar.',
  },
  {
    id: 'm3q5',
    text: 'Un pozo presenta GVF = 18% y síntomas de gas lock (caída de caudal, vibración elevada). ¿Cuál es la solución más directa y efectiva?',
    options: [
      { id: 'a', text: 'Aumentar la frecuencia del VSD a 70 Hz' },
      { id: 'b', text: 'Instalar un AGS o Gas Handler en la intake de la bomba' },
      { id: 'c', text: 'Aumentar la altura H₀ por etapa usando otra bomba' },
      { id: 'd', text: 'Reducir la presión de cabezal abriendo el choke' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Aumentar la frecuencia agrava el gas lock al deprimir aún más la Ps e incrementar el GVF liberado.',
      c: '❌ Incorrecto: Esto no combate el gas en la bomba, que es el causante del paro por bloqueo compresible.',
      d: '❌ Incorrecto: Reducir Pwh favorecerá un poco la curva, pero el GVF en el fondo de todas maneras excederá el límite del 15%.'
    },
    explanation:
      'Con GVF > 15%, la solución de raíz es reducir el GVF efectivo en la succión de la bomba — no incrementar velocidad ni cambiar la bomba. Un AGS pasivo (η ≈ 65%) o Gas Handler (η ≈ 82%) reduciría el GVF de 18% a ~6.3% o ~3.2% respectivamente, eliminando el gas lock. Aumentar frecuencia agrava el problema al reducir Ps (mayor drawdown). Reducir Pwh reduce ligeramente Ps pero no soluciona el GVF fundamentalmente.',
  },
  {
    id: 'm3q6',
    text: 'Un pozo tiene GOR superficial = 400 m³/m³ y presión de succión Ps = 800 psi (Pb = 1800 psi). La solubilidad a Ps es Rs = 180 m³/m³. ¿Hay gas libre en la succión de la bomba?',
    options: [
      { id: 'a', text: 'No — Ps < Pb implica que todo el gas está disuelto' },
      { id: 'b', text: 'Sí — Ps < Pb significa que parte del gas ya se liberó de la solución' },
      { id: 'c', text: 'Solo si GOR > Pb en las mismas unidades' },
      { id: 'd', text: 'No se puede determinar sin la temperatura del fondo' },
    ],
    correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Es contraintuitivo, pero Ps < Pb significa que la presión bajó tanto que cruzó el punto de burbuja liberando gas.',
      c: '❌ Incorrecto: El punto de burbuja Pb es el medidor absoluto de si hay gas libre, independiente del valor de GOR superficial.',
      d: '❌ Incorrecto: Revisa la definición de punto de burbujeo (es la Pb, independiente de si mides T o no en este análisis simplificado).'
    },
    explanation:
      'Cuando Ps < Pb, la presión en la succión está por debajo del punto de burbuja: el gas que estaba disuelto a esa presión se libera. Gas libre = GOR − Rs(Ps) = 400 − 180 = 220 m³/m³ de gas libre por m³ de petróleo. Este gas libre es el que genera el GVF en succión. El error intuitivo es suponer que Ps < Pb implica todo disuelto — es exactamente lo contrario.',
  },
  {
    id: 'm3q7',
    text: 'Con GVF = 22% en succión y AGS dinámico (η = 82%), ¿el GVF efectivo en la bomba cae al rango seguro (< 15%)?',
    options: [
      { id: 'a', text: 'Sí — GVF_bomba = 22% × (1−0.82) = 3.96% — muy por debajo del umbral' },
      { id: 'b', text: 'No — GVF_bomba = 22% × 0.82 = 18% — sigue sobre el umbral' },
      { id: 'c', text: 'Sí, pero solo si la densidad del fluido es < 0.85 kg/L' },
      { id: 'd', text: 'No se puede reducir por debajo del 15% con ningún separador pasivo' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: El AGS separó el 82%, así que solo el 18% restante ingresa a la bomba. Multiplicaste erróneamente.',
      c: '❌ Incorrecto: La efectividad del separador sí depende de las Gravedades Específicas, pero el cálculo neto del GVF ya considera esa eficiencia.',
      d: '❌ Incorrecto: Con diseño adecuado y AGS tándem es común reducir GVFs del 20-30% a valores manejables.'
    },
    explanation:
      'GVF_bomba = GVF_wellbore × (1 − η) = 22% × (1 − 0.82) = 22% × 0.18 = 3.96%. El AGS dinámico redirige el 82% del gas al anular, dejando solo el 18% restante llegar a la bomba. Con 3.96% en succión, la operación es segura con amplio margen. Error común: multiplicar por η en lugar de (1−η), lo que daría 18% — confundiendo el gas separado con el gas que queda.',
  },
  {
    id: 'm3q8',
    text: 'La corrección de viscosidad HI para un crudo de 45 cP da CQ = 0.82 y CH = 0.91. Si la bomba en agua tiene BEP en Q = 500 STB/d y H = 3200 ft/etapa, ¿cuáles son los valores corregidos?',
    options: [
      { id: 'a', text: 'Q_oil = 410 STB/d; H_oil = 2912 ft/etapa' },
      { id: 'b', text: 'Q_oil = 500 STB/d; H_oil = 2912 ft/etapa' },
      { id: 'c', text: 'Q_oil = 410 STB/d; H_oil = 3200 ft/etapa' },
      { id: 'd', text: 'Q_oil = 610 STB/d; H_oil = 3517 ft/etapa' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Ignoraste el factor CQ para el caudal, y la viscosidad lo afectará directamente.',
      c: '❌ Incorrecto: Ignoraste el factor CH para la altura (Head); ambas propiedades se ven deprimidas.',
      d: '❌ Incorrecto: La viscosidad reduce la capacidad de la bomba (factores < 1), no la aumenta (factores > 1).'
    },
    explanation:
      'Q_oil = CQ × Q_agua = 0.82 × 500 = 410 STB/d. H_oil = CH × H_agua = 0.91 × 3200 = 2912 ft/etapa. Ambos factores son < 1: el crudo viscoso reduce tanto el caudal como la altura. El diseñador usa los valores corregidos para verificar que el TDH disponible supera el TDH requerido. Error frecuente: aplicar solo un factor o ignorar la corrección de altura.',
  },
  {
    id: 'm3q9',
    text: '¿Cuál es la diferencia operativa entre un AGS pasivo y un Gas Handler (GHS)?',
    options: [
      { id: 'a', text: 'El AGS separa el gas físicamente (lo envía al anular); el GHS mezcla y maneja el gas dentro de la bomba sin separarlo' },
      { id: 'b', text: 'Son equivalentes — la única diferencia es el fabricante' },
      { id: 'c', text: 'El AGS usa filtros de membrana; el GHS usa centrífugación' },
      { id: 'd', text: 'El AGS aplica solo para GOR > 500 m³/m³; el GHS para GOR < 200 m³/m³' },
    ],
    correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Ambos cumplen funciones anti-gas pero el mecanismo mecánico es radicalmente diferente.',
      c: '❌ Incorrecto: El AGS funciona por dinámicas de fluidos (fuerza centrífuga/gravedad), no membranas.',
      d: '❌ Incorrecto: El GHS se usa típicamente para GVF muy altos porque su "eficiencia" es acondicionar el flujo hasta un 45%.'
    },
    explanation:
      'AGS pasivo: aprovecha gravedad + rotación para separar gas y enviarlo al espacio anular ANTES de la succión (separación física, η ≈ 65%). Gas Handler (GHS): tiene impulsores especiales que comprimen y homogenizan la mezcla bifásica — no separa el gas sino que lo maneja dentro de la bomba (η hasta 82% en términos de reducción de impacto). El GHS es preferido cuando no se puede separar el gas (pozos de alto GVF estructural) pero sí se puede tolerar cierta degradación H-Q.',
  },
  {
    id: 'm3q10',
    text: 'Al aumentar la temperatura del fluido de 50°C a 120°C, la viscosidad de un crudo 25°API:',
    options: [
      { id: 'a', text: 'Aumenta — el calor activa los asfaltenos elevando la viscosidad' },
      { id: 'b', text: 'Se mantiene constante — la viscosidad depende solo de la gravedad API' },
      { id: 'c', text: 'Disminuye significativamente — la viscosidad del crudo tiene fuerte dependencia inversa con T' },
      { id: 'd', text: 'Primero aumenta y luego disminuye, con pico a ~80°C' },
    ],
    correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: La activación térmica de parafinas/asfaltenos es al enfriarse, no al calentarse.',
      b: '❌ Incorrecto: En fluidos incompresibles o simples la T tiene gran impacto, imagina la diferencia entre un aceite frío y uno hirviendo.',
      d: '❌ Incorrecto: La disminución de viscosidad con la temperatura es monótona negativa (siempre baja con T crecientes).'
    },
    explanation:
      'La viscosidad del petróleo disminuye drásticamente con la temperatura. Para un crudo de 25°API: a 50°C μ ≈ 50–100 cP; a 120°C μ ≈ 5–15 cP (reducción de 5–10×). Esta dependencia sigue la correlación de Beggs-Robinson. Implicación en BES: la temperatura de fondo reduce la viscosidad real del fluido, por lo que la degradación H-Q es menor que si se calculara con viscosidad superficial. En pozos someros con crudo pesado, la viscosidad puede ser el factor limitante del diseño.',
  },
];

/** Devuelve n preguntas aleatorias del banco. */
export function sampleQuestions(n = 5) {
  const pool = [...M3_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

/**
 * Califica una respuesta al Módulo 3.
 * @param {Array<{id: string, selected: string}>} answers
 * @returns {{ score, total, pct, results }}
 */
export function gradeM3(answers) {
  const total = answers.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M3_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
