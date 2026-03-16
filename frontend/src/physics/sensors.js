/**
 * SIMBES — Motor de Sensores y Monitoreo BES
 * ==========================================
 * @ref API RP 11S5 — Recommended Practice for Operation of Electric Submersible Pump Systems
 * @ref ISO 10816-3 — Mechanical vibration — evaluation criteria for rotating machinery
 * @ref CLAUDE.md §2.6 — Umbrales de vibración piezoeléctricos
 */

// ─── Temperatura de fondo ─────────────────────────────────────────
/**
 * Temperatura estimada en el fondo del pozo usando gradiente geotérmico lineal.
 * T_BH = T_surface + gradient × depth
 *
 * @param {number} T_surface_C   Temperatura en superficie (°C)
 * @param {number} depth_m       Profundidad (m)
 * @param {number} gradient_C_100m  Gradiente geotérmico (°C/100m). Típico: 2.5–4.0
 * @returns {{ T_bottomhole_C, T_cable_avg_C }}
 */
export function bottomholeTemperature(T_surface_C, depth_m, gradient_C_100m = 3.0) {
  const T_BH = T_surface_C + (gradient_C_100m / 100) * depth_m;
  const T_cable_avg = (T_surface_C + T_BH) / 2;
  return {
    T_bottomhole_C: +T_BH.toFixed(1),
    T_cable_avg_C:  +T_cable_avg.toFixed(1),
  };
}

// ─── Cartas Amperimétricas ────────────────────────────────────────
/**
 * Genera una carta amperimérica simulada (corriente vs. tiempo).
 * Cada condición produce un patrón de corriente característico.
 *
 * [SIMPLIFIED: señales sintéticas representativas de patrones de campo]
 *
 * @param {string} condition  'normal' | 'surging' | 'underload' | 'overload' | 'gas_lock'
 * @param {number} I_rated    Corriente nominal del motor (A)
 * @param {number} n_points   Número de puntos (cada punto = 0.5 s → 60s total con 120 pts)
 * @returns {{ data: [{t, I}], avg_I, pct_nominal, alert, diagnosis }}
 */
export function simulateCurrentPattern(condition, I_rated = 80, n_points = 120) {
  // Semilla determinística para reproducibilidad pedagógica
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  };

  const data = [];
  for (let i = 0; i < n_points; i++) {
    const t = +(i * 0.5).toFixed(1);
    let I;
    switch (condition) {
      case 'normal':
        // Corriente estable con ruido ±2%
        I = I_rated * (1.0 + 0.02 * rand());
        break;

      case 'surging':
        // Oscilación 0.3–0.5 Hz con amplitud ±18%
        // [SIMPLIFIED: surging real tiene espectro más complejo]
        I = I_rated * (1.0 + 0.18 * Math.sin(2 * Math.PI * 0.4 * t) + 0.04 * rand());
        break;

      case 'underload':
        // Corriente baja estable ≈ 60–65% nominal
        I = I_rated * (0.62 + 0.03 * rand());
        break;

      case 'overload':
        // Corriente elevada ≈ 120–130% nominal
        I = I_rated * (1.25 + 0.05 * rand());
        break;

      case 'gas_lock': {
        // Corriente normal → caída rápida → oscilación cerca de 0
        const t_lock = 20; // seg cuando ocurre el gas lock
        if (t < t_lock) {
          I = I_rated * (1.0 + 0.02 * rand());
        } else if (t < t_lock + 6) {
          const frac = (t - t_lock) / 6;
          I = I_rated * (1.0 - frac * 0.82 + 0.03 * rand());
        } else {
          I = I_rated * (0.12 + 0.08 * Math.abs(Math.sin(2 * Math.PI * 0.15 * t)) + 0.04 * Math.abs(rand()));
        }
        break;
      }

      default:
        I = I_rated;
    }
    data.push({ t, I: +Math.max(0, I).toFixed(1) });
  }

  const avg_I = data.reduce((s, p) => s + p.I, 0) / data.length;
  const pct_nominal = (avg_I / I_rated) * 100;

  const CONDITION_META = {
    normal:    { alert: 'ok',     diagnosis: 'Corriente estable. Motor operando en condición normal.' },
    surging:   { alert: 'warning', diagnosis: 'Corriente oscilante. Surging: bomba operando fuera del BEP o ingesta de gas. Ajustar frecuencia VSD.' },
    underload: { alert: 'warning', diagnosis: 'Corriente baja (<70%). Subcarga: posible gas lock, eje roto o baja densidad de fluido.' },
    overload:  { alert: 'warning', diagnosis: 'Corriente alta (>115%). Sobrecarga: alta viscosidad, sólidos, desgaste o frecuencia excesiva.' },
    gas_lock:  { alert: 'danger',  diagnosis: 'Gas lock: la corriente cae repentinamente a <20% nominal. La bomba gira en gas. PARAR y purgar.' },
  };

  const meta = CONDITION_META[condition] || CONDITION_META['normal'];
  return { data, avg_I: +avg_I.toFixed(1), pct_nominal: +pct_nominal.toFixed(1), ...meta };
}

