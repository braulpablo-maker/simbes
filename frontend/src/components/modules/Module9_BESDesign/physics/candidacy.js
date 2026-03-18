/**
 * SIMBES — M9: Evaluación de candidatura BES
 * ============================================
 * Función pura. Sin side effects. Sin estado global.
 *
 * Fuente: criterios operativos estándar de la industria BES/ESP.
 * Ref: M9_BES_Design_Flow.md — PASO 1.
 */

/**
 * Evalúa si un pozo es candidato a BES dado sus parámetros y el Q resultante.
 *
 * @param {Object} inputs       - Objeto de estado del wizard (unidades UI: m³/m³, °C, m, etc.)
 * @param {number} Q_m3d        - Caudal resultante del PASO 2 (m³/d)
 * @returns {{ criterios: Array, verdict: string, sistemasAlternativos: Array }}
 *   verdict: "approved" | "conditional" | "rejected"
 */
export function evaluateBESCandidacy(inputs, Q_m3d) {
  const { D_bomba, T_fond, GOR, solidos, H2S, Dev } = inputs;

  // ── 7 criterios de candidatura ─────────────────────────────────
  const criterios = [
    {
      nombre: 'Caudal resultante',
      valor: Q_m3d.toFixed(1),
      unidad: 'm³/d',
      ...classCaudal(Q_m3d),
    },
    {
      nombre: 'Profundidad de bomba',
      valor: D_bomba,
      unidad: 'm',
      ...classProfundidad(D_bomba),
    },
    {
      nombre: 'Temperatura de fondo',
      valor: T_fond,
      unidad: '°C',
      ...classTemperatura(T_fond),
    },
    {
      nombre: 'GOR superficial',
      valor: GOR,
      unidad: 'm³/m³',
      ...classGOR(GOR),
    },
    {
      nombre: 'Contenido de sólidos',
      valor: solidos,
      unidad: '',
      ...classSolidos(solidos),
    },
    {
      nombre: 'Presencia de H₂S',
      valor: H2S ? 'Sí' : 'No',
      unidad: '',
      ...classH2S(H2S),
    },
    {
      nombre: 'Desviación del pozo',
      valor: Dev,
      unidad: '°/30m',
      ...classDesviacion(Dev),
    },
  ];

  // ── Veredicto global ───────────────────────────────────────────
  const tieneBloqueo = criterios.some(c => c.status === 'blocked');
  const tieneWarning = criterios.some(c => c.status === 'warning');
  const verdict = tieneBloqueo ? 'rejected' : tieneWarning ? 'conditional' : 'approved';

  // ── Sistemas alternativos (solo si rejected) ───────────────────
  const sistemasAlternativos = tieneBloqueo ? buildAlternatives(criterios) : [];

  return { criterios, verdict, sistemasAlternativos };
}

// ─── Clasificadores por criterio ────────────────────────────────

function classCaudal(Q) {
  if (Q >= 100) return { status: 'ok',      msg: 'Rango óptimo para BES.' };
  if (Q >= 30)  return { status: 'warning', msg: 'Caudal bajo. BES operable pero marginal. Evaluar bombeo mecánico.' };
  return         { status: 'blocked', msg: 'Caudal insuficiente para BES. Considerar PCP o bombeo mecánico.' };
}

function classProfundidad(D) {
  if (D <= 3500) return { status: 'ok',      msg: 'Profundidad dentro del rango estándar.' };
  if (D <= 4500) return { status: 'warning', msg: 'Profundidad alta. Verificar límites térmicos del motor y cable.' };
  return          { status: 'blocked', msg: 'Excede límite práctico de instalación BES convencional (>5 000 m).' };
}

function classTemperatura(T) {
  if (T < 130)  return { status: 'ok',      msg: 'Temperatura en rango estándar. Aislamiento NBR/EPDM válido.' };
  if (T <= 160) return { status: 'warning', msg: 'T° alta. Requiere aislamiento EPDM/PEEK y motor de alta temperatura.' };
  return         { status: 'blocked', msg: 'T° excesiva (>200°C). BES convencional no aplicable.' };
}

function classGOR(GOR) {
  if (GOR < 200)  return { status: 'ok',      msg: 'GOR aceptable. Sin riesgo de gas lock a frecuencia nominal.' };
  if (GOR <= 500) return { status: 'warning', msg: 'GOR elevado. Considerar separador AGS o gas handler en PASO 3.' };
  return           { status: 'blocked', msg: 'GOR crítico (>800 m³/m³). BES no candidato sin AGS/gas handler confirmado.' };
}

function classSolidos(s) {
  if (s === 'Bajo')  return { status: 'ok',      msg: 'Sin riesgo de abrasión significativo.' };
  if (s === 'Medio') return { status: 'warning', msg: 'Abrasión moderada. Recomendar impulsor con recubrimiento duro.' };
  return              { status: 'blocked', msg: 'Alta abrasión. Requiere bomba especializada (hardface) — confirmar antes de continuar.' };
}

function classH2S(h2s) {
  if (!h2s) return { status: 'ok',  msg: 'Sin H₂S. Materiales estándar aplicables.' };
  return     { status: 'warning', msg: 'H₂S presente. Requiere materiales NACE MR0175 / ISO 15156 (cable Lead Sheath + Monel 400).' };
}

function classDesviacion(dev) {
  if (dev < 60)  return { status: 'ok',      msg: 'Desviación dentro del rango estándar BES.' };
  if (dev <= 70) return { status: 'warning', msg: 'Desviación alta. Verificar centralizers y torque del cable.' };
  return          { status: 'blocked', msg: 'Desviación excesiva (>80°/30m). Riesgo mecánico crítico sin centralizers especiales.' };
}

// ─── Sistemas alternativos ───────────────────────────────────────

function buildAlternatives(criterios) {
  const alts = [];
  const c = criterios.find(x => x.nombre === 'Caudal resultante');
  const t = criterios.find(x => x.nombre === 'Temperatura de fondo');
  const g = criterios.find(x => x.nombre === 'GOR superficial');
  const s = criterios.find(x => x.nombre === 'Contenido de sólidos');

  if (c?.status === 'blocked')
    alts.push({ nombre: 'PCP (Progressing Cavity Pump)', razon: 'Ideal para bajo caudal y crudos viscosos.' });
  if (g?.status === 'blocked')
    alts.push({ nombre: 'Gas Lift', razon: 'Tolera alto GOR. Requiere fuente de gas inyectado disponible.' });
  if (t?.status === 'blocked')
    alts.push({ nombre: 'Bombeo mecánico (Rod Pump)', razon: 'Sin restricciones térmicas downhole. Aplicable en pozos someros-medios.' });
  if (s?.status === 'blocked')
    alts.push({ nombre: 'BES con impulsor hardface', razon: 'Diseñado para producción con arena. Confirmar con fabricante.' });

  if (!alts.length)
    alts.push({ nombre: 'Gas Lift / PCP', razon: 'Revisar criterios específicos del pozo con el equipo de ingeniería.' });

  return alts;
}
