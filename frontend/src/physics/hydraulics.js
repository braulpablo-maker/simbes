/**
 * SIMBES — Motor Hidráulica de Bomba Centrífuga Multietapa
 * =========================================================
 * @ref Darcy-Weisbach (1845/1850)
 * @ref Colebrook & White (1937)
 * @ref ANSI/HI 1.3 — Affinity Laws
 */

// ─── Conversiones de unidades ────────────────────────────────────
export const STB_TO_M3   = 0.158987;   // 1 STB = 0.158987 m³
export const M3_TO_STB   = 6.28981;    // 1 m³  = 6.28981 STB
export const FT_TO_M     = 0.3048;     // 1 ft  = 0.3048 m
export const M_TO_FT     = 3.28084;    // 1 m   = 3.28084 ft
export const PSI_PER_FT  = 0.4335;     // gradiente agua (psi/ft)

// ─── Leyes de Afinidad (VSD) ─────────────────────────────────────

/**
 * Aplica las Leyes de Afinidad para variación de frecuencia.
 *
 * Q2/Q1 = f2/f1
 * H2/H1 = (f2/f1)²
 * P2/P1 = (f2/f1)³
 *
 * @param {number} Q1 - Caudal a f1 (cualquier unidad)
 * @param {number} H1 - Altura a f1 (cualquier unidad)
 * @param {number} P1 - Potencia a f1 (cualquier unidad)
 * @param {number} f1 - Frecuencia de referencia (Hz)
 * @param {number} f2 - Frecuencia objetivo (Hz)
 * @returns {{ Q2, H2, P2, ratio }}
 */
export function affinityLaws(Q1, H1, P1, f1, f2) {
  const r = f2 / f1;
  return {
    Q2:    Q1 * r,
    H2:    H1 * r * r,
    P2:    P1 * r * r * r,
    ratio: r,
  };
}

// ─── Curva H-Q representativa de bomba BES ───────────────────────

/**
 * Altura hidráulica de la bomba a un caudal y frecuencia dados.
 * Aplica Leyes de Afinidad sobre curva genérica a 60 Hz.
 *
 * H(Q, f) = H0 × (1 − (Q_ref/Q_max)^1.85) × (f/60)²
 *
 * NOTA: Curva GENÉRICA representativa. No corresponde a ningún fabricante.
 * [SIMPLIFIED: curva de potencia genérica, no curva real de fabricante]
 *
 * @param {number} Q_stbd   - Caudal (STB/d)
 * @param {number} freq_hz  - Frecuencia VSD (Hz)
 * @param {number} [H0=8500]    - Altura máxima a Q=0, 60 Hz (ft)
 * @param {number} [Qmax=4200]  - Caudal a H=0, 60 Hz (STB/d)
 * @returns {number} Altura hidráulica (ft)
 */
export function pumpHeadFt(Q_stbd, freq_hz, H0 = 8500, Qmax = 4200) {
  const ratio  = freq_hz / 60;
  const Q_ref  = ratio > 0 ? Q_stbd / ratio : 0;
  const H_ref  = H0 * Math.max(0, 1 - Math.pow(Q_ref / Qmax, 1.85));
  return H_ref * ratio * ratio;
}

/**
 * Punto de Mejor Eficiencia (BEP) escalado a frecuencia dada.
 * [SIMPLIFIED: BEP estimado linealmente con frecuencia]
 *
 * @param {number} freq_hz
 * @param {number} [bep60=2100] - BEP a 60 Hz (STB/d)
 * @returns {{ Q_bep_stbd, freq_hz }}
 */
export function pumpBEP(freq_hz, bep60 = 2100) {
  return {
    Q_bep_stbd: bep60 * (freq_hz / 60),
    freq_hz,
  };
}

// ─── VLP — Presión fluyente de fondo requerida por el sistema ────

/**
 * VLP: Pwf mínimo para sostener caudal Q contra TDH del sistema.
 *
 * Pwf = Pwh + grad×depth − pumpPsi + frictionPsi
 *
 * [SIMPLIFIED: fricción = 1.4e-5 × Q² (Darcy-Weisbach simplificado
 *  válido para tubing 2.875"–3.5" en rangos típicos BES)]
 *
 * @param {number} Q_stbd
 * @param {number} depth_ft
 * @param {number} Pwh_psi
 * @param {number} freq_hz
 * @param {number} grad_psi_ft
 * @returns {number} Pwf en psi
 */