// ─── Vibración ────────────────────────────────────────────────────
/**
 * Genera una señal de vibración sintética y calcula el RMS.
 *
 * Umbrales (ISO 10816-3 / API RP 11S5):
 *   OK:      < 4.0 mm/s RMS  (zona A — nueva instalación)
 *   WARNING: 4.0–6.3 mm/s    (zona B — alerta temprana)
 *   DANGER:  > 6.3 mm/s      (zona C — paro recomendado)
 *
 * [SIMPLIFIED: señal sintética; vibración real analizada por FFT en campo]
 *
 * @param {string} condition  'normal' | 'desbalanceo' | 'rodamiento' | 'cavitacion'
 * @param {number} rpm        Velocidad de rotación (RPM), default 3600
 * @param {number} n_points   Puntos de muestreo (dt=0.005s → 0.5s de señal con 100 pts)
 * @returns {{ signal: [{t, v}], rms_mm_s, peak_mm_s, alert, cause, recommendation }}
 */
export function simulateVibration(condition, rpm = 3600, n_points = 100) {
  const dt = 0.005; // 5 ms → frecuencia de muestreo 200 Hz
  const f_rot = rpm / 60; // frecuencia de rotación (Hz)

  let seed = 77;
  const rand = () => {
    seed = (seed * 22695477 + 1) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  };

  const signal = [];
  for (let i = 0; i < n_points; i++) {
    const t = +(i * dt).toFixed(4);
    let v;
    switch (condition) {
      case 'normal':
        // Ruido de fondo + leve componente rotacional
        v = 0.8 * rand() + 0.3 * Math.sin(2 * Math.PI * f_rot * t);
        break;

      case 'desbalanceo':
        // Fuerte componente 1× (frecuencia de rotación)
        // [SIMPLIFIED: desbalanceo real genera armónicos en 1×, 2×, 3×]
        v = 4.5 * Math.sin(2 * Math.PI * f_rot * t)
          + 1.0 * Math.sin(2 * Math.PI * 2 * f_rot * t)
          + 0.6 * rand();
        break;

      case 'rodamiento': {
        // Impactos periódicos de alta frecuencia (defecto de rodamiento)
        // BPFO (Ball Pass Frequency Outer race) típico ≈ 5× f_rot para rodamiento estándar
        const f_bearing = 5 * f_rot;
        v = 0.5 * rand()
          + (Math.sin(2 * Math.PI * f_bearing * t) > 0.85 ? 7.5 * Math.abs(rand()) : 0);
        break;
      }

      case 'cavitacion':
        // Ruido aleatorio broadband + componente de alta frecuencia
        v = 3.5 * rand() + 2.0 * Math.sin(2 * Math.PI * 80 * t) * Math.abs(rand());
        break;

      default:
        v = 0.5 * rand();
    }
    signal.push({ t, v: +v.toFixed(3) });
  }

  const rms = Math.sqrt(signal.reduce((s, p) => s + p.v * p.v, 0) / n_points);
  const peak = Math.max(...signal.map(p => Math.abs(p.v)));

  const alert = rms > 6.3 ? 'danger' : rms > 4.0 ? 'warning' : 'ok';

  const VIBE_META = {
    normal:      { cause: 'Vibración normal de operación', recommendation: 'Sin acción. Registrar como baseline.' },
    desbalanceo: { cause: 'Desbalanceo de rotor (masas excéntricas)', recommendation: 'Inspeccionar rotor. Posible daño por sólidos o desgaste asimétrico.' },
    rodamiento:  { cause: 'Defecto de rodamiento (BPFO — impactos periódicos)', recommendation: 'Planificar extracción. Rodamiento en falla inminente.' },
    cavitacion:  { cause: 'Cavitación / surging (ruido broadband)', recommendation: 'Reducir caudal o aumentar Ps. Verificar GVF y punto de operación.' },
  };

  const meta = VIBE_META[condition] || VIBE_META['normal'];
  return { signal, rms_mm_s: +rms.toFixed(2), peak_mm_s: +peak.toFixed(2), alert, ...meta };
}

