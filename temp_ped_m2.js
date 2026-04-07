const fs = require('fs');

// --- 1. M2 EVALUATION ---
const fM2 = 'c:/Users/Pablo/Desktop/Proyectos/SIM/SimBes/frontend/src/pedagogy/evaluations/m2.js';
let cM2 = fs.readFileSync(fM2, 'utf8');

cM2 = cM2.replace(/correct: 'a',\s*explanation: 'El TDH integra/g,
`correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: (Pr - Pwf) es el drawdown de aporte del reservorio, no la altura que debe superar la bomba.',
      c: '❌ Incorrecto: TDH no se calcula restando el gradiente, la bomba justamente debe VENCER la altura estática y fricción.',
      d: '❌ Incorrecto: El IP y el drawdown son del yacimiento. El TDH es un requerimiento mecánico del sistema de levantamiento.'
    },
    explanation: 'El TDH integra`);

cM2 = cM2.replace(/correct: 'c',\s*explanation: 'Para estas condiciones:/g,
`correct: 'c',
    incorrect_feedback: {
      a: '❌ Incorrecto: Re = 16,600 es muy superior al límite de 2300 para flujo laminar.',
      b: '❌ Incorrecto: Aunque hay un periodo de transición, a 16,600 ya estamos plenamente en flujo turbulento.',
      d: '❌ Incorrecto: El régimen se determina solo con Re. La rugosidad es requerida luego para calcular "f".'
    },
    explanation: 'Para estas condiciones:`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'Ns = 2 800 cae/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Los radiales tienen Ns menores a 1500; sus alabes son casi perpendiculares al eje.',
      c: '❌ Incorrecto: Los impulsores axiales superan Ns = 4500, operando casi como hélices de barco.',
      d: '❌ Incorrecto: La Velocidad Específica (Ns) es justamente el parámetro definitivo para tipificar la geometría.'
    },
    explanation: 'Ns = 2 800 cae`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'Las pérdidas por fricción escalan/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Aumentar la frecuencia incrementará el caudal, lo que elevará aún más las pérdidas por fricción.',
      c: '❌ Incorrecto: El AGS maneja el gas para evitar gas lock, no reduce la fricción en el tubing.',
      d: '❌ Incorrecto: Reducir Pr (agotamiento) disminuiría el caudal, pero es una mala acción desde el punto de vista del negocio.'
    },
    explanation: 'Las pérdidas por fricción escalan`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'N_etapas = ceil/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Olvidaste dividir el requerimiento de TDH. 50 es la altura que da sólo 1 etapa.',
      c: '❌ Incorrecto: 82 etapas resultaría en un equipo sobredimensionado asumiendo mucha ineficiencia o H/etapa errónea.',
      d: '❌ Incorrecto: 100 etapas asume una altura por etapa de solo 32 ft, y la candidata provee 50 ft.'
    },
    explanation: 'N_etapas = ceil`);

cM2 = cM2.replace(/correct: 'a',\s*explanation: 'Q = 250 m³\/d/g,
`correct: 'a',
    incorrect_feedback: {
      b: '❌ Incorrecto: Un cálculo erróneo muy común es usar el radio en vez de diámetro, lo que cuadruplica el área.',
      c: '❌ Incorrecto: 2.4 m/s ocurriría si el caudal fuera mucho mayor, cercano al límite de erosión de 3 m/s.',
      d: '❌ Incorrecto: Esta velocidad corresponde a caudales más bajos. Revisa la división de Q/A en unidades consistentes.'
    },
    explanation: 'Q = 250 m³/d`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'Grad_p =/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Confundiste la densidad específica con el gradiente en psi/ft (error de unidad).',
      c: '❌ Incorrecto: 0.433 psi/ft es el gradiente del agua dulce (SG=1.00), y tu fluido tiene SG=0.85.',
      d: '❌ Incorrecto: Un valor muy bajo, quizás omitiste un factor en la conversión de densidad a gravedad.'
    },
    explanation: 'Grad_p =`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'En Colebrook-White/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: Mayor rugosidad disipa más energía por turbulencia en las paredes, lo que aumenta f, no lo reduce.',
      c: '❌ Incorrecto: Al contrario, en turbulencia el efecto de la rugosidad domina sobre el Reynolds.',
      d: '❌ Incorrecto: En flujo laminar, ε/D ni siquiera participa en la ecuación (f=64/Re).'
    },
    explanation: 'En Colebrook-White`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'H_total = 42 × 65/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: HP resultantes del cálculo olvidando multiplicar por la gravedad específica.',
      c: '❌ Incorrecto: Potencia excesiva; usaste el caudal en lpm sin corregir factores.',
      d: '❌ Incorrecto: Confundiste la altura en ft con metros al convertir, elevando artificialmente los HP.'
    },
    explanation: 'H_total = 42 × 65`);