export function vlpPwf(Q_stbd, depth_ft, Pwh_psi, freq_hz, grad_psi_ft) {
  const pumpPsi    = pumpHeadFt(Q_stbd, freq_hz) * grad_psi_ft;
  const staticPsi  = grad_psi_ft * depth_ft;
  const frictionPsi = 1.4e-5 * Q_stbd * Q_stbd; // [SIMPLIFIED]
  return Math.max(0, Pwh_psi + staticPsi - pumpPsi + frictionPsi);
}

// ─── Velocidad Específica ────────────────────────────────────────

/**
 * Velocidad específica (unidades US).
 * Ns = N × Q^0.5 / H^0.75
 *
 * Ns < 1500  → Radial
 * 1500–4500  → Flujo Mixto (mayoría de BES modernos)
 * > 4500     → Axial
 *
 * @param {number} N_rpm
 * @param {number} Q_gpm   - Caudal en BEP (gpm)
 * @param {number} H_ft    - Altura por etapa en BEP (ft)
 * @returns {number} Ns
 */
export function specificSpeed(N_rpm, Q_gpm, H_ft) {
  return N_rpm * Math.sqrt(Q_gpm) / Math.pow(H_ft, 0.75);
}

export function impellerType(Ns) {
  if (Ns < 1500) return 'Radial (< 1500)';
  if (Ns <= 4500) return 'Flujo Mixto (1500–4500)';
  return 'Axial (> 4500)';
}

// ─── Etapas requeridas ───────────────────────────────────────────

/**
 * Número de etapas = ceil(TDH / H_por_etapa)
 *
 * @param {number} TDH_ft
 * @param {number} headPerStage_ft
 * @returns {number}
 */
export function requiredStages(TDH_ft, headPerStage_ft) {
  return Math.ceil(TDH_ft / headPerStage_ft);
}

// ─── Módulo 2: Colebrook-White + TDH completo ────────────────────

/**
 * Número de Reynolds en tubing.
 * Re = ρ·v·D / μ
 *
 * @param {number} Q_m3d       - Caudal (m³/d)
 * @param {number} D_in        - Diámetro interno tubing (pulgadas)
 * @param {number} rho_kgL     - Densidad (kg/L)
 * @param {number} mu_cP       - Viscosidad dinámica (cP)
 * @returns {number} Re (adimensional)
 */
export function reynoldsNumber(Q_m3d, D_in, rho_kgL, mu_cP) {
  const D_m   = D_in * 0.0254;
  const A_m2  = Math.PI * D_m * D_m / 4;
  const Q_m3s = Q_m3d / 86400;
  const v_ms  = A_m2 > 0 ? Q_m3s / A_m2 : 0;
  const rho   = rho_kgL * 1000;  // kg/m³
  const mu    = mu_cP  * 0.001;  // Pa·s
  return mu > 0 ? (rho * v_ms * D_m) / mu : 0;
}

/**
 * Factor de fricción de Darcy — ecuación de Colebrook-White (turbulento)
 * o Hagen-Poiseuille (laminar).
 *
 * 1/√f = −2·log₁₀(ε/3.7D + 2.51/(Re·√f))   [turbulento, Re > 4000]
 * f = 64/Re                                    [laminar,   Re < 2300]
 *
 * @ref Colebrook & White, 1937
 * @param {number} Re          - Número de Reynolds
 * @param {number} D_m         - Diámetro interno (m)
 * @param {number} [eps=4.6e-5] - Rugosidad absoluta (m) — acero comercial
 * @returns {number} Factor de fricción de Darcy
 */