// ─── Diagnóstico Integrado de Sensores ───────────────────────────
/**
 * Correlaciona lecturas de múltiples sensores para diagnosticar la condición del sistema.
 *
 * @param {object} readings
 *   .currentCondition  string  — condición de carta amperimérica
 *   .rms_mm_s          number  — vibración RMS (mm/s)
 *   .Ps_psi            number  — presión de succión (psi)
 *   .Pb_psi            number  — presión de burbuja (psi)
 *   .T_motor_C         number  — temperatura del motor (°C)
 *   .T_rated_C         number  — temperatura nominal del aislamiento (°C)
 * @returns {Array<{severity, title, desc}>} lista ordenada de diagnósticos
 */
export function integratedDiagnosis({ currentCondition, rms_mm_s, Ps_psi, Pb_psi, T_motor_C, T_rated_C }) {
  const items = [];

  // Corriente
  if (currentCondition === 'gas_lock')
    items.push({ severity: 'danger',  title: 'Gas Lock',          desc: 'Corriente en colapso. Bomba girando en gas. PARAR y esperar re-llenado.' });
  if (currentCondition === 'surging')
    items.push({ severity: 'warning', title: 'Surging',           desc: 'Corriente oscilante. Ajustar frecuencia VSD o drawdown.' });
  if (currentCondition === 'underload')
    items.push({ severity: 'warning', title: 'Subcarga',          desc: 'Corriente baja. Verificar GVF, densidad de fluido y caudal.' });
  if (currentCondition === 'overload')
    items.push({ severity: 'warning', title: 'Sobrecarga',        desc: 'Corriente elevada. Verificar viscosidad, sólidos y back-pressure.' });

  // Vibración
  if (rms_mm_s > 6.3)
    items.push({ severity: 'danger',  title: 'Vibración Crítica', desc: `${rms_mm_s.toFixed(1)} mm/s RMS. Zona C — Paro inmediato recomendado.` });
  else if (rms_mm_s > 4.0)
    items.push({ severity: 'warning', title: 'Vibración Elevada', desc: `${rms_mm_s.toFixed(1)} mm/s RMS. Zona B — Investigar causa. Alerta temprana.` });

  // Presión succión vs Pb
  if (Ps_psi < Pb_psi * 0.5)
    items.push({ severity: 'danger',  title: 'Ps Crítica vs Pb',  desc: `Ps=${Ps_psi} psi < 50%×Pb. GVF muy alto. Riesgo severo de gas lock.` });
  else if (Ps_psi < Pb_psi)
    items.push({ severity: 'warning', title: 'Ps < Pb',           desc: `Ps=${Ps_psi} psi < Pb=${Pb_psi} psi. Gas libre en succión. Evaluar separador.` });

  // Temperatura motor
  const delta_T = T_motor_C - T_rated_C;
  if (delta_T > 20)
    items.push({ severity: 'danger',  title: 'T° Motor Crítica',  desc: `ΔT=${delta_T.toFixed(0)}°C sobre límite. Vida aislamiento <25%. Revisar refrigeración.` });
  else if (delta_T > 0)
    items.push({ severity: 'warning', title: 'T° Motor Elevada',  desc: `T_motor=${T_motor_C}°C supera límite ${T_rated_C}°C en ${delta_T.toFixed(0)}°C. Arrhenius activo.` });

  if (items.length === 0)
    items.push({ severity: 'ok', title: 'Sistema Normal', desc: 'Todos los sensores dentro de parámetros operativos. Operación óptima.' });

  return items;
}
