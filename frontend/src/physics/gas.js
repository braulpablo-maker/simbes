/**
 * SIMBES — Motor Gas y Flujo Multifásico
 * ========================================
 * @ref SPE Brazil FATC 2022 — Gas-liquid separation in ESP
 * @ref Standing (1977) — Volumetric and Phase Behavior
 * @ref Hydraulic Institute — Viscosity correction factors
 */

// ─── GVF en succión ──────────────────────────────────────────────

/**
 * Gas Volume Fraction (GVF) en la succión de la bomba.
 *
 * Para Ps ≥ Pb: GVF = 0 (todo el gas disuelto).
 * Para Ps < Pb: gas libre proporcional al GOR liberado.
 *
 * [SIMPLIFIED: Bg por gas ideal; Standing simplificado para Rs]
 *
 * @param {number} GOR_scf_stb  - Gas-Oil Ratio superficial (scf/STB)
 * @param {number} Pb_psi       - Presión de burbuja (psi)
 * @param {number} Ps_psi       - Presión en succión de la bomba (psi)
 * @param {number} [T_F=200]    - Temperatura de fondo (°F)
 * @returns {{ GVF, GVF_pct, gas_lock_risk, message }}
 */
export function gasVolumeFraction(GOR_scf_stb, Pb_psi, Ps_psi, T_F = 200) {
  if (Ps_psi >= Pb_psi) {
    return { GVF: 0, GVF_pct: 0, free_GOR: 0, gas_lock_risk: 'none',
      message: 'Ps ≥ Pb: todo el gas permanece disuelto.' };
  }
  // Rs simplificado (Standing)
  const rs_at_suction = GOR_scf_stb * (Ps_psi / Pb_psi);
  const free_GOR      = Math.max(0, GOR_scf_stb - rs_at_suction);

  // Bg: gas ideal [SIMPLIFIED]
  const T_R  = T_F + 459.67;
  const z    = 0.9;
  const Bg   = 0.02829 * z * T_R / Ps_psi; // ft³/scf

  const Qgas  = free_GOR * Bg;
  const Qliq  = 5.615;  // ft³/STB
  const GVF   = Math.min(1, Math.max(0, Qgas / (Qgas + Qliq)));
  const GVF_pct = GVF * 100;

  let gas_lock_risk, message;
  if (GVF < 0.10) {
    gas_lock_risk = 'none';
    message = `GVF = ${GVF_pct.toFixed(1)}%. Operación segura.`;
  } else if (GVF < 0.15) {
    gas_lock_risk = 'warning';
    message = `GVF = ${GVF_pct.toFixed(1)}%. Aproximándose al umbral de gas lock. Evaluar AGS.`;
  } else {
    gas_lock_risk = 'danger';
    message = `GVF = ${GVF_pct.toFixed(1)}% supera el umbral de gas lock (15%). Instalar separador.`;
  }

  return { GVF: +GVF.toFixed(4), GVF_pct: +GVF_pct.toFixed(2), free_GOR, gas_lock_risk, message };
}

// ─── Degradación H-Q por gas ─────────────────────────────────────

/**
 * Factor de degradación de la curva H-Q por GVF.
 * [SIMPLIFIED: lineal segmentado — datos empíricos fabricantes]
 *
 * @param {number} GVF - Gas Volume Fraction (0–1)
 * @returns {{ head_factor, flow_factor, eff_factor, severity }}
 */
export function hqGasDegradation(GVF) {
  GVF = Math.max(0, Math.min(1, GVF));
  let head_f, flow_f, eff_f, severity;

  if (GVF <= 0.05) {
    head_f = 1.0; flow_f = 1.0; eff_f = 1.0; severity = 'none';
  } else if (GVF <= 0.10) {
    const t = (GVF - 0.05) / 0.05;
    head_f = 1.0 - 0.10 * t; flow_f = 1.0 - 0.05 * t; eff_f = 1.0 - 0.12 * t;
    severity = 'mild';
  } else if (GVF <= 0.15) {
    const t = (GVF - 0.10) / 0.05;
    head_f = 0.90 - 0.20 * t; flow_f = 0.95 - 0.10 * t; eff_f = 0.88 - 0.18 * t;
    severity = 'moderate';
  } else {
    const t = Math.min(1, (GVF - 0.15) / 0.10);
    head_f = Math.max(0, 0.70 - 0.50 * t);
    flow_f = Math.max(0, 0.85 - 0.35 * t);
    eff_f  = Math.max(0, 0.70 - 0.40 * t);
    severity = 'severe';
  }

  return {
    head_factor: +head_f.toFixed(3),
    flow_factor: +flow_f.toFixed(3),
    eff_factor:  +eff_f.toFixed(3),
    GVF_pct:     +(GVF * 100).toFixed(1),
    severity,
  };
}

