/**
 * SIMBES — Motor IPR (Inflow Performance Relationship)
 * =====================================================
 * Todas las funciones son puras (sin side effects, sin estado global).
 * Unidades explícitas en nombres de variables y JSDoc.
 *
 * @ref Darcy (1856) — Ley de flujo en medios porosos
 * @ref Vogel, J.V. (1968) — SPE 1476
 * @ref Standing (1971) — extensión compuesta Darcy+Vogel
 */

// ─── Conversiones ────────────────────────────────────────────────
export const M3D_PER_STB = 0.158987;  // 1 STB = 0.158987 m³
export const FT_PER_M    = 3.28084;   // 1 m   = 3.28084 ft

// ─── AOF ─────────────────────────────────────────────────────────

/**
 * Absolute Open Flow: caudal máximo teórico a Pwf = 0.
 * Modelo compuesto Darcy (Pwf ≥ Pb) + Vogel (Pwf < Pb).
 *
 * Qb   = IP × max(Pr − Pb, 0)      [zona Darcy]
 * AOF  = Qb + (IP × Pb) / 1.8      [suma zona Vogel]
 *
 * @param {number} Pr_psi  - Presión estática del reservorio (psi)
 * @param {number} Pb_psi  - Presión de burbuja (psi)
 * @param {number} IP_stbd_psi - Índice de Productividad (STB/d/psi)
 * @returns {number} AOF en STB/d
 */
export function calcAOF(Pr_psi, Pb_psi, IP_stbd_psi) {
  const Pb = Math.min(Pb_psi, Pr_psi);
  const qb = IP_stbd_psi * Math.max(Pr_psi - Pb, 0);
  return qb + (IP_stbd_psi * Pb) / 1.8;
}

// ─── IPR forward: Pwf → Q ────────────────────────────────────────

/**
 * Dado Pwf, calcula Q.
 * Zona Darcy si Pwf ≥ Pb; zona Vogel si Pwf < Pb.
 *
 * @param {number} Pwf_psi
 * @param {number} Pr_psi
 * @param {number} Pb_psi
 * @param {number} IP_stbd_psi
 * @returns {number} Q en STB/d (≥ 0)
 */
export function iprPwfToQ(Pwf_psi, Pr_psi, Pb_psi, IP_stbd_psi) {
  const Pb = Math.min(Pb_psi, Pr_psi);
  const qb = IP_stbd_psi * Math.max(Pr_psi - Pb, 0);
  if (Pwf_psi >= Pb) {
    return Math.max(0, IP_stbd_psi * (Pr_psi - Pwf_psi));
  }
  const qVogelMax = (IP_stbd_psi * Pb) / 1.8;
  const vogel = 1 - 0.2 * (Pwf_psi / Pb) - 0.8 * Math.pow(Pwf_psi / Pb, 2);
  return qb + qVogelMax * Math.max(0, vogel);
}

// ─── IPR inverse: Q → Pwf ────────────────────────────────────────

/**
 * Dado Q, calcula Pwf.
 * Zona Darcy: solución directa.
 * Zona Vogel: inversión cuadrática.
 *
 * @param {number} Q_stbd
 * @param {number} Pr_psi
 * @param {number} Pb_psi
 * @param {number} IP_stbd_psi
 * @returns {number} Pwf en psi (≥ 0)
 */
export function iprQtoPwf(Q_stbd, Pr_psi, Pb_psi, IP_stbd_psi) {
  const Pb = Math.min(Pb_psi, Pr_psi);
  const qb = IP_stbd_psi * Math.max(Pr_psi - Pb, 0);
  if (Q_stbd <= qb) return Math.max(0, Pr_psi - Q_stbd / IP_stbd_psi);
  const qVogelMax = (IP_stbd_psi * Pb) / 1.8;
  const f = Math.min(1, (Q_stbd - qb) / qVogelMax);
  const disc = 0.04 + 3.2 * (1 - f);
  if (disc < 0) return 0;
  return Math.max(0, ((-0.2 + Math.sqrt(disc)) / 1.6) * Pb);
}

// ─── Punto de operación ──────────────────────────────────────────

/**
 * Encuentra el punto de operación IPR ∩ VLP por bisección.
 *
 * @param {number} Pr_psi
 * @param {number} Pb_psi
 * @param {number} IP_stbd_psi
 * @param {Function} vlpFn  - función Q_stbd → Pwf_psi (VLP)
 * @returns {{ Q: number, Pwf: number } | null}
 */
export function findOperatingPoint(Pr_psi, Pb_psi, IP_stbd_psi, vlpFn) {
  const aof    = calcAOF(Pr_psi, Pb_psi, IP_stbd_psi);
  const maxQ   = aof * 1.2;
  const steps  = 2000;
  let prev     = null;
  for (let i = 0; i <= steps; i++) {
    const Q    = (maxQ * i) / steps;
    const diff = iprQtoPwf(Q, Pr_psi, Pb_psi, IP_stbd_psi) - vlpFn(Q);
    if (prev !== null && prev.diff * diff < 0) {
      const t     = prev.diff / (prev.diff - diff);
      const Qop   = prev.Q + t * (Q - prev.Q);
      const Pwfop = (iprQtoPwf(Qop, Pr_psi, Pb_psi, IP_stbd_psi) + vlpFn(Qop)) / 2;
      return { Q: Math.round(Qop * 10) / 10, Pwf: Math.round(Pwfop) };
    }
    prev = { Q, diff };
  }
  return null;
}

// ─── Curva IPR completa ──────────────────────────────────────────

/**
 * Genera la curva IPR completa (array de puntos {Q, Pwf}) para visualización.
 *
 * @param {number} Pr_psi
 * @param {number} Pb_psi
 * @param {number} IP_stbd_psi
 * @param {number} [nPoints=150]
 * @returns {{ points: Array, aof: number, qb: number }}
 */
export function buildIPRCurve(Pr_psi, Pb_psi, IP_stbd_psi, nPoints = 150) {
  const aof    = calcAOF(Pr_psi, Pb_psi, IP_stbd_psi);
  const qb     = IP_stbd_psi * Math.max(Pr_psi - Math.min(Pb_psi, Pr_psi), 0);
  const points = [];
  for (let i = 0; i <= nPoints; i++) {
    const Q   = (aof * i) / nPoints;
    const Pwf = iprQtoPwf(Q, Pr_psi, Pb_psi, IP_stbd_psi);
    points.push({ Q, Pwf });
  }
  return { points, aof, qb };
}
