/**
 * SIMBES — M4: Eléctrico y VSD
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: IEEE 519-2014 | NACE MR0175/ISO 15156 | Arrhenius (1889) | ABB TN060
 */

export const TEORIA_M4 = [
  {
    id: 'cable',
    title: '① Cable eléctrico — Caída de voltaje',
    concepto: 'El cable transporta la energía desde superficie hasta el motor en el fondo. Su resistencia aumenta con la temperatura, incrementando las pérdidas. Una caída de voltaje excesiva reduce la eficiencia y puede dañar el motor.',
    formula:
`R_T = R_20 × (1 + α × (T_avg − 20))    [Ω]

α_cobre = 0.00393 /°C

V_drop = I × R_T × 3    [V — circuito trifásico]

Límites: < 5% → OK  |  5–10% → Advertencia  |  > 10% → Peligro`,
    variables: [
      { sym: 'R_T',   unit: 'Ω',    desc: 'Resistencia del cable corregida por temperatura' },
      { sym: 'R_20',  unit: 'Ω/km', desc: 'Resistencia a 20°C según calibre AWG' },
      { sym: 'α',     unit: '/°C',  desc: 'Coeficiente de temperatura del cobre: 0.00393/°C' },
      { sym: 'T_avg', unit: '°C',   desc: 'Temperatura media del cable (promedio sup-fondo)' },
      { sym: 'I',     unit: 'A',    desc: 'Corriente nominal del motor' },
    ],
    regla: 'A menor número AWG → mayor diámetro → menor resistencia. AWG #1 (R ≈ 0.12 Ω/1000ft) vs AWG #14 (R ≈ 2.53 Ω/1000ft).',
    tipo_regla: 'indigo',
    ejemplo_resuelto: {
      contexto: "Tenemos un motor que consume 60 A y un cable resistivo de R = 0.5 Ω de fondo a superficie.",
      pasos: [
        "Paso 1: Calcular la caída de voltaje en un sistema trifásico usando V_drop = I × R × √3 o asumiendo el factor x3 según la fórmula de este manual.",
        "Paso 2: Si usamos V_drop = I × R_T × 3 → 60 A × 0.5 Ω × 3 = 90 V.",
        "Paso 3: Si el voltaje nominal en superficie es 3000 V, 90 / 3000 = 3% de caída.",
        "Paso 4: Esta caída es < 5%, por lo tanto, es un diseño operativo adecuado (OK)."
      ]
    }
  },

  {
    id: 'arrhenius',
    title: '② Regla de Arrhenius — Vida útil del aislamiento',
    concepto: 'El aislamiento del motor es el componente más sensible a la temperatura. La regla de los 10°C establece que cada 10°C sobre el límite nominal del aislamiento reduce la vida útil a la mitad.',
    formula:
`τ₂/τ₁ = 2^((T₁ − T₂) / 10)

Clase F → límite 155°C
Clase H → límite 180°C  (la más común en BES)
Clase C → límite 220°C`,
    variables: [
      { sym: 'τ₁, τ₂', unit: 'h',  desc: 'Vida útil del aislamiento a temperaturas T₁ y T₂' },
      { sym: 'T₁',      unit: '°C', desc: 'Temperatura de referencia (límite nominal de la clase)' },
      { sym: 'T₂',      unit: '°C', desc: 'Temperatura de operación real del motor' },
    ],
    regla: 'Clase H a 190°C → vida = 50% nominal. A 200°C → 25%. A 220°C → 6.25%.',
    tipo_regla: 'danger',
    ejemplo_resuelto: {
      contexto: "Se opera un motor Clase H (límite 180°C) a una temperatura real de 205°C durante un periodo prolongado.",
      pasos: [
        "Paso 1: Excedente térmico = T_real - T_límite = 205°C - 180°C = 25°C.",
        "Paso 2: Factores de reducción a la mitad (cada 10°C) = 25 / 10 = 2.5.",
        "Paso 3: Vida útil relativa = 1 / (2^2.5) = 1 / 5.65 ≈ 17.6%.",
        "Paso 4: El activo fallará teóricamente en el 17.6% del tiempo previsto por el fabricante."
      ]
    }
  },

  {
    id: 'thd',
    title: '③ THD — Distorsión Armónica Total',
    concepto: 'El VSD convierte la frecuencia de red y genera armónicos de corriente que degradan la calidad de la red eléctrica. El estándar IEEE 519-2014 limita el THD de voltaje a menos del 5% en el Punto de Acoplamiento Común (PCC).',
    formula:
`6 pulsos estándar    →  THD ≈ 30%     ❌
12 pulsos            →  THD ≈ 17.5%   ❌
18 pulsos            →  THD ≈ 4%      ✅
Active Front End     →  THD ≈ 2.5%    ✅
Filtro Activo        →  THD ≈ 1.5%    ✅

Límite IEEE 519-2014: THDv < 5% en PCC`,
    variables: [
      { sym: 'THD',  unit: '%',  desc: 'Total Harmonic Distortion — distorsión armónica total' },
      { sym: 'PCC',  unit: '—',  desc: 'Point of Common Coupling — punto de conexión con la red' },
      { sym: 'AFE',  unit: '—',  desc: 'Active Front End — rectificador IGBT activo de muy bajo THD' },
    ],
    regla: 'THD alto → calentamiento de transformadores, errores en instrumentación SCADA e interferencia en comunicaciones.',
    tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "El operador debe cumplir la norma IEEE 519-2014 (<5% THD) en la entrega al campo petrolero en su punto PCC.",
      pasos: [
        "Paso 1: Si instala VSD de 6 pulsos (THD ≈ 30%), NO cumple.",
        "Paso 2: Si instala VSD de 12 pulsos (THD ≈ 17.5%), tamboco cumple el 5%.",
        "Paso 3: Debe especificar VSD de 18 pulsos o con AFE (Active Front End). El AFE dará THD ≈ 2.5%, asegurando el cumplimiento y evitando multas."
      ]
    }
  },

  {
    id: 'nace',
    title: '④ Selección de materiales — NACE MR0175',
    concepto: 'La norma NACE MR0175 / ISO 15156 rige la selección de materiales para ambientes con H₂S (gas amargo), donde existe riesgo de SSC (Sulfide Stress Cracking). Incumplir la norma puede causar falla catastrófica del sello del motor.',
    formula:
`T° > 140°C             → EPDM o PEEK  (no NBR)
H₂S presente           → Lead Sheath + Monel 400
Inyección de solventes → PEEK mandatorio`,
    variables: [
      { sym: 'NBR',   unit: '—', desc: 'Nitrilo — elastómero estándar, solo para T° < 120°C sin H₂S' },
      { sym: 'EPDM',  unit: '—', desc: 'Etileno-propileno — hasta 177°C, resistente a vapor y agua' },
      { sym: 'PEEK',  unit: '—', desc: 'Poliéteretercetona — hasta 250°C, resistente a solventes' },
      { sym: 'Monel', unit: '—', desc: 'Aleación Ni-Cu — resistente a la corrosión por H₂S' },
    ],
    regla: 'El H₂S difunde por los elastómeros NBR a alta temperatura → descompresión explosiva al parar el pozo.',
    tipo_regla: 'danger',
    ejemplo_resuelto: {
      contexto: "Pozo profundo operando a 150°C, y fluidos que contienen H₂S. Hay que escoger cable de potencia.",
      pasos: [
        "Paso 1: Por la temperatura de 150°C, NBR ya no es apto (>140°C y H2S). Se necesita EPDM o PEEK.",
        "Paso 2: Por presencia de H₂S, NACE MR0175 requiere barrera contra gas impermeable. EPDM aislado no basta.",
        "Paso 3: Solución NACE: EPDM con cubierta exterior de plomo (Lead Sheath). Para contención mecánica agresiva y corrosión localizada, empacarlo encima con Monel 400."
      ]
    }
  },

  {
    id: 'glosario',
    title: '⑤ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'AWG',         def: 'American Wire Gauge — escala inversa de calibre de conductor' },
      { term: 'VSD',         def: 'Variable Speed Drive — variador de frecuencia del motor BES' },
      { term: 'THD',         def: 'Total Harmonic Distortion — distorsión armónica total' },
      { term: 'PCC',         def: 'Point of Common Coupling — punto de conexión común en la red' },
      { term: 'IEEE 519',    def: 'Norma para control de armónicos en sistemas de potencia eléctrica' },
      { term: 'AFE',         def: 'Active Front End — rectificador IGBT de muy bajo THD (< 3%)' },
      { term: 'SSC',         def: 'Sulfide Stress Cracking — fisuración por tensión con H₂S' },
      { term: 'NACE MR0175', def: 'Norma de materiales para ambientes con gas amargo' },
      { term: 'Lead Sheath', def: 'Camisa de plomo en cable — protección contra H₂S' },
      { term: 'Clase H',     def: 'Clase de aislamiento con límite 180°C — la más común en BES' },
    ],
  },
];
