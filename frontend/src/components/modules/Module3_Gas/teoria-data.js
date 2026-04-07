/**
 * SIMBES — M3: Gas y Flujo Multifásico
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: Standing (1977) | ANSI/HI 9.6.7 | Fabricantes BES (empírico)
 */

export const TEORIA_M3 = [
  {
    id: 'gvf',
    title: '① GVF — Gas Volume Fraction',
    concepto: 'El GVF es la fracción volumétrica de gas libre en la succión de la bomba a condiciones de fondo. Cuando la presión de succión cae por debajo de Pb, el gas sale de solución y llega a la bomba en fase libre.',
    formula:
`GVF = Q_gas / (Q_gas + Q_líquido)

GOR_libre = GOR × (1 − Ps/Pb)       [Standing simplificado]
Bg = 0.02829 × z × T_R / Ps         [m³/m³ a condiciones de fondo]
Q_gas     = Q_líquido × GOR_libre × Bg
1 STB = 0.158987 m³                  [factor de conversión volumétrico]`,
    variables: [
      { sym: 'GOR',      unit: 'm³/m³',  desc: 'Gas-Oil Ratio superficial (condiciones estándar)' },
      { sym: 'Ps',       unit: 'psi',    desc: 'Presión de succión de la bomba (pump intake pressure)' },
      { sym: 'Pb',       unit: 'psi',    desc: 'Presión de burbuja — por debajo el gas se libera' },
      { sym: 'Bg',       unit: 'm³/m³',  desc: 'Factor volumétrico del gas a condiciones de fondo' },
      { sym: 'T_R',      unit: '°R',     desc: 'Temperatura de fondo en Rankine (°F + 460)' },
    ],
    regla: 'Para Ps ≥ Pb → GVF = 0 (todo el gas permanece disuelto). El GVF crece a medida que Ps cae por debajo de Pb.',
    tipo_regla: 'indigo',
    ejemplo_resuelto: {
      contexto: "Un pozo tiene GOR = 300 scf/STB, Pb = 1500 psi. Si Ps = 1000 psi, determinar el GOR libre asumiendo el modelo Standing simplificado.",
      pasos: [
        "Paso 1: Identificar que Ps < Pb (1000 < 1500), por lo tanto hay gas libre.",
        "Paso 2: Calcular la fracción liberada = (1 - Ps/Pb) = (1 - 1000/1500) = 1 - 0.667 = 0.333.",
        "Paso 3: Calcular GOR libre = GOR_total × 0.333 = 300 × 0.333 = 100 scf/STB."
      ]
    }
  },

  {
    id: 'gaslock',
    title: '② Gas Lock — Umbral de operación',
    concepto: 'El gas lock ocurre cuando el GVF en la succión supera la capacidad hidráulica de los impulsores centrífugos. Los impulsores no pueden comprimir gas: la bomba pierde caudal y puede calentarse hasta dañarse.',
    formula:
`GVF < 10%   → operación normal
GVF 10–15%  → zona de precaución
GVF > 15%   → gas lock inminente — instalar separador

[SIMPLIFIED: umbral empírico de fabricantes BES]`,
    variables: [
      { sym: 'GVF', unit: '—', desc: 'Gas Volume Fraction en la succión (0 = sin gas, 1 = 100% gas)' },
    ],
    regla: 'Sin separador, el GVF del wellbore llega completo a la bomba. Con GVF > 15% el equipo debe parar.',
    tipo_regla: 'danger',
  },

  {
    id: 'degradacion',
    title: '③ Degradación de la curva H-Q',
    concepto: 'El gas compresible no transfiere presión como los líquidos. A mayor GVF en succión, la bomba entrega menos altura a igual caudal. Este efecto se modela con un factor de degradación sobre la curva H-Q limpia.',
    formula:
`H_degradada(Q) = f_H × H_limpia(Q)

GVF ≤ 5%:   f_H = 1.00  (sin degradación)
GVF 5–10%:  f_H = 0.90–1.00  (leve)
GVF 10–15%: f_H = 0.70–0.90  (moderada)
GVF > 15%:  f_H < 0.70  (severa → gas lock)`,
    variables: [
      { sym: 'f_H', unit: '—',  desc: 'Factor de degradación de altura por gas libre (empírico)' },
      { sym: 'GVF', unit: '—',  desc: 'Gas Volume Fraction en la succión de la bomba' },
    ],
    regla: '[SIMPLIFIED: factor uniforme sobre la curva. Valores reales varían por fabricante y geometría del impulsor.]',
    tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "Calcular el impacto en la bomba si GVF=12%.",
      pasos: [
        "Paso 1: Para GVF = 12%, estamos cerca de gas lock y el factor f_H será de 0.70 a 0.90.",
        "Paso 2: Al instalar un AGS rotativo (η=65%), el nuevo GVF en el impulsor bajará a 12% × (1 - 0.65) = 4.2%.",
        "Paso 3: Con GVF=4.2%, la bomba no sufre degradación (f_H ≈ 1.00)."
      ]
    }
  },

  {
    id: 'separadores',
    title: '④ Separadores AGS y Gas Handler',
    concepto: 'Los separadores se instalan entre el intake y la bomba para reducir el GVF que llega a los impulsores. Existen dos tipos principales: separadores rotativos pasivos (AGS) y gas handlers activos.',
    formula:
`GVF_bomba = GVF_wellbore × (1 − η_separador)

AGS Pasivo (Rotary):  η ≈ 65%  →  para GVF < 25%
Gas Handler Activo:   η ≈ 82%  →  mayor rango de operación`,
    variables: [
      { sym: 'η_sep',       unit: '—', desc: 'Eficiencia de separación (fracción de gas separado)' },
      { sym: 'GVF_wellbore',unit: '—', desc: 'GVF en el wellbore antes del separador' },
      { sym: 'GVF_bomba',   unit: '—', desc: 'GVF que llega a los impulsores después del separador' },
    ],
    regla: 'El AGS agrega OD al string. Verificar holgura en casing antes de especificar.',
    tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "El GVF en fondo calculado es de 25%. Se propone instalar un AGS con eficiencia del 65%.",
      pasos: [
        "Paso 1: Identificar que GVF=25% causará Gas Lock seguro sin equipo auxiliar.",
        "Paso 2: Calcular GVF entrando a los impulsores: GVF_bomba = 25% × (1 - 0.65)",
        "Paso 3: GVF_bomba = 25% × 0.35 = 8.75%.",
        "Conclusión: El AGS deprime el gas libre a 8.75%, permitiendo operación continua."
      ]
    }
  },

  {
    id: 'viscosidad',
    title: '⑤ Corrección de Viscosidad (Método HI)',
    concepto: 'Para crudos viscosos (> 5 cP), la bomba entrega menos caudal y altura de lo indicado en la curva de agua. El método ANSI/HI 9.6.7 calcula factores correctivos CQ, CH y CE aplicados a la curva H-Q.',
    formula:
`B = √Q_bep × H_bep^0.25 / √ν

B ≥ 40  → sin corrección necesaria
B 10–40 → CQ = 0.85–1.0,  CH = 0.92–1.0
B < 10  → corrección severa (CQ, CH < 0.85)`,
    variables: [
      { sym: 'B',     unit: '—',   desc: 'Parámetro adimensional HI que relaciona Q, H y viscosidad' },
      { sym: 'ν',     unit: 'cSt', desc: 'Viscosidad cinemática del fluido (1 cP agua = 1 cSt)' },
      { sym: 'CQ',    unit: '—',   desc: 'Factor de corrección de caudal por viscosidad' },
      { sym: 'CH',    unit: '—',   desc: 'Factor de corrección de altura por viscosidad' },
      { sym: 'CE',    unit: '—',   desc: 'Factor de corrección de eficiencia por viscosidad' },
    ],
    regla: 'Para crudos > 30 cP la reducción de eficiencia puede llegar al 25–40%. Sobredimensionar en caudal y altura.',
    tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "Se requiere un caudal de 500 m³/d para un crudo extrapesado donde la corrección HI arrojó CQ = 0.85.",
      pasos: [
        "Paso 1: La bomba bombeará el crudo viscoso, operando con su capacidad mermada al 85%.",
        "Paso 2: Para compensar, dividimos el caudal requerido por el factor de corrección: Q_diseño = 500 / 0.85",
        "Paso 3: Q_diseño = 588 m³/d. Seleccionar una bomba de catálogo cuyo BEP en agua dulce sea ~600 m³/d."
      ]
    }
  },

  {
    id: 'glosario',
    title: '⑥ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'GVF',      def: 'Gas Volume Fraction — fracción volumétrica de gas en succión (0–1)' },
      { term: 'GOR',      def: 'Gas-Oil Ratio superficial (scf/STB)' },
      { term: 'Pb',       def: 'Presión de burbuja — inicio de liberación de gas (psi)' },
      { term: 'Ps',       def: 'Presión de succión de la bomba — pump intake pressure (psi)' },
      { term: 'Bg',       def: 'Factor volumétrico del gas — expansión a condiciones de fondo' },
      { term: 'AGS',      def: 'Automatic Gas Separator — separador rotativo pasivo' },
      { term: 'f_H',      def: 'Factor de degradación de altura por gas libre (empírico)' },
      { term: 'CQ / CH',  def: 'Factores de corrección ANSI/HI por viscosidad del crudo' },
      { term: 'Gas Lock', def: 'Pérdida total de succión — la bomba gira en gas sin producir fluido' },
    ],
  },
];
