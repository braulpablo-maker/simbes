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
    explanation:
      'El AFE (THD < 3%) cumple IEEE 519 — buena decisión. El cable #4 (más grueso que #8) reduce la resistencia y la caída de voltaje — también correcto. Pero aumentar a 65 Hz sin evaluar el impacto en el GVF es un error. Mayor frecuencia → mayor caudal → mayor drawdown → Pwf más bajo → posiblemente Pwf < Pb → GVF sube → H-Q se degrada → el beneficio del VSD se cancela. El diseño integrado requiere evaluar todos los módulos en conjunto: la mejora eléctrica (M4) no puede analizarse aislada del impacto en la presión de succión (M3) y el punto de operación (M1). Esa integración es el propósito central del Constructor de Escenarios.',
  },
];

export function gradeM8(answers) {
  const total = M8_QUESTIONS.length;
  let correct = 0;
  const results = answers.map(({ id, selected }) => {
    const q    = M8_QUESTIONS.find(q => q.id === id);
    const isOk = q && selected === q.correct;
    if (isOk) correct++;
    return { id, selected, correct: q?.correct, isOk, explanation: q?.explanation };
  });
  return { score: correct, total, pct: Math.round((correct / total) * 100), results };
}
