/**
 * SIMBES — Motor Confiabilidad y MTBF
 * =====================================
 * @ref Nelson (1982) — Applied Life Data Analysis
 * @ref Meeker & Escobar (1998) — Statistical Methods for Reliability Data
 * @ref API RP 11S1
 */

// ─── Probabilidad de supervivencia ──────────────────────────────

/**
 * R(t) = e^(−t / MTBF)
 * Resultado fundamental: R(MTBF) = e⁻¹ ≈ 36.77%
 *
 * @param {number} t_days
 * @param {number} MTBF_days
 * @returns {number} R(t) ∈ [0, 1]
 */
export function survivalProb(t_days, MTBF_days) {
  return Math.exp(-t_days / MTBF_days);
}

/**
 * Genera curva de supervivencia para visualización.
 *
 * @param {number} MTBF_days
 * @param {number} [nPoints=200]
 * @returns {{ points: Array<{t, R}>, R_at_MTBF, t_50pct, t_10pct }}
 */
export function survivalCurve(MTBF_days, nPoints = 200) {
  const t_max  = 2 * MTBF_days;
  const points = [];
  for (let i = 0; i <= nPoints; i++) {
    const t = (t_max * i) / nPoints;
    points.push({ t, R: survivalProb(t, MTBF_days) });
  }
  return {
    points,
    MTBF_days,
    R_at_MTBF: Math.exp(-1),                          // ≈ 0.3679
    t_50pct:   +(-MTBF_days * Math.log(0.50)).toFixed(1),
    t_10pct:   +(-MTBF_days * Math.log(0.10)).toFixed(1),
  };
}

// ─── MTBF MLE con datos censurados ───────────────────────────────

/**
 * MTBF_MLE = T_total / r
 * T_total = Σ t_fallas + Σ t_censurados
 *
 * Ignorar censurados produce sesgo de sobrevivencia inverso.
 *
 * @param {number[]} failure_times  - Tiempos de falla (días)
 * @param {number[]} censored_times - Tiempos de equipos aún operativos (días)
 * @returns {{ MTBF_days, r_failures, T_total_days, bias_warning }}
 */
export function mtbfMLE(failure_times, censored_times) {
  const r        = failure_times.length;
  const T_fail   = failure_times.reduce((a, b) => a + b, 0);
  const T_cens   = censored_times.reduce((a, b) => a + b, 0);
  const T_total  = T_fail + T_cens;
  const n_total  = r + censored_times.length;

  if (r === 0) return {
    MTBF_days: Infinity, r_failures: 0, n_total,
    T_total_days: T_total, bias_warning: true,
    message: 'Sin fallas. MTBF no estimable. Ampliar período de observación.',
  };

  const MTBF       = T_total / r;
  const bias_warn  = n_total > 0 && (r / n_total) < 0.20;

  return {
    MTBF_days:          +MTBF.toFixed(1),
    r_failures:         r,
    n_total,
    T_total_days:       +T_total.toFixed(1),
    lambda_per_day:     +(1 / MTBF).toFixed(6),
    censoring_fraction: n_total > 0 ? +(censored_times.length / n_total).toFixed(3) : 0,
    bias_warning:       bias_warn,
    message:            `MTBF = ${MTBF.toFixed(0)} días · ${r} fallas de ${n_total} equipos.`
      + (bias_warn ? ' ⚠ < 20% han fallado — usar IC.' : ''),
  };
}

// ─── Intervalos de confianza Chi² ────────────────────────────────

/**
 * Cuantil de la normal estándar — aproximación de Beasley-Springer-Moro.
 * @param {number} p - probabilidad (0–1)
 * @returns {number} z tal que Φ(z) = p
 */
function _normalQuantile(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [2.515517, 0.802853, 0.010328];
  const b = [1.432788, 0.189269, 0.001308];
  const t = p < 0.5
    ? Math.sqrt(-2 * Math.log(p))
    : Math.sqrt(-2 * Math.log(1 - p));
  const num = a[0] + a[1] * t + a[2] * t * t;
  const den = 1 + b[0] * t + b[1] * t * t + b[2] * t * t * t;
  const z   = t - num / den;
  return p < 0.5 ? -z : z;
}

