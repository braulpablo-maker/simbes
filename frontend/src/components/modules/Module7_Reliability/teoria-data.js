/**
 * SIMBES — M7: Confiabilidad y MTBF
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: Nelson (1982) | Distribución exponencial | Chi² para IC
 */

export const TEORIA_M7 = [
  {
    id: 'exponencial',
    title: '① Distribución exponencial — R(t)',
    concepto: 'La distribución exponencial modela el tiempo entre fallas cuando la tasa de falla λ es constante (independiente del tiempo transcurrido). Es el modelo base de confiabilidad en BES porque el desgaste dominante es aleatorio, no por envejecimiento acumulativo.',
    formula:
`R(t) = P(T > t) = e^(−t/MTBF) = e^(−λt)

λ = 1 / MTBF    [fallas/día]

MTBF  = valor esperado = 1/λ
Mediana = MTBF × ln(2) ≈ 0.693 × MTBF

RESULTADO CLAVE:
  R(MTBF) = e^(−1) ≈ 36.77%
  Al cumplir el MTBF, solo el 36.77% de los equipos
  siguen operativos. El 63.23% ya falló.`,
    variables: [
      { sym: 'R(t)',  unit: '—',      desc: 'Probabilidad de sobrevivir hasta el tiempo t' },
      { sym: 'λ',    unit: 'fallas/d',desc: 'Tasa de falla constante = 1/MTBF' },
      { sym: 'MTBF', unit: 'días',    desc: 'Mean Time Between Failures — tiempo medio entre fallas' },
      { sym: 't',    unit: 'días',    desc: 'Tiempo de operación desde la instalación' },
    ],
    regla: 'El MTBF NO es el tiempo garantizado de operación. La mitad de los equipos falla ANTES de 0.693 × MTBF (la mediana).',
    tipo_regla: 'danger',
  },

  {
    id: 'censurados',
    title: '② Datos censurados — Estimador MLE',
    concepto: 'Un equipo es "censurado" cuando fue observado sin fallar durante un tiempo t_c pero no se sabe cuándo habría fallado. Ignorar los censurados produce un MTBF artificialmente bajo (sesgo de sobrevivencia inverso).',
    formula:
`MTBF_MLE = T_total / r

T_total = Σ t_fallas + Σ t_censurados
r       = número de fallas (solo fallas, no censurados)

Censura Tipo I:  truncada a tiempo fijo
Censura Tipo II: truncada al acumular r fallas de n equipos`,
    variables: [
      { sym: 'T_total',     unit: 'días',  desc: 'Tiempo total de observación (fallas + censurados)' },
      { sym: 'r',           unit: '—',     desc: 'Número de fallas observadas (no incluir censurados)' },
      { sym: 'MTBF_MLE',   unit: 'días',  desc: 'Estimador de máxima verosimilitud del MTBF' },
      { sym: 't_censurado', unit: 'días',  desc: 'Tiempo de observación de un equipo sin falla' },
    ],
    regla: 'Acumular TODO el tiempo de observación en T_total, pero contar solo las fallas en r.',
    tipo_regla: 'warning',
  },

  {
    id: 'chi2',
    title: '③ Intervalos de confianza Chi²',
    concepto: 'Con pocas fallas (r < 20), el MTBF_MLE tiene alta incertidumbre. Los intervalos de confianza (IC) cuantifican esa incertidumbre. Para tomar decisiones de gestión, usar siempre el límite inferior del IC.',
    formula:
`MTBF_lower = 2T / χ²(1−α/2 , 2r+2)
MTBF_upper = 2T / χ²(α/2   , 2r)

α = nivel de significancia
  → IC 90%: α = 0.10
  → IC 95%: α = 0.05`,
    variables: [
      { sym: 'χ²(p, k)', unit: '—',    desc: 'Cuantil p de la distribución Chi² con k grados de libertad' },
      { sym: 'α',        unit: '—',    desc: 'Nivel de significancia (1 − nivel de confianza)' },
      { sym: 'T',        unit: 'días', desc: 'Tiempo total acumulado de observación' },
      { sym: 'r',        unit: '—',    desc: 'Número de fallas observadas' },
    ],
    regla: 'Con r < 5 fallas, el IC es tan amplio que la decisión debe basarse en el LÍMITE INFERIOR, no en el MTBF_MLE.',
    tipo_regla: 'danger',
  },

  {
    id: 'benchmarks',
    title: '④ Benchmarks MTBF por ambiente',
    concepto: 'Los benchmarks de referencia de la industria BES permiten calibrar los resultados del análisis de confiabilidad con datos reales de campo. Son valores pedagógicos orientativos, no garantías contractuales.',
    formula:
`BENIGNO    : 1825 d (5 años)
  Petróleo limpio, < 120°C, sin corrosión
  R(365d) = e^(−365/1825) = 82%

MODERADO   : 913 d (2.5 años)
  BSW 50–80%, GOR < 500, T 120–150°C
  R(365d) = e^(−365/913) = 67%

SEVERO     : 365 d (1 año)
  GOR > 1000, T > 150°C, H₂S o CO₂
  R(365d) = e^(−365/365) = 37%

ARENA      : 180 d (0.5 años)
  Arena > 50 ppm
  R(365d) = e^(−365/180) = 13%`,
    variables: null,
    regla: 'Un campo severo puede tener MTBF real < 180 días sin buenas prácticas. Con monitoreo e inhibición, el mismo campo puede alcanzar 730 días.',
    tipo_regla: 'ok',
  },

  {
    id: 'glosario',
    title: '⑤ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'MTBF',      def: 'Mean Time Between Failures — tiempo medio entre fallas' },
      { term: 'λ',         def: 'Tasa de falla [fallas/día] = 1/MTBF' },
      { term: 'R(t)',       def: 'Función de supervivencia — probabilidad de sobrevivir a t' },
      { term: 'F(t)',       def: 'Función de falla = 1 − R(t)' },
      { term: 'Mediana',   def: 'Tiempo en que falla el 50%: MTBF × ln(2) ≈ 0.693 × MTBF' },
      { term: 'MLE',       def: 'Maximum Likelihood Estimator — estimador de máxima verosimilitud' },
      { term: 'IC',        def: 'Intervalo de Confianza — rango donde cae el parámetro real' },
      { term: 'Censurado', def: 'Equipo observado sin falla hasta tiempo t_c' },
      { term: 'Chi² (χ²)', def: 'Distribución ji cuadrada — base para IC del MTBF exponencial' },
      { term: 'Sesgo SS',  def: 'Sesgo de sobrevivencia — subestimar MTBF al ignorar censurados' },
    ],
  },
];