export function colebrookWhite(Re, D_m, eps = 4.6e-5) {
  if (Re <= 0)    return 0.02;
  if (Re < 2300)  return 64 / Re;                          // laminar
  // Swamee-Jain (arranque explícito, error < 3 %)
  const eD = eps / D_m;
  let f = 0.25 / Math.pow(Math.log10(eD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
  // Refinamiento Newton (Colebrook-White implícito)
  for (let i = 0; i < 10; i++) {
    const sqrtF = Math.sqrt(f);
    const rhs   = -2 * Math.log10(eD / 3.7 + 2.51 / (Re * sqrtF));
    const f_new = 1 / (rhs * rhs);
    if (Math.abs(f_new - f) < 1e-9) break;
    f = f_new;
  }
  return f;
}

/**
 * Régimen de flujo en función de Re.
 * @param {number} Re
 * @returns {'laminar'|'transición'|'turbulento'}
 */
export function flowRegime(Re) {
  if (Re < 2300) return 'laminar';
  if (Re < 4000) return 'transición';
  return 'turbulento';
}

/**
 * Componentes del TDH expresadas en METROS.
 *
 * TDH = H_estático + H_fricción + H_contrapresión
 *
 * H_estático   = depth_m            (columna de fluido = profundidad de la bomba)
 * H_fricción   = f·(L/D)·v²/(2g)   (Darcy-Weisbach + Colebrook-White)
 * H_contrapres = (Pwh_psi/grad)·FT_TO_M
 *
 * @ref Darcy-Weisbach (1845)
 * @ref Colebrook & White (1937)
 *
 * @param {number} Q_m3d        - Caudal (m³/d)
 * @param {number} depth_m      - Profundidad de la bomba (m)
 * @param {number} Pwh_psi      - Presión de cabezal (psi)
 * @param {number} D_in         - Diámetro interno tubing (pulgadas)
 * @param {number} mu_cP        - Viscosidad (cP)
 * @param {number} rho_kgL      - Densidad del fluido (kg/L)
 * @returns {{ H_static_m, H_friction_m, H_back_m, TDH_m, Re, f, v_ms, regime }}
 */
export function tdhComponents(Q_m3d, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL) {
  const D_m    = D_in * 0.0254;
  const A_m2   = Math.PI * D_m * D_m / 4;
  const Q_m3s  = Q_m3d / 86400;
  const v_ms   = Q_m3d > 0 ? Q_m3s / A_m2 : 0;
  const Re     = reynoldsNumber(Q_m3d, D_in, rho_kgL, mu_cP);
  const f      = colebrookWhite(Re, D_m);

  // Darcy-Weisbach: h_f = f × (L/D) × v²/(2g)  [m de fluido]
  const H_friction_m = f * (depth_m / D_m) * (v_ms * v_ms) / (2 * 9.81);

  const H_static_m = depth_m;

  const grad_psi_ft = rho_kgL * PSI_PER_FT;  // psi/ft
  const H_back_m    = (Pwh_psi / grad_psi_ft) * FT_TO_M;

  const TDH_m = H_static_m + H_friction_m + H_back_m;

  return {
    H_static_m:   +H_static_m.toFixed(2),
    H_friction_m: +H_friction_m.toFixed(2),
    H_back_m:     +H_back_m.toFixed(2),
    TDH_m:        +TDH_m.toFixed(2),
    Re:           +Re.toFixed(0),
    f:            +f.toFixed(5),
    v_ms:         +v_ms.toFixed(3),
    regime:       flowRegime(Re),
  };
}

/**
 * Altura total de la bomba multietapa a un caudal y frecuencia dados, en METROS.
 *
 * H_total(Q) = H0_stage × N_stages × (1 − (Q_ref/Qmax)^1.85) × (f/60)²
 *
 * @param {number} Q_m3d         - Caudal (m³/d)
 * @param {number} freq_hz       - Frecuencia VSD (Hz)
 * @param {number} N_stages      - Número de etapas
 * @param {number} H0_stage_ft   - Altura por etapa a Q=0, 60 Hz (ft)
 * @param {number} [Qmax=4200]   - Caudal máximo a 60 Hz (STB/d)
 * @returns {number} Altura total de la bomba (m)
 */
export function pumpHeadTotalM(Q_m3d, freq_hz, N_stages, H0_stage_ft, Qmax = 4200) {
  const Q_stbd = Q_m3d / STB_TO_M3;
  const ratio  = freq_hz / 60;
  const Q_ref  = ratio > 0 ? Q_stbd / ratio : 0;
  const H_ref  = H0_stage_ft * Math.max(0, 1 - Math.pow(Q_ref / Qmax, 1.85));
  return H_ref * ratio * ratio * N_stages * FT_TO_M;
}

/**
 * Calcula el número de etapas requerido para operar en el BEP.
 *
 * N_stages = ceil(TDH_en_BEP / H_por_etapa_en_BEP)
 *
 * @param {number} depth_m
 * @param {number} Pwh_psi
 * @param {number} D_in
 * @param {number} mu_cP
 * @param {number} rho_kgL
 * @param {number} freq_hz
 * @param {number} H0_stage_ft
 * @returns {number} Número de etapas (entero positivo)
 */
export function computeRequiredStages(depth_m, Pwh_psi, D_in, mu_cP, rho_kgL, freq_hz, H0_stage_ft) {
  const Q_bep_stbd = 2100 * (freq_hz / 60);
  const Q_bep_m3d  = Q_bep_stbd * STB_TO_M3;
  const { TDH_m }  = tdhComponents(Q_bep_m3d, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL);

  const ratio           = freq_hz / 60;
  // Altura por etapa en el BEP (Q_ref = 2100 STBd siempre, = Qmax/2)
  const H_stage_bep_m   = H0_stage_ft * FT_TO_M * (1 - Math.pow(0.5, 1.85)) * ratio * ratio;
  // 0.5^1.85 ≈ 0.2774  →  factor ≈ 0.7226

  if (H_stage_bep_m <= 0) return 200;
  return Math.max(1, Math.ceil(TDH_m / H_stage_bep_m));
}

/**
 * Punto de operación hidráulico: intersección de curva de sistema y curva H-Q.
 * Bisección numérica en 2000 puntos.
 *
 * @returns {{ Q_m3d, TDH_m } | null}
 */
export function findHydraulicOpPoint(depth_m, Pwh_psi, D_in, mu_cP, rho_kgL, freq_hz, N_stages, H0_stage_ft) {
  const Qmax_m3d = 4200 * (freq_hz / 60) * STB_TO_M3 * 1.05;
  const steps    = 2000;
  let prev = null;

  for (let i = 0; i <= steps; i++) {
    const Q_m3d  = (Qmax_m3d * i) / steps;
    const H_pump = pumpHeadTotalM(Q_m3d, freq_hz, N_stages, H0_stage_ft);
    const { TDH_m } = tdhComponents(Q_m3d, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL);
    const diff = H_pump - TDH_m;

    if (prev !== null && prev.diff * diff < 0) {
      const t    = prev.diff / (prev.diff - diff);
      const Q_op = prev.Q + t * (Q_m3d - prev.Q);
      const { TDH_m: TDH_op } = tdhComponents(Q_op, depth_m, Pwh_psi, D_in, mu_cP, rho_kgL);
      return { Q_m3d: +Q_op.toFixed(1), TDH_m: +TDH_op.toFixed(1) };
    }
    prev = { Q: Q_m3d, diff };
  }
  return null;  // sin intersección
}

/**
 * Velocidad específica de la bomba genérica SIMBES a frecuencia dada.
 * Calculada en condiciones de referencia (60 Hz) para caracterizar geometría del impulsor.
 *
 * Ns = RPM × √(Q_gpm_bep) / H_bep_stage^0.75   [unidades US]
 *
 * @ref ANSI/HI 1.3
 * @param {number} H0_stage_ft  - Altura por etapa a Q=0 y 60 Hz (ft)
 * @returns {{ Ns, type }}
 */
export function pumpSpecificSpeed(H0_stage_ft) {
  const RPM_60        = 3600;                       // rpm 2-polo, 60 Hz
  const Q_bep_60_gpm  = 2100 * 0.029166;            // ≈ 61.25 GPM
  const H_bep_60      = H0_stage_ft * (1 - Math.pow(0.5, 1.85));  // ft/etapa en BEP
  if (H_bep_60 <= 0) return { Ns: 0, type: 'N/A' };
  const Ns = RPM_60 * Math.sqrt(Q_bep_60_gpm) / Math.pow(H_bep_60, 0.75);
  return { Ns: Math.round(Ns), type: impellerType(Math.round(Ns)) };
}
