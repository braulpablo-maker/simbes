/**
 * SIMBES — M2: Diseño Hidráulico BES
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: Darcy-Weisbach | Colebrook-White | API RP 11S2
 */

export const TEORIA_M2 = [
  {
    id: 'tdh',
    title: '① TDH — Total Dynamic Head',
    concepto: 'El TDH es la altura total que la bomba debe generar para mover el fluido desde la profundidad del yacimiento hasta la superficie. Se compone de tres términos: la columna estática de fluido, las pérdidas por fricción en el tubing y la contrapresión en cabeza de pozo.',
    formula:
`TDH = H_estático + H_fricción + H_contrapresión

H_estático      = depth [m]
H_fricción      = f × (L/D) × v²/(2g)  [m]
H_contrapresión = (Pwh / gradiente) × 0.3048  [m]`,
    variables: [
      { sym: 'H_estático',      unit: 'm',   desc: 'Columna de fluido desde la bomba hasta superficie' },
      { sym: 'H_fricción',      unit: 'm',   desc: 'Pérdidas por fricción viscosa en el tubing (Darcy-Weisbach)' },
      { sym: 'H_contrapresión', unit: 'm',   desc: 'Contrapresión en cabeza de pozo convertida a metros de fluido' },
      { sym: 'Pwh',             unit: 'psi', desc: 'Wellhead pressure — presión en la cabeza del pozo' },
    ],
    regla: 'La contrapresión suele representar 5–15% del TDH. Las pérdidas por fricción dominan en pozos profundos y/o con alto caudal.',
    tipo_regla: 'indigo',
  },

  {
    id: 'darcy',
    title: '② Darcy-Weisbach — Fricción en tubing',
    concepto: 'Ecuación universal para calcular las pérdidas de energía por viscosidad y turbulencia a lo largo del tubing. El factor de fricción f no es constante: depende del régimen de flujo y la rugosidad de la tubería.',
    formula:
`h_f = f × (L / D) × v² / (2g)

v = Q / A = Q / (π × D² / 4)   [m/s]`,
    variables: [
      { sym: 'f',  unit: '—',   desc: 'Factor de fricción de Darcy (Colebrook-White o Moody)' },
      { sym: 'L',  unit: 'm',   desc: 'Longitud del tubing ≈ profundidad de la bomba' },
      { sym: 'D',  unit: 'm',   desc: 'Diámetro interno del tubing' },
      { sym: 'v',  unit: 'm/s', desc: 'Velocidad media del fluido = Q / Área' },
      { sym: 'g',  unit: 'm/s²',desc: 'Aceleración gravitacional = 9.81 m/s²' },
    ],
    regla: 'h_f crece con v² y escala con 1/D⁵. Duplicar el diámetro del tubing reduce las pérdidas por fricción ~32 veces.',
    tipo_regla: 'warning',
  },

  {
    id: 'colebrook',
    title: '③ Colebrook-White — Factor de fricción',
    concepto: 'El factor de fricción f no es constante: depende del Número de Reynolds (régimen de flujo) y de la rugosidad relativa de la tubería. En BES el flujo es casi siempre turbulento. La ecuación se resuelve iterativamente.',
    formula:
`1/√f = −2·log₁₀( ε/(3.7·D) + 2.51/(Re·√f) )

Re = ρ·v·D / μ

Laminar  (Re < 2300): f = 64/Re
Turbulento (Re > 4000): Colebrook-White`,
    variables: [
      { sym: 'ε',  unit: 'm',    desc: 'Rugosidad absoluta — acero comercial: 4.6×10⁻⁵ m' },
      { sym: 'Re', unit: '—',    desc: 'Número de Reynolds: ρ·v·D / μ (adimensional)' },
      { sym: 'ρ',  unit: 'kg/m³',desc: 'Densidad del fluido producido' },
      { sym: 'μ',  unit: 'Pa·s', desc: 'Viscosidad dinámica del fluido' },
    ],
    regla: 'En pozos BES Re > 10.000 siempre. La ecuación converge en menos de 5 iteraciones con Newton-Raphson.',
    tipo_regla: 'ok',
  },

  {
    id: 'ns',
    title: '④ Velocidad Específica — Tipo de impulsor',
    concepto: 'La Velocidad Específica Ns clasifica la geometría del impulsor de la bomba y define la forma de su curva H-Q. Determina si la bomba es apta para el rango de caudal y altura requerido.',
    formula:
`Ns = N × Q^0.5 / H^0.75

(N en RPM, Q en GPM, H en ft — unidades de referencia US)`,
    variables: [
      { sym: 'N',  unit: 'RPM', desc: 'Velocidad de rotación del motor (2-polo a 60 Hz: 3600 RPM)' },
      { sym: 'Q',  unit: 'GPM', desc: 'Caudal en el BEP (Best Efficiency Point)' },
      { sym: 'H',  unit: 'ft',  desc: 'Altura por etapa en el BEP' },
      { sym: 'Ns', unit: '—',   desc: 'Velocidad específica (adimensional en unidades US)' },
    ],
    extra: null, // El gráfico se inyecta desde index.jsx como sec.extra
    regla: 'La mayoría de los BES modernos operan en flujo mixto (Ns 1.500–4.500). Fuera de ese rango se requieren bombas especiales.',
    tipo_regla: 'indigo',
  },

  {
    id: 'etapas',
    title: '⑤ Número de Etapas',
    concepto: 'Cada etapa es un conjunto impulsor-difusor que agrega altura al fluido. El número de etapas necesario se calcula dividiendo el TDH requerido por la altura unitaria que entrega cada etapa en el BEP.',
    formula:
`N_etapas = ⌈ TDH_requerido / H_por_etapa_en_BEP ⌉

H_disponible = N_etapas × H_por_etapa`,
    variables: [
      { sym: 'N_etapas',      unit: '—', desc: 'Número de etapas necesarias (se redondea hacia arriba)' },
      { sym: 'TDH_requerido', unit: 'm', desc: 'Altura dinámica total que debe suministrar la bomba' },
      { sym: 'H_por_etapa',   unit: 'm', desc: 'Altura que entrega una etapa en el BEP a la frecuencia de operación' },
    ],
    regla: 'Rango típico BES: 50–200 etapas. A mayor Ns, menor H por etapa y más etapas necesarias.',
    tipo_regla: 'indigo',
  },

  {
    id: 'glosario',
    title: '⑥ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'TDH',   def: 'Total Dynamic Head — altura total que genera la bomba (m o ft)' },
      { term: 'h_f',   def: 'Head loss por fricción — pérdidas en el tubing (m)' },
      { term: 'Re',    def: 'Número de Reynolds — caracteriza el régimen de flujo' },
      { term: 'f',     def: 'Factor de fricción de Darcy — depende de Re y rugosidad' },
      { term: 'ε',     def: 'Rugosidad absoluta del tubing — acero comercial: 4.6×10⁻⁵ m' },
      { term: 'Ns',    def: 'Velocidad específica — clasifica la geometría del impulsor' },
      { term: 'v',     def: 'Velocidad media del fluido en el tubing (m/s)' },
      { term: 'BEP',   def: 'Best Efficiency Point — punto de máxima eficiencia de la bomba' },
      { term: 'H₀',    def: 'Altura de cierre (shutoff head) — a Q=0' },
      { term: 'D_in',  def: 'Diámetro interno del tubing (pulgadas)' },
    ],
  },
];
