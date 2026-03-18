/**
 * SIMBES — M9: Volumen real en la bomba
 * ======================================
 * Calcula el caudal volumétrico real que ingresa a la bomba,
 * incluyendo el efecto del gas libre y el agua.
 *
 * [SIMPLIFIED: Bo y Bw con valores representativos. Para diseño real usar PVT de laboratorio.]
 */

/**
 * Volumen real de fluido en la bomba (condiciones de succión).
 *
 * Q_total = Q_oil × Bo + Q_water × Bw + Q_gas_libre
 *
 * @param {number} Q_m3d       - Caudal de diseño en superficie (m³/d)
 * @param {number} BSW_pct     - Corte de agua (%)
 * @param {number} GOR_m3m3    - Gas-Oil Ratio superficial (m³/m³)
 * @param {number} PIP_psi     - Presión en succión de la bomba (psi)
 * @param {number} Pb_psi      - Presión de burbuja (psi)
 * @param {number} T_fond_C    - Temperatura de fondo (°C)
 * @returns {{ Q_total_m3d, Q_liq_m3d, Q_gas_m3d, Bo, Bw, note }}
 */
export function realPumpVolume(Q_m3d, BSW_pct, GOR_m3m3, PIP_psi, Pb_psi, T_fond_C) {
  const BSW = BSW_pct / 100;
  const Q_water_surf = Q_m3d * BSW;
  const Q_oil_surf   = Q_m3d * (1 - BSW);

  // Factor volumétrico del petróleo Bo [SIMPLIFIED: correlación Standing aproximada]
  // Bo ≈ 1.0 + 0.0005 × GOR^0.5 × (API proxy) — simplificado como función de T y GOR
  const Bo = 1.0 + 0.0003 * Math.sqrt(GOR_m3m3 * 5.6146) * (T_fond_C / 150);
  const Bw = 1.02; // [SIMPLIFIED: agua ligeramente expandida por temperatura]

  // Volumen líquido a condiciones de fondo
  const Q_oil_pump   = Q_oil_surf * Bo;
  const Q_water_pump = Q_water_surf * Bw;
  const Q_liq_m3d    = Q_oil_pump + Q_water_pump;

  // Gas libre en succión (solo si PIP < Pb)
  let Q_gas_m3d = 0;
  if (PIP_psi < Pb_psi) {
    // Fracción de GOR liberada (proporcional a caída de presión)
    const rs_fraction = PIP_psi / Pb_psi; // gas disuelto restante
    const free_GOR_m3m3 = GOR_m3m3 * (1 - rs_fraction) * Math.max(0, 1 - BSW);

    // Bg simplificado: gas ideal a PIP
    const T_R  = (T_fond_C * 9 / 5 + 32) + 459.67;
    const Bg_ft3_scf = 0.02829 * 0.9 * T_R / PIP_psi; // ft³/scf
    const Bg_m3_m3   = Bg_ft3_scf * 0.028317 / 0.158987; // m³gas/m³oil @ PIP

    Q_gas_m3d = free_GOR_m3m3 * Q_oil_surf * Bg_m3_m3;
  }

  const Q_total_m3d = Q_liq_m3d + Q_gas_m3d;

  return {
    Q_total_m3d: +Q_total_m3d.toFixed(2),
    Q_liq_m3d:   +Q_liq_m3d.toFixed(2),
    Q_gas_m3d:   +Q_gas_m3d.toFixed(2),
    Bo:           +Bo.toFixed(4),
    Bw:           +Bw.toFixed(3),
    note: '[SIMPLIFIED: Bo por correlación simplificada; Bw=1.02 fijo]',
  };
}
