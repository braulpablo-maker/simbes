const fs = require('fs');
const filepath = 'c:/Users/Pablo/Desktop/Proyectos/SIM/SimBes/frontend/src/pedagogy/evaluations/m1.js';
let content = fs.readFileSync(filepath, 'utf8');

const q1 = content.replace(/correct: 'b',\s*explanation: 'Cuando Pwf ≥ Pb/g, 
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Al ser Pwf > Pb no existe gas libre, ya que la presión supera la de burbujeo.',
        c: '❌ Incorrecto: Fetkovich se usa principalmente en gas o casos particulares, no está ligado a BES en sí.',
        d: '❌ Incorrecto: El modelo compuesto solo aplica si Pwf < Pb.'
      },
      explanation: 'Cuando Pwf ≥ Pb`);

const q2 = q1.replace(/correct: 'c',\s*explanation: 'Por las Leyes/g,
`correct: 'c',
      incorrect_feedback: {
        a: '❌ Incorrecto: Las leyes de afinidad dictan que Q aumenta proporcional a la frecuencia.',
        b: '❌ Incorrecto: La bomba trabajará más fuerte para entregar más caudal y más cabeza (altura), no menos caudal.',
        d: '❌ Incorrecto: El yacimiento controla la IPR, pero la bomba genera la VLP; al moverse la VLP, cambia el punto de operación.'
      },
      explanation: 'Por las Leyes`);

const q3 = q2.replace(/correct: 'b',\s*explanation: 'Si Pr = Pb/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Calculaste AOF = IP × Pr lo cual es erróneo porque Pr=Pb implica Vogel al 100%.',
        c: '❌ Incorrecto: La fórmula del AOF para yacimientos saturados es (IP × Pb) / 1.8.',
        d: '❌ Incorrecto: El valor de (IP × Pb) / 1.8 no da este resultado.'
      },
      explanation: 'Si Pr = Pb`);

const q4 = q3.replace(/correct: 'b',\s*explanation: 'Operar sobre el 110/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: La recirculación interna ocurre cuando el caudal está muy *por debajo* del BEP (ej. < 60%).',
        c: '❌ Incorrecto: El gas lock depende del gas libre y GVF, no del caudal relativo al BEP en sí mismo.',
        d: '❌ Incorrecto: El 120% del BEP está fuera de la zona óptima de la bomba (generalmente 70-110%).'
      },
      explanation: 'Operar sobre el 110`);

const q5 = q4.replace(/correct: 'b',\s*explanation: 'Un drawdown > 82%/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Subir la frecuencia aumentaría la producción pero hundiría la Pwf más, agravando el riesgo.',
        c: '❌ Incorrecto: Un AGS no soluciona el problema de fondo que es la sobre-explotación del yacimiento.',
        d: '❌ Incorrecto: Aumentar el tubing puede cambiar la fricción, pero no aborda el exceso de potencia de bombeo aplicado.'
      },
      explanation: 'Un drawdown > 82%`);

const q6 = q5.replace(/correct: 'b',\s*explanation: 'Cuando Pr = Pb/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Aunque Qb es 0 y el AOF final numérico sea igual, teóricamente no se expresa de esta forma parcial.',
        c: '❌ Incorrecto: El caudal de burbuja es nulo; Pwf solo puede decrecer por debajo de Pb.',
        d: '❌ Incorrecto: Revisa la fórmula del AOF para el modelo de Vogel en yacimientos saturados.'
      },
      explanation: 'Cuando Pr = Pb`);

const q7 = q6.replace(/correct: 'b',\s*explanation: 'El modelo compuesto/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El modelo fue diseñado precisamente para evitar una discontinuidad.',
        c: '❌ Incorrecto: La curva no se vuelve vertical; solo reduce su aporte de caudal (se aplana).',
        d: '❌ Incorrecto: Vogel no puede modelar la región lineal por encima del punto de burbuja.'
      },
      explanation: 'El modelo compuesto`);

const q8 = q7.replace(/correct: 'b',\s*explanation: 'Leyes de Afinidad:/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: Calculaste la altura linealmente (como el caudal), pero la altura varía con el *cuadrado* de la relación.',
        c: '❌ Incorrecto: El caudal debe aumentar con la frecuencia.',
        d: '❌ Incorrecto: Calculaste todo incorrectamente; revisa (60/50) * Q1.'
      },
      explanation: 'Leyes de Afinidad:`);

const q9 = q8.replace(/correct: 'b',\s*explanation: 'Operar por debajo/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El surging cavita en la descarga de la bomba operando muy a la *derecha* del BEP, no a la izquierda.',
        c: '❌ Incorrecto: Operar a bajo caudal no disminuye la presión de entrada (Pwf), de hecho comúnmente la *aumenta*.',
        d: '❌ Incorrecto: 70% del BEP está en el umbral de recirculación que causa daño mecánico a mediano plazo.'
      },
      explanation: 'Operar por debajo`);

const q10 = q9.replace(/correct: 'b',\s*explanation: 'El skin positivo/g,
`correct: 'b',
      incorrect_feedback: {
        a: '❌ Incorrecto: El skin no es algo físico en superficie, está en el downhole; el IP mejorará (aumentando Q).',
        c: '❌ Incorrecto: Reducir el daño de formación no reduce la presión de reservorio; favorece el flujo.',
        d: '❌ Incorrecto: Calcular el doble exacto es fortuito; el cambio real depende matemáticamente del factor de daño.'
      },
      explanation: 'El skin positivo`);

fs.writeFileSync(filepath, q10);
console.log('M1 updated seamlessly');
