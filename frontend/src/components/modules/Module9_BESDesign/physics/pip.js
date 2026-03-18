/**
 * SIMBES — M9: Pump Intake Pressure (PIP)
 * ========================================
 * PIP = presión en la succión de la bomba.
 * Es diferente de Pwf cuando la bomba no está en el fondo total del pozo.
 *
 * Física: columna hidrostática entre el fondo del pozo y la profundidad de la bomba.
 */

const FT_TO_M = 0.3048;

/**
 * Calcula la Pump Intake Pressure (PIP).
 *
 * PIP = Pwf − gradiente × (D_total − D_bomba)  [columna entre fondo y bomba]
 *
 * @param {number} Pwf_psi     - Presión fluyente de fondo (psi) — dato estratégico de PASO 0
 * @param {number} gamma_psi_ft - Gradiente del fluido (psi/ft)
 * @param {number} D_total_m   - Profundidad total del pozo (m)
 * @param {number} D_bomba_m   - Profundidad de asentamiento de la bomba (m)
 * @returns {number} PIP en psi
 */
export function calcPIP(Pwf_psi, gamma_psi_ft, D_total_m, D_bomba_m) {
  const delta_ft = (D_total_m - D_bomba_m) / FT_TO_M;
  const PIP = Pwf_psi - gamma_psi_ft * delta_ft;
  return Math.max(0, PIP);
}

/**
 * Genera alertas para el valor de PIP calculado.
 *
 * @param {number} PIP_psi
 * @param {number} Pb_psi  - Presión de burbuja
 * @returns {Array<{ type: string, msg: string }>}
 */
export function pipAlerts(PIP_psi, Pb_psi) {
  const alerts = [];
  if (PIP_psi <= 0) {
    alerts.push({ type: 'danger', msg: 'PIP = 0 psi. La bomba no tiene presión de succión. Revisar profundidad de asentamiento o Pwf estratégico.' });
  } else if (PIP_psi < 0.1 * Pb_psi) {
    alerts.push({ type: 'danger', msg: `PIP (${PIP_psi.toFixed(0)} psi) < 10% Pb. Riesgo crítico de gas lock en succión. Considerar subir la bomba o ajustar Pwf.` });
  } else if (PIP_psi < 0.25 * Pb_psi) {
    alerts.push({ type: 'warning', msg: `PIP (${PIP_psi.toFixed(0)} psi) < 25% Pb. Gas libre significativo en succión. Evaluar separador AGS.` });
  } else if (PIP_psi < Pb_psi) {
    alerts.push({ type: 'warning', msg: `PIP (${PIP_psi.toFixed(0)} psi) < Pb (${Pb_psi} psi). Zona bifásica en succión — algo de gas libre presente.` });
  } else {
    alerts.push({ type: 'ok', msg: `PIP (${PIP_psi.toFixed(0)} psi) ≥ Pb. Todo el gas permanece disuelto en succión. Condición óptima.` });
  }
  return alerts;
}
