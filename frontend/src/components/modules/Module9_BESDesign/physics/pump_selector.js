/**
 * SIMBES — M9: Selección de serie de bomba y optimización de frecuencia
 * =======================================================================
 * Selecciona la serie BES más adecuada y calcula la frecuencia óptima de operación.
 *
 * @ref ANSI/HI 1.3 — Affinity Laws
 */

const STB_TO_M3 = 0.158987;
const M3_TO_STB = 6.28981;
const FT_TO_M   = 0.3048;

/**
 * Selecciona la serie de bomba más adecuada para el caudal dado.
 * Calcula BEP ratio a 60 Hz y frecuencia óptima para cada candidato.
 *
 * @param {number} Q_total_m3d  - Caudal real en la bomba (m³/d)
 * @param {Array}  catalog      - Array de series de pump-series.json
 * @param {number} f_red        - Frecuencia de red (Hz)
 * @param {number} [OD_max_in]  - Restricción máxima de OD (pulg) — de CICLO E
 * @returns {Array} candidatos ordenados por cercanía al BEP
 */
export function selectPumpSeries(Q_total_m3d, catalog, f_red = 60, OD_max_in = Infinity) {
  const Q_stbd = Q_total_m3d * M3_TO_STB;

  return catalog
    .filter(s => !OD_max_in || s.OD_in <= OD_max_in)
    .map(serie => {
      const bep_ratio_60hz = Q_stbd / serie.BEP_stbd;

      // Frecuencia óptima: f tal que Q_bep(f) = Q_total
      // Q_bep(f) = Q_bep_60Hz × (f/60) → f = 60 × Q_total_stbd / Q_bep_60Hz
      const f_opt = Math.min(72, Math.max(40, f_red * Q_stbd / serie.BEP_stbd));

      // BEP ratio a frecuencia óptima
      const Q_bep_at_fopt = serie.BEP_stbd * (f_opt / 60);
      const bep_ratio_fopt = Q_stbd / Q_bep_at_fopt;

      // Etapas a frecuencia óptima (requiere TDH externo — devuelve función)
      const status = bep_ratio_60hz >= 0.70 && bep_ratio_60hz <= 1.30 ? 'ok'
                   : bep_ratio_fopt >= 0.70 && bep_ratio_fopt <= 1.30  ? 'ajustable'
                   : 'fuera_de_rango';

      return {
        ...serie,
        bep_ratio_60hz:  +bep_ratio_60hz.toFixed(3),
        f_opt:           +f_opt.toFixed(1),
        bep_ratio_fopt:  +bep_ratio_fopt.toFixed(3),
        status,
      };
    })
    .sort((a, b) => Math.abs(1 - a.bep_ratio_fopt) - Math.abs(1 - b.bep_ratio_fopt));
}

/**
 * Calcula etapas requeridas dado TDH y serie seleccionada a una frecuencia dada.
 *
 * @param {number} TDH_m        - TDH requerido (m)
 * @param {object} serie        - Serie seleccionada de pump-series.json
 * @param {number} f_op         - Frecuencia operativa (Hz)
 * @returns {{ etapas, H_stage_m, TDH_disponible_m }}
 */
export function calcStages(TDH_m, serie, f_op) {
  // Altura por etapa en BEP escalada por leyes de afinidad
  const H_stage_bep_ft = serie.H_stage_bep_ft;
  const H_stage_m_60hz = H_stage_bep_ft * FT_TO_M;
  const H_stage_m_fop  = H_stage_m_60hz * (f_op / 60) ** 2;

  const etapas = Math.ceil(TDH_m / H_stage_m_fop);
  const TDH_disponible_m = etapas * H_stage_m_fop;

  return {
    etapas,
    H_stage_m: +H_stage_m_fop.toFixed(2),
    TDH_disponible_m: +TDH_disponible_m.toFixed(1),
  };
}

/**
 * Verifica si el BEP ratio está dentro del rango aceptable (70–130%).
 *
 * @param {number} Q_total_m3d
 * @param {object} serie
 * @param {number} f_op
 * @returns {{ bep_ratio, status, msg }}
 */
export function checkBEPRatio(Q_total_m3d, serie, f_op) {
  const Q_stbd      = Q_total_m3d * M3_TO_STB;
  const Q_bep_at_f  = serie.BEP_stbd * (f_op / 60);
  const bep_ratio   = Q_stbd / Q_bep_at_f;
  const bep_pct     = bep_ratio * 100;

  let status, msg;
  if (bep_pct < 70) {
    status = 'blocked';
    msg = `Q = ${bep_pct.toFixed(0)}% del BEP — recirculación severa. Cambiar a serie de menor caudal o reducir frecuencia.`;
  } else if (bep_pct < 80) {
    status = 'warning';
    msg = `Q = ${bep_pct.toFixed(0)}% del BEP — zona baja de eficiencia. Evaluar ajuste de frecuencia.`;
  } else if (bep_pct <= 120) {
    status = 'ok';
    msg = `Q = ${bep_pct.toFixed(0)}% del BEP — operación óptima.`;
  } else if (bep_pct <= 130) {
    status = 'warning';
    msg = `Q = ${bep_pct.toFixed(0)}% del BEP — zona alta de eficiencia. Riesgo de surging si aumenta Q.`;
  } else {
    status = 'blocked';
    msg = `Q = ${bep_pct.toFixed(0)}% del BEP — surging. Cambiar a serie de mayor caudal o aumentar frecuencia.`;
  }

  return { bep_ratio: +bep_ratio.toFixed(3), bep_pct: +bep_pct.toFixed(1), status, msg };
}