// ─── Corrección de viscosidad (Hydraulic Institute) ──────────────

/**
 * Factores de corrección de la curva H-Q por viscosidad del fluido.
 * Basado en el método del Hydraulic Institute (ANSI/HI 9.6.7).
 *
 * Número de viscosidad B = Q_bep^0.5 × H_bep^0.25 / ν^0.5
 *
 * CQ < 1 → BEP se desplaza a menor caudal
 * CH < 1 → Altura se reduce
 * CE < 1 → Eficiencia se reduce
 *
 * [SIMPLIFIED: ajuste algebraico de curvas HI; para μ > 500 cp usar tablas completas]
 *
 * @ref Hydraulic Institute ANSI/HI 9.6.7
 * @param {number} mu_cP       - Viscosidad dinámica del fluido (cP)
 * @param {number} [Q_bep_gpm=61.25] - Caudal BEP en agua (gpm)
 * @param {number} [H_bep_ft=32.5]   - Altura BEP por etapa en agua (ft)
 * @returns {{ CQ, CH, CE, B, severity }}
 */
export function hiViscosityCorrection(mu_cP, Q_bep_gpm = 61.25, H_bep_ft = 32.5) {
  if (mu_cP <= 1.0) return { CQ: 1.0, CH: 1.0, CE: 1.0, B: 999, severity: 'none' };

  const nu_cSt = mu_cP;  // ≈ cSt para densidades cercanas al agua [SIMPLIFIED]
  const B = Math.sqrt(Q_bep_gpm) * Math.pow(H_bep_ft, 0.25) / Math.sqrt(nu_cSt);

  let CQ, CH, CE, severity;
  if (B >= 40) {
    CQ = 1.0; CH = 1.0; CE = 1.0; severity = 'none';
  } else if (B >= 10) {
    const t = (B - 10) / 30;
    CQ = 0.85 + 0.15 * t;
    CH = 0.92 + 0.08 * t;
    CE = 0.60 + 0.40 * t;
    severity = 'mild';
  } else {
    CQ = Math.max(0.40, 0.85 * (B / 10));
    CH = Math.max(0.50, 0.92 * (B / 10));
    CE = Math.max(0.20, 0.60 * (B / 10));
    severity = 'severe';
  }
  return {
    CQ: +CQ.toFixed(3), CH: +CH.toFixed(3), CE: +CE.toFixed(3),
    B:  +B.toFixed(1),  severity,
  };
}

// ─── Separadores de gas ──────────────────────────────────────────

const SEPARATORS = {
  none:        { name: 'Sin separador',       eff: 0.00 },
  ags_passive: { name: 'AGS Pasivo (Rotary)', eff: 0.65 },
  gas_handler: { name: 'Gas Handler Activo',  eff: 0.82 },
};

/**
 * Eficiencia de separación y GVF residual en bomba.
 * [SIMPLIFIED: eficiencias representativas de industria]
 *
 * @param {number} GVF_intake     - GVF en entrada (0–1)
 * @param {string} separatorType  - 'none' | 'ags_passive' | 'gas_handler'
 * @returns {{ GVF_pump_pct, head_factor, gas_lock_risk, recommendation }}
 */
export function gasSeparatorEfficiency(GVF_intake, separatorType = 'ags_passive') {
  const sep    = SEPARATORS[separatorType] || SEPARATORS.none;
  const GVF_pump = Math.max(0, GVF_intake * (1 - sep.eff));
  const deg    = hqGasDegradation(GVF_pump);

  const risk = GVF_pump > 0.15 ? 'danger' : GVF_pump > 0.10 ? 'warning' : 'none';
  const recommendation = risk === 'danger'
    ? 'Gas lock inminente. Reducir GOR o aumentar velocidad del separador.'
    : risk === 'warning'
    ? 'Operación marginal. Monitorear vibración y corriente.'
    : 'Separación efectiva. GVF en bomba dentro de límites seguros.';

  return {
    separator_name:  sep.name,
    separation_eff:  sep.eff,
    GVF_intake_pct:  +(GVF_intake * 100).toFixed(1),
    GVF_pump_pct:    +(GVF_pump * 100).toFixed(1),
    head_factor:     deg.head_factor,
    gas_lock_risk:   risk,
    recommendation,
  };
}
