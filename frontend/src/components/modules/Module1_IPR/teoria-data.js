/**
 * SIMBES — M1: IPR / Análisis Nodal
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: Darcy 1856 | Vogel 1968 (SPE 1476) | Mach 1979
 */

export const TEORIA_M1 = [
  {
    id: 'nodal',
    title: '① ¿Qué es el Análisis Nodal?',
    concepto: 'Técnica desarrollada por Joe Mach (1979) que divide el sistema de producción en dos subsistemas que se equilibran en un nodo en el fondo del pozo. El punto donde ambas curvas se cruzan es el Punto de Operación: el caudal y la presión reales a la que produce el pozo.',
    formula:
`IPR — Inflow Performance Relationship
  → capacidad de entrega del yacimiento
  → a mayor drawdown (Pr − Pwf), mayor caudal

VLP — Vertical Lift Performance
  → demanda energética de la infraestructura
  → columna de fluido + fricción + bomba BES`,
    variables: null,
    regla: 'La bomba BES modifica la VLP: aumentar la frecuencia baja la curva VLP y desplaza el punto de operación hacia mayor caudal.',
    tipo_regla: 'indigo',
  },

  {
    id: 'darcy',
    title: '② Modelo Darcy — Zona lineal',
    concepto: 'Válido mientras Pwf ≥ Pb. Todo el gas permanece disuelto en el petróleo → fluido monofásico → la relación caudal-presión es estrictamente lineal. El IP es la pendiente de esa recta.',
    formula:
`Q = IP × (Pr − Pwf)`,
    variables: [
      { sym: 'Q',   unit: 'm³/d',       desc: 'Caudal volumétrico en condiciones de superficie' },
      { sym: 'IP',  unit: 'm³/d/psi',   desc: 'Índice de Productividad — pendiente de la IPR' },
      { sym: 'Pr',  unit: 'psi',         desc: 'Presión estática del reservorio (pozo en reposo)' },
      { sym: 'Pwf', unit: 'psi',         desc: 'Presión fluyente de fondo — en la intake de la bomba' },
      { sym: 'Pb',  unit: 'psi',         desc: 'Presión de burbuja — por debajo el gas se libera' },
    ],
    regla: 'Ref: Darcy (1856) — Ley de flujo en medios porosos.',
    tipo_regla: 'indigo',
  },

  {
    id: 'vogel',
    title: '③ Modelo Vogel — Zona bifásica',
    concepto: 'Activo cuando Pwf < Pb. El gas liberado reduce la movilidad del petróleo y la curva pierde linealidad. El AOF (Absolute Open Flow) es el caudal máximo teórico a Pwf = 0 — el techo del yacimiento.',
    formula:
`Q / AOF = 1 − 0.2·(Pwf/Pb) − 0.8·(Pwf/Pb)²

Qb  = IP × max(Pr − Pb, 0)        [zona Darcy]
AOF = Qb + (IP × Pb) / 1.8        [compuesto]`,
    variables: [
      { sym: 'AOF', unit: 'm³/d', desc: 'Absolute Open Flow — caudal máximo teórico a Pwf = 0' },
      { sym: 'Qb',  unit: 'm³/d', desc: 'Caudal en el punto de burbuja (límite Darcy/Vogel)' },
      { sym: 'Pb',  unit: 'psi',  desc: 'Presión de burbuja — punto de transición entre modelos' },
    ],
    regla: 'El AOF no es alcanzable operativamente. Usar como referencia de techo del yacimiento.',
    tipo_regla: 'warning',
  },

  {
    id: 'vlp',
    title: '④ VLP — Curva de demanda del sistema',
    concepto: 'La VLP es la presión mínima de fondo que necesita el yacimiento para sostener un caudal Q dado. A mayor caudal, mayor demanda energética del sistema. La bomba BES reduce esa demanda al inyectar energía.',
    formula:
`Pwf_VLP = Pwh + grad·prof − H_bomba + H_fricción

H_bomba(Q,f) = H₀ × [1 − (Q/Qmax)^1.85] × (f/60)²

[SIMPLIFIED: H_fricción = 1.4×10⁻⁵ × Q²  — tubing 2.875"–3.5"]`,
    variables: [
      { sym: 'Pwh',   unit: 'psi',  desc: 'Presión en cabeza de pozo (choke + flowline + separador)' },
      { sym: 'grad',  unit: 'psi/ft',desc: 'Gradiente del fluido (densidad × 0.4335)' },
      { sym: 'H₀',    unit: 'ft',   desc: 'Altura máxima de la bomba a Q=0 y 60 Hz' },
      { sym: 'Qmax',  unit: 'm³/d', desc: 'Caudal al que la altura cae a cero (60 Hz)' },
      { sym: 'f',     unit: 'Hz',   desc: 'Frecuencia del VSD — controla la velocidad de la bomba' },
    ],
    regla: 'La curva VLP tiene forma de U: cae con Q (la bomba aporta más), luego sube (fricción domina). El punto de operación es donde IPR corta VLP.',
    tipo_regla: 'indigo',
  },

  {
    id: 'afinidad',
    title: '⑤ BEP y Leyes de Afinidad',
    concepto: 'El BEP es el caudal al que la bomba opera con su mayor eficiencia hidráulica. El VSD permite cambiar la frecuencia y desplazar el punto de operación. Las Leyes de Afinidad cuantifican ese desplazamiento.',
    formula:
`Q₂/Q₁ = f₂/f₁          (caudal escala linealmente)
H₂/H₁ = (f₂/f₁)²       (altura escala al cuadrado)
P₂/P₁ = (f₂/f₁)³       (potencia escala al cubo)

Ejemplo 60 Hz → 50 Hz (ratio = 0.833):
  Q: ×0.833 | H: ×0.694 | P: ×0.579`,
    variables: [
      { sym: 'f₁, f₂', unit: 'Hz',  desc: 'Frecuencias de operación (referencia y nueva)' },
      { sym: 'BEP',     unit: 'm³/d',desc: 'Best Efficiency Point — caudal de máxima eficiencia' },
    ],
    regla: 'La ley cúbica de potencia es clave: reducir la frecuencia 17% (60→50 Hz) recorta el consumo eléctrico ~42%.',
    tipo_regla: 'ok',
  },

  {
    id: 'glosario',
    title: '⑥ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'AOF',      def: 'Absolute Open Flow — caudal máximo teórico a Pwf = 0' },
      { term: 'BEP',      def: 'Best Efficiency Point — caudal de máxima eficiencia hidráulica' },
      { term: 'Drawdown', def: '(Pr − Pwf) / Pr × 100% — fracción de presión consumida para producir' },
      { term: 'GVF',      def: 'Gas Volume Fraction — fracción de gas libre en succión de la bomba' },
      { term: 'IP',       def: 'Índice de Productividad [m³/d/psi] — pendiente de la IPR lineal' },
      { term: 'IPR',      def: 'Inflow Performance Relationship — curva Pwf vs Q del yacimiento' },
      { term: 'Pb',       def: 'Presión de Burbuja — por debajo el gas se libera del petróleo' },
      { term: 'Pr',       def: 'Presión Estática del Reservorio — pozo sin producción' },
      { term: 'Pwf',      def: 'Presión Fluyente de Fondo — en la intake de la bomba' },
      { term: 'Surging',  def: 'Cavitación por operación sobre el BEP — erosiona impulsores' },
      { term: 'TDH',      def: 'Total Dynamic Head — altura total dinámica de la bomba' },
      { term: 'VLP',      def: 'Vertical Lift Performance — curva de demanda del sistema' },
      { term: 'VSD',      def: 'Variable Speed Drive — variador de frecuencia del motor BES' },
    ],
  },
];
