/**
 * SIMBES — M9: Verificación mecánica del string BES
 * ===================================================
 * Verifica que el conjunto de equipos BES cabe dentro del casing
 * y que la desviación del pozo es admisible.
 *
 * Física nueva exclusiva de M9 (no tiene equivalente en M1–M8).
 */

// ─── OD de cable por AWG (externo, flat cable) ───────────────────
// [SIMPLIFIED: diámetros representativos de cable plano BES]
const CABLE_OD_BY_AWG = {
  1:  1.30, 2:  1.20, 4:  1.05,
  6:  0.90, 8:  0.80, 10: 0.70,
  12: 0.60, 14: 0.55,
};

// Radio mínimo de curvatura por AWG (pulgadas) — [SIMPLIFIED]
const CABLE_BEND_RADIUS_BY_AWG = {
  1: 18, 2: 16, 4: 14, 6: 12, 8: 10, 10: 8, 12: 7, 14: 6,
};

/**
 * Obtiene el OD del cable por AWG.
 * @param {number} awg
 * @returns {number} OD en pulgadas
 */
export function cableOD(awg) {
  return CABLE_OD_BY_AWG[awg] ?? 1.0;
}

/**
 * Calcula el OD máximo del string BES (componente más ancho).
 *
 * @param {Array<{ nombre: string, OD_in: number, aplica: boolean }>} componentes
 * @returns {number} OD máximo en pulgadas
 */
export function calcMaxODString(componentes) {
  const activos = componentes.filter(c => c.aplica);
  if (!activos.length) return 0;
  return Math.max(...activos.map(c => c.OD_in));
}

/**
 * Calcula la holgura entre el OD del string y el ID del casing.
 *
 * holgura = (ID_cas - OD_string) / 2   [en pulgadas, luego a mm]
 *
 * @param {number} ID_cas_in   - ID del casing (drift) en pulgadas
 * @param {number} OD_string_in - OD máximo del string en pulgadas
 * @returns {{ holgura_in, holgura_mm, cabe }}
 */
export function calcClearance(ID_cas_in, OD_string_in) {
  const holgura_in = (ID_cas_in - OD_string_in) / 2;
  const holgura_mm = holgura_in * 25.4;
  return {
    holgura_in: +holgura_in.toFixed(3),
    holgura_mm: +holgura_mm.toFixed(1),
    cabe: holgura_mm >= 6,  // mínimo 6 mm de holgura por lado
  };
}

/**
 * Verifica si la desviación del pozo es admisible para el AWG del cable.
 *
 * dogleg_admisible = atan(R_min_in / (30 m × 39.37 in/m)) × 180/π  [°/30m]
 * [SIMPLIFIED]
 *
 * @param {number} Dev_deg_per_30m - Dogleg severity (°/30m)
 * @param {number} awg
 * @returns {{ dogleg_admisible, cumple, msg }}
 */
export function doglegCheck(Dev_deg_per_30m, awg) {
  const R_min_in      = CABLE_BEND_RADIUS_BY_AWG[awg] ?? 14;
  const length_in     = 30 * 39.37; // 30 m en pulgadas
  const dogleg_adm    = Math.atan(R_min_in / length_in) * (180 / Math.PI);
  const cumple        = Dev_deg_per_30m <= dogleg_adm;

  return {
    dogleg_admisible: +dogleg_adm.toFixed(2),
    cumple,
    msg: cumple
      ? `Dogleg ${Dev_deg_per_30m}°/30m ≤ límite ${dogleg_adm.toFixed(2)}°/30m para AWG ${awg}. OK.`
      : `Dogleg ${Dev_deg_per_30m}°/30m excede el límite ${dogleg_adm.toFixed(2)}°/30m para AWG ${awg}. Considerar cable de mayor sección (menor AWG) o centralizers.`,
  };
}

/**
 * Evaluación final de la verificación mecánica.
 *
 * @param {number} holgura_mm
 * @param {boolean} dogleg_ok
 * @returns {{ status: 'ok'|'conditional'|'blocked', msg: string }}
 */
export function clearanceDecision(holgura_mm, dogleg_ok) {
  if (holgura_mm < 0) {
    return { status: 'blocked', msg: `El string NO cabe en el casing. OD excede el drift por ${Math.abs(holgura_mm).toFixed(1)} mm × lado. Reducir serie o motor (CICLO E).` };
  }
  if (holgura_mm < 6) {
    return { status: 'blocked', msg: `Holgura insuficiente (${holgura_mm.toFixed(1)} mm < 6 mm mínimo). Riesgo de atasco durante bajada. CICLO E obligatorio.` };
  }
  if (!dogleg_ok) {
    return { status: 'conditional', msg: `Holgura OK (${holgura_mm.toFixed(1)} mm) pero dogleg excede límite del cable. Revisar tipo de cable o agregar centralizers.` };
  }
  if (holgura_mm < 12) {
    return { status: 'conditional', msg: `Holgura ajustada (${holgura_mm.toFixed(1)} mm). Admisible pero sin margen. Verificar condición del casing.` };
  }
  return { status: 'ok', msg: `Holgura ${holgura_mm.toFixed(1)} mm — clearance adecuado. String compatible con casing y desviación del pozo.` };
}