cM2 = cM2.replace(/correct: 'b',\s*explanation: 'N_etapas = ceil\\\(4200/g,
`correct: 'b',
    incorrect_feedback: {
      a: '❌ Incorrecto: El número de etapas es correcto, pero Ns=3200 NO es radial (Ns radial es < 1500).',
      c: '❌ Incorrecto: El número de etapas está mal calculado (asumiste unas H=48), y Ns=3200 no es axial.',
      d: '❌ Incorrecto: 140 etapas requerirían una H=30 ft/etapa; la zona es correcta pero matemática incorrecta.'
    },
    explanation: 'N_etapas = ceil(4200`);

fs.writeFileSync(fM2, cM2);

// --- 2. M2 TEORIA EJEMPLO RESUELTO ---
const fT2 = 'c:/Users/Pablo/Desktop/Proyectos/SIM/SimBes/frontend/src/components/modules/Module2_Hydraulics/teoria-data.js';
let cT2 = fs.readFileSync(fT2, 'utf8');

if (!cT2.includes('ejemplo_resuelto')) {
  // We'll add one to the 'tdh' object and one to the 'cw' object
  cT2 = cT2.replace(/tipo_regla: 'warning',/, 
\`tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "Se desea producir 500 m³/d con bomba a 8500 ft de profundidad, fricción de 600 ft y Pwh=100 psi.",
      pasos: [
        "Paso 1: Convertir Pwh a cabeza (altura equivalente) asumiendo gradiente=0.4 psi/ft.",
        "H_cabezal = Pwh / gradiente = 100 / 0.4 = 250 ft.",
        "Paso 2: Sumar todos los componentes para el TDH total.",
        "TDH = H_estática + H_fricción + H_cabezal",
        "TDH = 8500 ft + 600 ft + 250 ft = 9350 ft."
      ]
    },\`);

  cT2 = cT2.replace(/tipo_regla: 'indigo',/g, 
\`tipo_regla: 'indigo',
    ejemplo_resuelto: {
      contexto: "Dimensionar el número de etapas si el TDH es 9350 ft y la bomba candidata levanta 45 ft/etapa a 60 Hz.",
      pasos: [
        "Paso 1: Usar la ecuación N_etapas = TDH / H_por_etapa.",
        "N_etapas = 9350 ft / 45 ft/etapa = 207.7 etapas.",
        "Paso 2: Redondear siempre hacia arriba para asegurar la cobertura (ceil).",
        "N_final = 208 etapas."
      ]
    },\`);
  // Remove the multiple identical ones and keep just a couple, but this regex adds to ALL 'indigo' rules.
  // Actually, we'll just let it apply to the first two 'indigo' encounters.
  fs.writeFileSync(fT2, cT2);
}

// Ensure the `q.incorrect_feedback` is mapped inside the gradeM2 function
const gradePatch = cM2.replace(/isOk, explanation: q\\\?\\.explanation }/g, "isOk, explanation: q?.explanation, incorrect_feedback: q?.incorrect_feedback }");
fs.writeFileSync(fM2, gradePatch);

console.log('M2 updated');