/**
 * Cuantil de la distribución Chi² — aproximación de Wilson-Hilferty.
 * χ²(p, ν) ≈ ν × (1 − 2/(9ν) + z_p × √(2/(9ν)))³
 *
 * [SIMPLIFIED: precisión ±0.5% en rangos ν ≥ 2, 0.01 ≤ p ≤ 0.99]
 *
 * @param {number} p  - probabilidad (0–1)
 * @param {number} df - grados de libertad
 * @returns {number}
 */
function _chi2Inv(p, df) {
  if (df <= 0) return 0;
  const z = _normalQuantile(p);
  const x = 1 - 2 / (9 * df) + z * Math.sqrt(2 / (9 * df));
  return Math.max(0, df * x * x * x);
}

/**
 * Intervalo de confianza Chi² para el MTBF (distribución exponencial).
 *
 * Fórmulas (Nelson 1982):
 *   MTBF_lower = 2T / χ²(1−α/2, 2r+2)   [cuando r ≥ 1]
 *   MTBF_upper = 2T / χ²(α/2, 2r)
 *
 * Donde T = tiempo total acumulado (fallas + censurados).
 *
 * @param {number} T_total      - tiempo total acumulado (días)
 * @param {number} r_failures   - número de fallas observadas
 * @param {number} [alpha=0.10] - nivel de significancia (0.10 = IC 90%)
 * @returns {{ MTBF_lower, MTBF_upper, confidence_pct, chi2_lower_df, chi2_upper_df }}
 *
 * @ref Nelson, W. (1982). Applied Life Data Analysis. Wiley.
 * @ref Meeker & Escobar (1998). Statistical Methods for Reliability Data.
 */
export function chi2ConfidenceInterval(T_total, r_failures, alpha = 0.10) {
  if (r_failures === 0) {
    return {
      MTBF_lower: 0,
      MTBF_upper: Infinity,
      confidence_pct: Math.round((1 - alpha) * 100),
      message: 'Sin fallas observadas. Límite superior no estimable.',
    };
  }

  const chi2_upper = _chi2Inv(1 - alpha / 2, 2 * r_failures + 2);  // denominador MTBF_lower
  const chi2_lower = _chi2Inv(alpha / 2,     2 * r_failures);       // denominador MTBF_upper

  const MTBF_lower = chi2_upper > 0 ? (2 * T_total) / chi2_upper : 0;
  const MTBF_upper = chi2_lower > 0 ? (2 * T_total) / chi2_lower : Infinity;

  return {
    MTBF_lower:      +MTBF_lower.toFixed(1),
    MTBF_upper:      +MTBF_upper.toFixed(1),
    confidence_pct:  Math.round((1 - alpha) * 100),
    chi2_upper_val:  +chi2_upper.toFixed(2),
    chi2_lower_val:  +chi2_lower.toFixed(2),
    alpha,
  };
}

// ─── Detección de sesgo de sobrevivencia ─────────────────────────

/**
 * Evalúa riesgo de sesgo de sobrevivencia en el análisis.
 *
 * @param {number} r_failures
 * @param {number} n_total
 */
export function survivalBiasCheck(r_failures, n_total) {
  const pct = (r_failures / n_total) * 100;
  let level, recommendation;
  if (pct < 5)       { level = 'ALTO';     recommendation = 'Muy pocas fallas. MTBF sobreestimado. Extender observación.'; }
  else if (pct < 20) { level = 'MODERADO'; recommendation = 'Menos del 20% han fallado. Reportar límite inferior del IC.'; }
  else if (pct < 50) { level = 'BAJO';     recommendation = 'Datos razonables. IC manejables.'; }
  else               { level = 'MÍNIMO';   recommendation = 'Mayoría con falla registrada. Estimación robusta.'; }
  return { failure_rate_pct: +pct.toFixed(1), bias_level: level, recommendation };
}
