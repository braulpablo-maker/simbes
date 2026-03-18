/**
 * SIMBES — M9: Selección y verificación del motor BES
 * =====================================================
 * Funciones puras para cálculo de HP, corriente, temperatura,
 * velocidad anular y decisión de shroud.
 *
 * [SIMPLIFIED: OD y T_rated por tier HP — no son curvas de fabricante real]
 * @ref API RP 11S2 — Electric Submersible Pump Motor Testing
 */

// ─── Tabla de motores por tier HP ─────────────────────────────────
// [SIMPLIFIED: valores representativos de la industria]
const MOTOR_TIERS = [
  { hp_max: 100,  V_typical: 2000,  OD_in: 4.00, T_rated_C: 150, eta: 0.88, FP: 0.82 },
  { hp_max: 300,  V_typical: 3300,  OD_in: 5.62, T_rated_C: 150, eta: 0.90, FP: 0.83 },
  { hp_max: 500,  V_typical: 4200,  OD_in: 7.38, T_rated_C: 160, eta: 0.91, FP: 0.84 },
  { hp_max: 1000, V_typical: 5000,  OD_in: 9.63, T_rated_C: 160, eta: 0.92, FP: 0.85 },
  { hp_max: Infinity, V_typical: 6600, OD_in: 9.63, T_rated_C: 180, eta: 0.93, FP: 0.86 },
];

/**
 * HP hidráulico requerido por la bomba.
 *
 * HP_hid = Q [m³/s] × TDH [m] × ρ [kg/m³] × g / η_bomba
 * Convertido a HP: 1 HP = 745.7 W
 *
 * @param {number} Q_total_m3d  - Caudal real en la bomba (m³/d)
 * @param {number} TDH_m        - TDH requerido (m)
 * @param {number} rho_kgm3     - Densidad del fluido (kg/m³)
 * @param {number} [eta_pump]   - Eficiencia hidráulica de la bomba (0–1)
 * @returns {number} HP hidráulico (HP)
 */
export function calcMotorHP(Q_total_m3d, TDH_m, rho_kgm3, eta_pump = 0.60) {
  const Q_m3s = Q_total_m3d / 86400;
  const P_W   = Q_m3s * TDH_m * rho_kgm3 * 9.81 / eta_pump;
  const HP    = P_W / 745.7;
  // Agregar 20% de margen de diseño
  return Math.ceil(HP * 1.20);
}

/**
 * Selecciona el tier de motor más adecuado para el HP calculado.
 *
 * @param {number} HP_req - HP requerido (con margen)
 * @returns {object} tier del motor seleccionado
 */
export function selectMotorTier(HP_req) {
  return MOTOR_TIERS.find(t => HP_req <= t.hp_max) || MOTOR_TIERS[MOTOR_TIERS.length - 1];
}

/**
 * Corriente nominal del motor (trifásico).
 *
 * I = HP × 746 / (√3 × V × FP × η)
 *
 * @param {number} HP_sel   - HP seleccionado
 * @param {number} V_motor  - Voltaje del motor (V)
 * @param {number} FP       - Factor de potencia (0–1)
 * @param {number} eta      - Eficiencia del motor (0–1)
 * @returns {number} Corriente nominal (A)
 */
export function calcMotorCurrent(HP_sel, V_motor, FP, eta) {
  return (HP_sel * 746) / (Math.sqrt(3) * V_motor * FP * eta);
}

/**
 * Velocidad del fluido en el espacio anular entre motor y casing.
 * Necesaria para verificar refrigeración del motor.
 *
 * v_anular = Q / A_anular
 * A_anular = π/4 × (ID_cas² - OD_motor²)  [en pulgadas → ft² → m²]
 *
 * @param {number} Q_total_m3d  - Caudal real en la bomba (m³/d)
 * @param {number} ID_cas_in    - Diámetro interno del casing (pulg)
 * @param {number} OD_motor_in  - Diámetro exterior del motor (pulg)
 * @returns {number} Velocidad anular (m/s)
 */
export function calcAnnularVelocity(Q_total_m3d, ID_cas_in, OD_motor_in) {
  const ID_m  = ID_cas_in  * 0.0254;
  const OD_m  = OD_motor_in * 0.0254;
  const A_m2  = Math.PI / 4 * (ID_m ** 2 - OD_m ** 2);
  if (A_m2 <= 0) return 0;
  const Q_m3s = Q_total_m3d / 86400;
  return Q_m3s / A_m2;
}

/**
 * Estimación de temperatura de operación del motor.
 *
 * ΔT_motor ≈ función de velocidad anular (refrigeración por fluido).
 * [SIMPLIFIED: modelo lineal educativo]
 *
 * v < 0.3 m/s → ΔT = +30°C (refrigeración insuficiente)
 * v 0.3–1.0   → ΔT = +15°C
 * v > 1.0     → ΔT = +8°C
 *
 * @param {number} T_fond_C      - Temperatura de fondo (°C)
 * @param {number} v_anular_ms   - Velocidad anular (m/s)
 * @returns {number} T operación del motor (°C)
 */
export function estimateMotorTemp(T_fond_C, v_anular_ms) {
  const delta = v_anular_ms < 0.3 ? 30
              : v_anular_ms < 1.0 ? 15
              : 8;
  return T_fond_C + delta;
}

/**
 * Evaluación de la necesidad de shroud (camisa de flujo).
 *
 * El shroud fuerza al fluido producido a pasar junto al motor antes
 * de subir por el tubing, aumentando la velocidad anular.
 *
 * @param {number} v_anular_ms    - Velocidad anular actual (m/s)
 * @param {number} T_motor_op_C   - T° de operación del motor (°C)
 * @param {number} T_rated_C      - T° nominal del motor (°C)
 * @returns {{ shroud_required, reason, OD_shroud_add_in }}
 */
export function shroudDecision(v_anular_ms, T_motor_op_C, T_rated_C) {
  const velocidadBaja = v_anular_ms < 0.30;
  const tempExcedida  = T_motor_op_C >= T_rated_C;

  if (!velocidadBaja && !tempExcedida) {
    return { shroud_required: false, reason: 'Velocidad anular y temperatura dentro de rango. No se requiere shroud.', OD_shroud_add_in: 0 };
  }

  const reasons = [];
  if (velocidadBaja) reasons.push(`v_anular (${v_anular_ms.toFixed(2)} m/s) < 0.30 m/s`);
  if (tempExcedida)  reasons.push(`T° motor (${T_motor_op_C.toFixed(0)}°C) ≥ T° nominal (${T_rated_C}°C)`);

  return {
    shroud_required: true,
    reason: `Shroud requerido: ${reasons.join(' y ')}.`,
    OD_shroud_add_in: 0.50, // [SIMPLIFIED: el shroud agrega ~0.5 pulg al OD efectivo]
  };
}
