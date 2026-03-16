/**
 * SIMBES — Motor Eléctrico (Cable, VSD, Arrhenius, THD)
 * =======================================================
 * @ref IEEE 519-2014 — Harmonic Control in Electric Power Systems
 * @ref NACE MR0175 / ISO 15156
 * @ref Arrhenius (1889) — Regla de los 10°C
 * @ref ABB Technical Note 060
 */

// ─── Resistencia de cable (Ω/1000 ft, cobre, 20°C) ──────────────
const CABLE_R_OHM_PER_1000FT = {
  1: 0.1239, 2: 0.1563, 4: 0.2485,
  6: 0.3951, 8: 0.6282, 10: 0.9989,
  12: 1.588, 14: 2.525,
};

/**
 * Resistencia total del cable corregida por temperatura.
 * R_T = R_20 × (1 + α × (T_avg − 20))
 *
 * @param {number} awg
 * @param {number} length_ft
 * @param {number} T_bottomhole_C
 * @param {number} [T_surface_C=20]
 * @returns {{ R_base_ohm, R_corrected_ohm, T_avg_C }}
 */
export function cableResistance(awg, length_ft, T_bottomhole_C, T_surface_C = 20) {
  const r_per_1000 = CABLE_R_OHM_PER_1000FT[awg];
  if (!r_per_1000) throw new Error(`AWG ${awg} no disponible`);
  const R_base  = r_per_1000 * length_ft / 1000;
  const T_avg   = (T_bottomhole_C + T_surface_C) / 2;
  const alpha   = 0.00393; // cobre /°C
  const R_T     = R_base * (1 + alpha * (T_avg - 20));
  return {
    R_base_ohm:      +R_base.toFixed(4),
    R_corrected_ohm: +R_T.toFixed(4),
    T_avg_C:         +T_avg.toFixed(1),
  };
}

/**
 * Caída de voltaje en cable (trifásico).
 * V_drop = I × R_T × 3
 *
 * @param {number} awg
 * @param {number} length_ft
 * @param {number} I_amps
 * @param {number} T_bottomhole_C
 * @param {number} [T_surface_C=20]
 * @returns {{ V_drop_V, pct_drop, warning_5pct, danger_10pct }}
 */
export function cableVoltageDrop(awg, length_ft, I_amps, T_bottomhole_C, T_surface_C = 20) {
  const { R_corrected_ohm, T_avg_C } = cableResistance(awg, length_ft, T_bottomhole_C, T_surface_C);
  const V_drop   = I_amps * R_corrected_ohm * 3; // 3 conductores
  const pct_drop = (V_drop / 1000) * 100; // ref 1000 V [SIMPLIFIED]
  return {
    V_drop_V:        +V_drop.toFixed(1),
    pct_drop:        +pct_drop.toFixed(2),
    R_corrected_ohm,
    T_avg_C,
    warning_5pct:    pct_drop > 5,
    danger_10pct:    pct_drop > 10,
  };
}

// ─── Arrhenius — Degradación de aislamiento ──────────────────────

/**
 * Factor de vida útil del aislamiento por exceso de temperatura.
 * τ₂/τ₁ = 2^((T₁ − T₂) / 10)   — Regla de los 10°C
 *
 * @param {number} T_operating_C
 * @param {number} T_rated_C
 * @returns {{ life_factor, pct_life_remaining, delta_T_C, warning }}
 */
export function arrheniusLifeFactor(T_operating_C, T_rated_C) {
  const delta_T = T_operating_C - T_rated_C;
  if (delta_T <= 0) {
    return { life_factor: 1.0, pct_life_remaining: 100.0, delta_T_C: 0, warning: false,
      message: 'Temperatura dentro del límite nominal.' };
  }
  const life_factor     = Math.pow(2, -delta_T / 10);
  const pct_remaining   = life_factor * 100;
  return {
    life_factor:         +life_factor.toFixed(4),
    pct_life_remaining:  +pct_remaining.toFixed(1),
    delta_T_C:           +delta_T.toFixed(1),
    warning:             true,
    message: `${delta_T.toFixed(1)}°C sobre límite. Vida útil reducida al ${pct_remaining.toFixed(1)}%.`,
  };
}

// ─── THD — Distorsión Armónica Total ─────────────────────────────

const VSD_THD = {
  standard_6pulse: { THD_pct: 30.0, desc: 'VSD estándar 6 pulsos' },
  '12pulse':       { THD_pct: 17.5, desc: 'Multipulso 12 pulsos'  },
  '18pulse':       { THD_pct:  4.0, desc: 'Multipulso 18 pulsos'  },
  afe:             { THD_pct:  2.5, desc: 'Active Front End (AFE)' },
  active_filter:   { THD_pct:  1.5, desc: 'Filtro Activo'         },
};

const IEEE519_LIMIT = 5.0; // % THDv máximo en PCC

/**
 * THD estimado por topología de VSD.
 * [SIMPLIFIED: valores representativos de industria — ABB TN060]
 *
 * @param {string} topology - clave de topología VSD
 * @returns {{ THD_pct, complies_ieee519, topology_desc }}
 */
export function thdEstimate(topology) {
  const entry = VSD_THD[topology];
  if (!entry) throw new Error(`Topología '${topology}' no reconocida`);
  const complies = entry.THD_pct < IEEE519_LIMIT;
  return {
    THD_pct:          entry.THD_pct,
    complies_ieee519: complies,
    limit_pct:        IEEE519_LIMIT,
    topology,
    topology_desc:    entry.desc,
    recommendation:   complies ? '' :
      topology === 'standard_6pulse'
        ? 'Considerar 12/18 pulsos o AFE para cumplir IEEE 519-2014.'
        : 'THD marginal. Evaluar 18 pulsos o AFE para zonas sensibles.',
  };
}

export { VSD_THD, IEEE519_LIMIT };

// ─── Selección de materiales (NACE MR0175) ───────────────────────

/**
 * Recomienda materiales según condiciones del pozo.
 * @ref NACE MR0175 / ISO 15156
 */
export function materialRecommendation(T_C, H2S_present, solvent_injection = false) {
  let elastomer    = 'NBR (Nitrile)';
  let cable_jacket = 'EPDM estándar';
  const warnings   = [];

  if (T_C > 140) {
    elastomer    = 'EPDM o PEEK (NBR NO apto sobre 140°C)';
    cable_jacket = 'PEEK o EPDM alta temperatura';
    warnings.push(`T = ${T_C}°C excede límite de NBR (140°C).`);
  }
  if (solvent_injection) {
    elastomer = 'PEEK';
    warnings.push('Inyección de solventes: PEEK mandatorio.');
  }
  if (H2S_present) {
    cable_jacket = 'Lead Sheath + blindaje Monel 400';
    warnings.push('H₂S presente: riesgo SSC. Requerido Lead Sheath (NACE MR0175).');
  }

  return {
    elastomer_recommendation: elastomer,
    cable_jacket,
    warnings,
    compliant: warnings.length === 0,
  };
}
