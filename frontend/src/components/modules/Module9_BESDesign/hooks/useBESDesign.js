/**
 * SIMBES — M9: Hook de estado del wizard de diseño BES
 * =====================================================
 * Maneja el estado completo del flujo de diseño (12 pasos, alpha+beta activos 0–7).
 * Usa useReducer para que las transiciones sean explícitas y auditables.
 */
import { useReducer } from 'react';
import { iprPwfToQ, calcAOF }                         from '../../../../physics/ipr.js';
import { gasVolumeFraction, gasSeparatorEfficiency,
         hiViscosityCorrection }                       from '../../../../physics/gas.js';
import { tdhComponents, M_TO_FT, FT_TO_M }            from '../../../../physics/hydraulics.js';
import { cableVoltageDrop, thdEstimate,
         arrheniusLifeFactor, materialRecommendation } from '../../../../physics/electrical.js';
import { evaluateBESCandidacy }                        from '../physics/candidacy.js';
import { calcPIP, pipAlerts }                          from '../physics/pip.js';
import { realPumpVolume }                              from '../physics/pump_volume.js';
import { selectPumpSeries, calcStages, checkBEPRatio } from '../physics/pump_selector.js';
import { calcMotorHP, selectMotorTier, calcMotorCurrent,
         calcAnnularVelocity, estimateMotorTemp,
         shroudDecision }                              from '../physics/motor.js';
import { calcMaxODString, calcClearance, doglegCheck,
         clearanceDecision, cableOD }                  from '../physics/mechanical.js';
import pumpSeries   from '../data/pump-series.json';

// ─── Conversiones ─────────────────────────────────────────────────
const M3D_PER_STB    = 0.158987;
const IP_M3D_TO_STBD = 1 / 6.28981;  // 1 m³/d/psi = 0.15899 STB/d/psi
const GOR_M3_TO_SCF  = 5.6146;       // 1 m³/m³ = 5.6146 scf/STB
const D_IN_TUBING    = 2.992;        // tubing 3.5" estándar (ID en pulg) [SIMPLIFIED]

// ─── Estado inicial ───────────────────────────────────────────────
const S3_INIT = {
  completado: false, PIP_psi: null, GVF_crudo: null, GVF_efectivo: null,
  separador_tipo: null, Q_total_m3d: null, Q_liq_m3d: null,
  H_factor: 1.0, Q_factor: 1.0, eta_factor: 1.0,
  visc_correction_active: false, iteraciones_cicloA: 0, alerts: [],
};
const S4_INIT = {
  completado: false, TDH_m: null, TDH_components: null,
  serie: null, etapas: null, f_operativa: null, bep_ratio: null,
  bep_pct: null, Ns: null, tipo_impulsor: null, OD_bomba_in: null,
  HP_hidraulico: null, OD_max_constraint: null, candidatos: [],
  iteraciones_cicloB: 0, alerts: [],
};
const S5_INIT = {
  completado: false, HP_seleccionado: null, V_motor: null, I_nominal: null,
  T_motor_op: null, T_rated_motor: null, v_fluido_anular: null,
  shroud_requerido: false, OD_motor_in: null, OD_shroud_in: null,
  iteraciones_cicloC: 0, alerts: [],
};
const S6_INIT = {
  completado: false, AWG: null, V_drop_V: null, V_drop_pct: null,
  aislamiento_tipo: null, life_factor: null, THD_pct: null,
  cumple_ieee519: null, OD_cable_in: null,
  iteraciones_cicloD: 0, alerts: [],
};
const S7_INIT = {
  completado: false, OD_string_in: null, componentes: [],
  holgura_mm: null, dogleg_ok: null, dogleg_admisible: null,
  status: null, iteraciones_cicloE: 0, alerts: [],
};
const S8_INIT = {
  completado: false, riesgos: [], resumen_estado: 'ok',
  hay_riesgo_critico: false, iteraciones_cicloF: 0, alerts: [],
};
const S9_INIT = {
  completado: false, f_arranque: null, rampa_Hz_min: null,
  setpoints: {}, monitoreo: {}, alerts: [],
};
const S10_INIT = {
  completado: false, Q_esperado: null, MTBF_base: null,
  run_life_dias: null, R_at_runlife: null,
  factores: {}, capex_categoria: null, capex_extras: [], alerts: [],
};
const S11_INIT = { completado: false, datasheet_ready: false };

const initialState = {
  inputs: {
    Pr: 3000, Pb: 1500, IP: 4, Pwf: 1000,
    D_bomba: 2000, D_total: 2500, WHP: 150, gamma: 0.40,
    T_fond: 120, T_sup: 25, ID_cas: 7.0, Dev: 15,
    GOR: 50, BSW: 30, visc: 5, API: 30,
    H2S: false, CO2: false, solidos: 'Bajo',
    V_sup: 4160, f_red: 60, VSD: 'standard_6pulse',
  },
  step0: { valid: false, errors: {} },
  step1: { completado: false, verdict: null, criterios: [], sistemasAlternativos: [] },
  step2: { completado: false, Q_m3d: null, AOF_m3d: null, drawdown_pct: null, zona: null, Q_relativo_aof: null, alerts: [], blocked: false },
  step3: S3_INIT,
  step4: S4_INIT,
  step5: S5_INIT,
  step6: S6_INIT,
  step7: S7_INIT,
  step8: S8_INIT,
  step9: S9_INIT,
  step10: S10_INIT,
  step11: S11_INIT,
  currentStep: 0,
  completedSteps: [],
  iterationLog: [],
  designStatus: 'in_progress',
};

// ─── Validación PASO 0 ────────────────────────────────────────────
function validateInputs(inp) {
  const errs = {};
  if (!inp.Pr || inp.Pr <= 0)              errs.Pr      = 'Pr debe ser > 0';
  if (inp.Pb > inp.Pr)                     errs.Pb      = 'Pb no puede superar Pr';
  if (inp.Pb <= 0)                         errs.Pb      = 'Pb debe ser > 0';
  if (inp.Pwf < 100 || inp.Pwf >= inp.Pr)  errs.Pwf     = 'Pwf debe estar entre 100 y Pr';
  if (!inp.IP || inp.IP <= 0)              errs.IP      = 'IP debe ser > 0';
  if (inp.D_bomba <= 0)                    errs.D_bomba = 'Profundidad de bomba > 0';
  if (inp.D_bomba >= inp.D_total)          errs.D_bomba = 'D_bomba debe ser < D_total';
  if (inp.D_total <= 0)                    errs.D_total = 'Profundidad total > 0';
  if (inp.GOR < 0)                         errs.GOR     = 'GOR ≥ 0';
  if (inp.BSW < 0 || inp.BSW > 98)         errs.BSW     = 'BSW entre 0 y 98';
  if (inp.T_fond <= inp.T_sup)             errs.T_fond  = 'T° fondo debe ser > T° superficial';
  if (inp.ID_cas <= 0)                     errs.ID_cas  = 'ID casing > 0';
  return errs;
}

// ─── Compute PASO 2 ───────────────────────────────────────────────
function computeStep2(inp) {
  const IP_stbd = inp.IP * IP_M3D_TO_STBD;
  const Q_stbd  = iprPwfToQ(inp.Pwf, inp.Pr, inp.Pb, IP_stbd);
  const Q_m3d   = Q_stbd * M3D_PER_STB;
  const AOF_m3d = calcAOF(inp.Pr, inp.Pb, IP_stbd) * M3D_PER_STB;
  const drawdown_pct = ((inp.Pr - inp.Pwf) / inp.Pr) * 100;
  const zona    = inp.Pwf >= inp.Pb ? 'Darcy' : 'Vogel';
  const Q_relativo_aof = AOF_m3d > 0 ? (Q_m3d / AOF_m3d) * 100 : 0;
  const alerts = [];
  let blocked = false;
  if (inp.Pwf < 0.10 * inp.Pr) { alerts.push({ type: 'danger', msg: 'BLOQUEO: Pwf < 10% Pr. Riesgo de compactación. Ajustar Pwf en PASO 0.' }); blocked = true; }
  if (inp.Pwf < 0.25 * inp.Pb)  alerts.push({ type: 'warning', msg: 'Pwf < 25% Pb — gas libre excesivo. Evaluar AGS desde el inicio.' });
  if (drawdown_pct > 85)         alerts.push({ type: 'warning', msg: `Drawdown alto (${drawdown_pct.toFixed(1)}%). Verificar límites de compactación.` });
  if (Q_m3d < 30)                alerts.push({ type: 'warning', msg: `Caudal bajo (${Q_m3d.toFixed(1)} m³/d). BES marginal.` });
  alerts.push({ type: zona === 'Vogel' ? 'warning' : 'ok', msg: zona === 'Vogel' ? `Zona Vogel (bifásica). Pwf (${inp.Pwf}) < Pb (${inp.Pb}).` : 'Zona Darcy (lineal). Fluido monofásico.' });
  return { Q_m3d, AOF_m3d, drawdown_pct, zona, Q_relativo_aof, alerts, blocked };
}

// ─── Compute PASO 3 ───────────────────────────────────────────────
function computeStep3(state, separador_tipo = null) {
  const inp  = state.inputs;
  const Q_m3d = state.step2.Q_m3d;

  // PIP
  const PIP_psi = calcPIP(inp.Pwf, inp.gamma, inp.D_total, inp.D_bomba);
  const pip_alts = pipAlerts(PIP_psi, inp.Pb);

  // GVF en succión (sin separador)
  const T_F_phys = inp.T_fond * 9 / 5 + 32;
  const GOR_scf  = inp.GOR * GOR_M3_TO_SCF;
  const gvfResult = gasVolumeFraction(GOR_scf, inp.Pb, PIP_psi, T_F_phys);
  const GVF_crudo = gvfResult.GVF;

  // Separador (CICLO A)
  let GVF_efectivo = GVF_crudo;
  let sep_alerts   = [];
  if (separador_tipo) {
    const sepResult  = gasSeparatorEfficiency(GVF_crudo, separador_tipo);
    GVF_efectivo = sepResult.GVF_out ?? GVF_crudo * (1 - (sepResult.efficiency ?? 0.5));
    sep_alerts   = [{ type: 'ok', msg: `Separador ${separador_tipo}: GVF reducido de ${(GVF_crudo * 100).toFixed(1)}% → ${(GVF_efectivo * 100).toFixed(1)}%` }];
  }

  // Corrección de viscosidad HI
  const viscCorr = hiViscosityCorrection(inp.visc);
  const H_factor = viscCorr.CH ?? 1.0;
  const Q_factor = viscCorr.CQ ?? 1.0;
  const eta_factor = viscCorr.CE ?? 1.0;
  const visc_correction_active = inp.visc > 5;

  // Volumen real en la bomba
  const volResult = realPumpVolume(Q_m3d, inp.BSW, inp.GOR, PIP_psi, inp.Pb, inp.T_fond);

  // Alertas consolidadas
  const alerts = [
    ...pip_alts,
    { type: GVF_crudo > 0.15 ? 'danger' : GVF_crudo > 0.10 ? 'warning' : 'ok',
      msg: gvfResult.message },
    ...sep_alerts,
  ];
  if (visc_correction_active) {
    alerts.push({ type: 'warning', msg: `Viscosidad ${inp.visc} cP — corrección HI activa: H×${H_factor.toFixed(2)}, Q×${Q_factor.toFixed(2)}, η×${eta_factor.toFixed(2)}` });
  }
  if (GVF_efectivo > 0.15 && !separador_tipo) {
    alerts.push({ type: 'danger', msg: 'GVF > 15% sin separador. CICLO A: seleccionar separador AGS o gas handler.' });
  }

  return {
    PIP_psi: +PIP_psi.toFixed(0), GVF_crudo: +GVF_crudo.toFixed(4),
    GVF_efectivo: +GVF_efectivo.toFixed(4),
    separador_tipo: separador_tipo || null,
    Q_total_m3d: volResult.Q_total_m3d, Q_liq_m3d: volResult.Q_liq_m3d,
    H_factor, Q_factor, eta_factor, visc_correction_active,
    iteraciones_cicloA: (state.step3.iteraciones_cicloA || 0) + (separador_tipo ? 1 : 0),
    alerts, completado: false,
  };
}

// ─── Compute PASO 4 ───────────────────────────────────────────────
function computeStep4(state, serie_id = null, f_manual = null) {
  const inp    = state.inputs;
  const s3     = state.step3;
  const Q_total = s3.Q_total_m3d;
  const rho_kgL = (inp.API > 0 ? 141.5 / (inp.API + 131.5) : 0.85) * (1 - inp.BSW / 100) + 1.025 * (inp.BSW / 100);

  // TDH corregido por PIP (H_static = D_bomba - PIP/gamma)
  const tdhRaw = tdhComponents(Q_total, inp.D_bomba, inp.WHP, D_IN_TUBING, inp.visc * s3.H_factor, rho_kgL);
  const H_static_corr = inp.D_bomba - (s3.PIP_psi / inp.gamma) * 0.3048;
  const TDH_m  = Math.max(0, H_static_corr + tdhRaw.H_friction_m + tdhRaw.H_back_m);
  const TDH_components = { ...tdhRaw, H_static_m: +H_static_corr.toFixed(1), TDH_m: +TDH_m.toFixed(1) };

  // Selección de serie
  const OD_max = state.step4.OD_max_constraint;
  const candidatos = selectPumpSeries(Q_total, pumpSeries.series, inp.f_red, OD_max);
  const serie = serie_id
    ? (pumpSeries.series.find(s => s.id === serie_id) ?? candidatos[0])
    : candidatos[0];

  // Frecuencia operativa
  const f_op = f_manual ?? serie?.f_opt ?? inp.f_red;

  // Etapas
  const { etapas, H_stage_m, TDH_disponible_m } = serie
    ? calcStages(TDH_m, serie, f_op)
    : { etapas: null, H_stage_m: null, TDH_disponible_m: null };

  // BEP ratio
  const bepCheck = serie ? checkBEPRatio(Q_total, serie, f_op) : { bep_ratio: null, bep_pct: null, status: 'ok', msg: '' };

  // HP hidráulico
  const HP_hid = calcMotorHP(Q_total, TDH_m, rho_kgL * 1000, 0.60 * (s3.eta_factor ?? 1));

  const alerts = [];
  if (bepCheck.status === 'blocked') alerts.push({ type: 'danger',  msg: bepCheck.msg });
  else if (bepCheck.status === 'warning') alerts.push({ type: 'warning', msg: bepCheck.msg });
  else if (bepCheck.status === 'ok')      alerts.push({ type: 'ok',      msg: bepCheck.msg });
  if (serie && inp.ID_cas < serie.OD_in + 1.0)
    alerts.push({ type: 'warning', msg: `Verificar holgura: OD bomba ${serie.OD_in}" en casing ${inp.ID_cas}". Confirmar en PASO 7.` });

  return {
    TDH_m: +TDH_m.toFixed(1), TDH_components,
    serie, etapas, H_stage_m, TDH_disponible_m,
    f_operativa: +f_op.toFixed(1),
    bep_ratio: bepCheck.bep_ratio, bep_pct: bepCheck.bep_pct,
    Ns: serie?.Ns_approx ?? null, tipo_impulsor: serie?.impeller_type ?? null,
    OD_bomba_in: serie?.OD_in ?? null, HP_hidraulico: HP_hid,
    OD_max_constraint: OD_max, candidatos,
    iteraciones_cicloB: (state.step4.iteraciones_cicloB || 0) + (serie_id || f_manual ? 1 : 0),
    alerts, completado: false,
  };
}

// ─── Compute PASO 5 ───────────────────────────────────────────────
function computeStep5(state, add_shroud = false) {
  const inp = state.inputs;
  const s3  = state.step3;
  const s4  = state.step4;
  const HP_req = s4.HP_hidraulico ?? 100;

  // Selección de motor
  const tier = selectMotorTier(HP_req);
  const HP_sel = HP_req;
  const V_motor = tier.V_typical;
  const I_nom   = calcMotorCurrent(HP_sel, V_motor, tier.FP, tier.eta);
  const OD_motor = tier.OD_in;
  const OD_shroud = add_shroud ? OD_motor + 0.5 : 0;

  // Velocidad anular (con o sin shroud — el shroud no cambia el area anular en este modelo simplificado)
  const Q_total = s3.Q_total_m3d ?? s4.TDH_m; // fallback
  const v_anular = calcAnnularVelocity(s3.Q_total_m3d ?? 100, inp.ID_cas, OD_motor);

  // Temperatura
  const T_op = estimateMotorTemp(inp.T_fond, v_anular);

  // Shroud
  const shroud = shroudDecision(v_anular, T_op, tier.T_rated_C);
  const shroud_req = add_shroud || shroud.shroud_required;

  const alerts = [];
  if (T_op >= tier.T_rated_C)
    alerts.push({ type: 'danger', msg: `T° motor (${T_op.toFixed(0)}°C) ≥ T° nominal (${tier.T_rated_C}°C). CICLO C: agregar shroud.` });
  else if (T_op >= tier.T_rated_C * 0.90)
    alerts.push({ type: 'warning', msg: `T° motor (${T_op.toFixed(0)}°C) cerca del límite. Monitorear.` });
  else
    alerts.push({ type: 'ok', msg: `T° motor (${T_op.toFixed(0)}°C) < T° nominal (${tier.T_rated_C}°C). OK.` });

  if (v_anular < 0.30)
    alerts.push({ type: 'warning', msg: `Velocidad anular ${v_anular.toFixed(2)} m/s < 0.30 m/s mínimo. ${shroud.reason}` });
  else
    alerts.push({ type: 'ok', msg: `Velocidad anular ${v_anular.toFixed(2)} m/s — refrigeración adecuada.` });

  if (shroud_req && !add_shroud)
    alerts.push({ type: 'warning', msg: 'CICLO C disponible: agregar shroud para mejorar refrigeración.' });

  return {
    HP_seleccionado: HP_sel, V_motor, I_nominal: +I_nom.toFixed(1),
    T_motor_op: +T_op.toFixed(1), T_rated_motor: tier.T_rated_C,
    v_fluido_anular: +v_anular.toFixed(3),
    shroud_requerido: shroud_req,
    OD_motor_in: OD_motor,
    OD_shroud_in: shroud_req ? OD_motor + 0.5 : null,
    iteraciones_cicloC: (state.step5.iteraciones_cicloC || 0) + (add_shroud ? 1 : 0),
    alerts, completado: false,
  };
}

// ─── Compute PASO 6 ───────────────────────────────────────────────
function computeStep6(state, awg_manual = null) {
  const inp = state.inputs;
  const s5  = state.step5;
  const I_nom   = Number.isFinite(s5.I_nominal) ? s5.I_nominal : 50;
  const V_motor = Number.isFinite(s5.V_motor)   ? s5.V_motor   : (inp.V_sup || 4160);
  const depth_ft = inp.D_bomba * 3.28084;

  // AWG: seleccionar por ampacidad o usar manual
  const CABLE_AMPACITY = { 1: 130, 2: 110, 4: 85, 6: 65, 8: 50, 10: 35, 12: 25, 14: 20 };
  const awg = awg_manual
    ?? Object.entries(CABLE_AMPACITY).find(([, amp]) => amp >= I_nom * 1.25)?.[0]
    ?? 4;
  const awg_num = parseInt(awg);

  // Caída de voltaje
  const dropResult = cableVoltageDrop(awg_num, depth_ft, I_nom, inp.T_fond, inp.T_sup);
  // Recalcular % contra V_motor (no la base 1000V simplificada)
  const V_drop_pct_real = (dropResult.V_drop_V / V_motor) * 100;

  // Aislamiento
  const matResult = materialRecommendation(inp.T_fond, inp.H2S, false);
  const aislamiento = matResult.cable_jacket ?? 'epdm_std';

  // Vida útil (Arrhenius)
  const life_factor = arrheniusLifeFactor(inp.T_fond + 5, 150).life_factor;

  // THD
  const thdResult = thdEstimate(inp.VSD);
  const cumple_ieee519 = (thdResult.THD_pct ?? 25) <= 5;

  // OD del cable
  const OD_cable = cableOD(awg_num);

  const alerts = [];
  if (V_drop_pct_real > 10)
    alerts.push({ type: 'danger',  msg: `Caída de voltaje ${V_drop_pct_real.toFixed(1)}% > 10%. CICLO D: cambiar a AWG mayor (número menor).` });
  else if (V_drop_pct_real > 5)
    alerts.push({ type: 'warning', msg: `Caída de voltaje ${V_drop_pct_real.toFixed(1)}% > 5%. Considera AWG mayor para mejorar eficiencia.` });
  else
    alerts.push({ type: 'ok',      msg: `Caída de voltaje ${V_drop_pct_real.toFixed(1)}% ≤ 5%. OK.` });

  if (!cumple_ieee519)
    alerts.push({ type: 'warning', msg: `THD ${(thdResult.THD_pct ?? 25).toFixed(0)}% supera límite IEEE 519-2014 (5%). Evaluar VSD multipulso o AFE.` });
  else
    alerts.push({ type: 'ok',      msg: `THD ${(thdResult.THD_pct ?? 3).toFixed(0)}% cumple IEEE 519-2014.` });

  if (life_factor < 0.5)
    alerts.push({ type: 'warning', msg: `Factor de vida útil Arrhenius: ${(life_factor * 100).toFixed(0)}% de la vida nominal. T° alta reduce el MTBF del cable.` });

  return {
    AWG: awg_num, V_drop_V: dropResult.V_drop_V,
    V_drop_pct: +V_drop_pct_real.toFixed(2),
    aislamiento_tipo: aislamiento, life_factor: +life_factor.toFixed(3),
    THD_pct: thdResult.THD_pct ?? 25, cumple_ieee519,
    OD_cable_in: OD_cable,
    iteraciones_cicloD: (state.step6.iteraciones_cicloD || 0) + (awg_manual ? 1 : 0),
    alerts, completado: false,
  };
}

// ─── Compute PASO 7 ───────────────────────────────────────────────
function computeStep7(state) {
  const inp = state.inputs;
  const s4  = state.step4;
  const s5  = state.step5;
  const s6  = state.step6;

  const OD_bomba  = s4.OD_bomba_in  ?? 4.0;
  const OD_motor  = s5.OD_motor_in  ?? 4.0;
  const OD_shroud = s5.OD_shroud_in ?? null;
  const OD_cable  = s6.OD_cable_in  ?? 1.0;
  const awg       = s6.AWG          ?? 4;

  const componentes = [
    { nombre: 'Bomba',   OD_in: OD_bomba,  aplica: true },
    { nombre: 'Motor',   OD_in: OD_motor,  aplica: true },
    { nombre: 'Shroud',  OD_in: OD_shroud ?? 0, aplica: !!OD_shroud },
    { nombre: 'Cable',   OD_in: OD_cable,  aplica: true },
  ];

  const OD_string = calcMaxODString(componentes);
  const { holgura_mm, cabe } = calcClearance(inp.ID_cas, OD_string);
  const dogleg = doglegCheck(inp.Dev, awg);
  const decision = clearanceDecision(holgura_mm, dogleg.cumple);

  const alerts = [
    { type: decision.status === 'ok' ? 'ok' : decision.status === 'conditional' ? 'warning' : 'danger',
      msg: decision.msg },
    { type: dogleg.cumple ? 'ok' : 'warning', msg: dogleg.msg },
  ];

  return {
    OD_string_in: +OD_string.toFixed(3), componentes,
    holgura_mm: +holgura_mm.toFixed(1),
    dogleg_ok: dogleg.cumple, dogleg_admisible: dogleg.dogleg_admisible,
    status: decision.status,
    iteraciones_cicloE: state.step7.iteraciones_cicloE || 0,
    alerts, completado: false,
  };
}

// ─── Compute PASO 8 ───────────────────────────────────────────────
function computeStep8(state) {
  const inp = state.inputs;
  const s3  = state.step3;
  const s5  = state.step5;
  const s6  = state.step6;

  const GVF_ef   = s3.GVF_efectivo ?? 0;
  const v_anular = s5.v_fluido_anular ?? 1;
  const T_op     = s5.T_motor_op ?? 0;
  const T_rated  = s5.T_rated_motor ?? 150;
  const life_f   = s6.life_factor ?? 1;

  const risk = (nombre, indicador, valor_display, estado, mitigacion) =>
    ({ nombre, indicador, valor_display, estado, mitigacion });

  const riesgos = [
    risk(
      'Gas lock',
      'GVF efectivo en succión',
      `${(GVF_ef * 100).toFixed(1)}%`,
      GVF_ef > 0.20 ? 'danger' : GVF_ef > 0.10 ? 'warning' : 'ok',
      GVF_ef > 0.10
        ? (s3.separador_tipo ? `Separador ${s3.separador_tipo} instalado (PASO 3)` : 'Instalar AGS rotativo o gas handler (PASO 3)')
        : 'Sin riesgo',
    ),
    risk(
      'Sobrecalentamiento motor',
      'Velocidad anular del fluido',
      `${v_anular.toFixed(2)} m/s`,
      v_anular < 0.30 ? 'danger' : v_anular < 0.50 ? 'warning' : 'ok',
      v_anular < 0.50
        ? (s5.shroud_requerido ? 'Shroud instalado (PASO 5)' : 'Agregar shroud de circulación forzada')
        : 'Refrigeración adecuada',
    ),
    risk(
      'Degradación de aislamiento',
      'T_motor / T_nominal',
      `${(T_op / T_rated).toFixed(2)} (${T_op.toFixed(0)}°C / ${T_rated}°C)`,
      T_op / T_rated > 1.0 ? 'danger' : T_op / T_rated > 0.85 ? 'warning' : 'ok',
      T_op / T_rated > 0.85 ? 'Verificar clase de aislamiento del cable (PASO 6)' : 'Aislamiento dentro de límite',
    ),
    risk(
      'Corrosión por H₂S',
      'Presencia de gas amargo',
      inp.H2S ? 'Sí — H₂S presente' : 'No',
      inp.H2S ? 'warning' : 'ok',
      inp.H2S ? 'Lead Sheath + Monel 400 requeridos — NACE MR0175 (PASO 6)' : 'Sin riesgo de H₂S',
    ),
    risk(
      'Incrustaciones (scale)',
      'API < 25 y BSW > 30%',
      `API ${inp.API}°, BSW ${inp.BSW}%`,
      (inp.API < 25 && inp.BSW > 30) ? 'warning' : 'ok',
      (inp.API < 25 && inp.BSW > 30) ? 'Programa de inhibidor de scale / tratamiento químico' : 'Sin combinación de riesgo',
    ),
    risk(
      'Abrasión por sólidos',
      'Contenido de sólidos',
      inp.solidos,
      inp.solidos === 'Alto' ? 'danger' : inp.solidos === 'Medio' ? 'warning' : 'ok',
      inp.solidos !== 'Bajo' ? 'Bomba con recubrimiento de tungsteno / impulsores de alta dureza' : 'Sin riesgo de abrasión',
    ),
    risk(
      'Emulsión',
      'BSW × viscosidad',
      `${inp.BSW}% × ${inp.visc} cP = ${(inp.BSW * inp.visc).toFixed(0)}`,
      (inp.BSW * inp.visc) > 300 ? 'warning' : 'ok',
      (inp.BSW * inp.visc) > 300 ? 'Tratamiento de emulsión / rompe-emulsión en cabezal' : 'Sin riesgo de emulsión significativo',
    ),
    risk(
      'Fatiga por vibración',
      'Desviación del pozo',
      `${inp.Dev}°/30m`,
      inp.Dev > 20 ? 'warning' : 'ok',
      inp.Dev > 20 ? 'Centralizers y reducción de frecuencia de operación (PASO 9)' : 'Desviación dentro del rango aceptable',
    ),
    risk(
      'Slugging / flujo intermitente',
      'GOR alto + BSW variable',
      `GOR ${inp.GOR} m³/m³, BSW ${inp.BSW}%`,
      (inp.GOR > 100 && inp.BSW > 40) ? 'warning' : 'ok',
      (inp.GOR > 100 && inp.BSW > 40) ? 'Control adaptativo VSD — ajustar set points de undercurrent (PASO 9)' : 'Sin indicadores de slugging severo',
    ),
  ];

  const hay_riesgo_critico = riesgos.some(r => r.estado === 'danger');
  const hay_advertencia     = riesgos.some(r => r.estado === 'warning');
  const resumen_estado      = hay_riesgo_critico ? 'danger' : hay_advertencia ? 'warning' : 'ok';

  const alerts = [];
  riesgos.filter(r => r.estado !== 'ok').forEach(r =>
    alerts.push({ type: r.estado, msg: `${r.nombre}: ${r.valor_display} — ${r.mitigacion}` })
  );
  if (alerts.length === 0)
    alerts.push({ type: 'ok', msg: 'Todos los indicadores de riesgo dentro de límites aceptables.' });

  return { riesgos, resumen_estado, hay_riesgo_critico, iteraciones_cicloF: state.step8.iteraciones_cicloF, alerts, completado: false };
}

// ─── Compute PASO 9 ───────────────────────────────────────────────
function computeStep9(state) {
  const s4 = state.step4;
  const s5 = state.step5;
  const s3 = state.step3;

  const f_op    = s4.f_operativa ?? 60;
  const I_nom   = s5.I_nominal   ?? 50;
  const T_op    = s5.T_motor_op  ?? 80;
  const PIP     = s3.PIP_psi     ?? 500;

  const f_arranque    = Math.max(35, f_op * 0.67);
  const rampa_Hz_min  = f_op < 55 ? 0.5 : 1.0;

  const setpoints = {
    sobrecorriente:   +(I_nom * 1.15).toFixed(1),
    undercurrent:     +(I_nom * 0.75).toFixed(1),
    T_max_motor:      +(T_op + 10).toFixed(0),
    PIP_min:          +(PIP * 0.70).toFixed(0),
    vibracion_alerta: 4.0,
    vibracion_paro:   8.0,
  };

  const monitoreo = {
    carta_amperimetrica: true,
    P_T_downhole:        true,
    vibracion:           true,
    THD_superficie:      state.inputs.VSD !== 'afe',
  };

  const alerts = [
    { type: 'ok', msg: `Frecuencia de arranque: ${f_arranque.toFixed(0)} Hz — rampa ${rampa_Hz_min} Hz/min` },
    { type: 'ok', msg: `Sobrecorriente: ${setpoints.sobrecorriente} A · Undercurrent: ${setpoints.undercurrent} A` },
    { type: 'ok', msg: `T° máxima motor: ${setpoints.T_max_motor}°C · PIP mínimo: ${setpoints.PIP_min} psi` },
  ];

  return {
    f_arranque: +f_arranque.toFixed(1), rampa_Hz_min,
    setpoints, monitoreo, alerts, completado: false,
  };
}

// ─── Compute PASO 10 ──────────────────────────────────────────────
function computeStep10(state) {
  const inp = state.inputs;
  const s3  = state.step3;
  const s5  = state.step5;
  const s2  = state.step2;

  const MTBF_base = 912; // días — benchmark educativo para BES estándar [SIMPLIFIED]

  const factor_gas     = (s3.GVF_efectivo ?? 0) > 0.15 ? 0.85 : 1.0;
  const factor_T       = s5.T_motor_op > s5.T_rated_motor * 0.9 ? 0.80 : 1.0;
  const factor_solidos = inp.solidos === 'Alto' ? 0.70 : inp.solidos === 'Medio' ? 0.90 : 1.0;
  const factor_H2S     = inp.H2S ? 0.60 : 1.0;
  const factor_total   = +(factor_gas * factor_T * factor_solidos * factor_H2S).toFixed(3);

  const run_life_dias  = +(MTBF_base * factor_total).toFixed(0);
  const R_at_runlife   = +Math.exp(-run_life_dias / MTBF_base).toFixed(4);

  const HP = s5.HP_seleccionado ?? 100;
  const capex_categoria = HP < 100 ? 'Bajo' : HP < 300 ? 'Medio' : HP < 500 ? 'Alto' : 'Muy Alto';

  const capex_extras = [];
  if (inp.H2S)               capex_extras.push('+20–30% por materiales NACE (H₂S)');
  if (inp.T_fond > 150)      capex_extras.push('+15–25% por equipo de alta temperatura');
  if ((s3.GVF_efectivo ?? 0) > 0.15 && s3.separador_tipo)
                             capex_extras.push('+10–15% por separador de gas AGS');
  if (s5.shroud_requerido)   capex_extras.push('+5–10% por shroud de circulación');

  const alerts = [
    { type: 'ok', msg: `Run life estimada: ${run_life_dias} días (${(run_life_dias / 365).toFixed(1)} años)` },
    { type: factor_total < 0.7 ? 'danger' : factor_total < 0.9 ? 'warning' : 'ok',
      msg: `Factor de penalización total: ${(factor_total * 100).toFixed(0)}% del MTBF base (${MTBF_base} días)` },
    { type: 'ok', msg: `CAPEX orientativo: categoría ${capex_categoria}${capex_extras.length ? ' — con extras' : ''}` },
  ];

  return {
    Q_esperado: s2.Q_m3d, MTBF_base,
    run_life_dias, R_at_runlife,
    factores: { factor_gas, factor_T, factor_solidos, factor_H2S, factor_total },
    capex_categoria, capex_extras, alerts, completado: false,
  };
}

// ─── Reducer ─────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'UPDATE_INPUT': {
      const newInputs = { ...state.inputs, [action.field]: action.value };
      return { ...initialState, inputs: newInputs };
    }

    case 'LOAD_INPUTS': {
      const merged = { ...initialState.inputs, ...action.inputs };
      return { ...initialState, inputs: merged };
    }

    case 'LOAD_STATE': {
      // Restaura estado completo (inputs + paso actual + pasos completados + resultados)
      return { ...initialState, ...action.state };
    }

    case 'VALIDATE_STEP_0': {
      const errors = validateInputs(state.inputs);
      return { ...state, step0: { valid: Object.keys(errors).length === 0, errors } };
    }

    case 'ADVANCE_TO_STEP_1': {
      if (!state.step0.valid) return state;
      const s2 = computeStep2(state.inputs);
      const { criterios, verdict, sistemasAlternativos } = evaluateBESCandidacy(state.inputs, s2.Q_m3d);
      return {
        ...state,
        step2: { ...s2, completado: false },
        step1: { completado: true, verdict, criterios, sistemasAlternativos },
        currentStep: 1,
        completedSteps: [...new Set([...state.completedSteps, 0])],
      };
    }

    case 'ADVANCE_TO_STEP_2': {
      if (state.step1.verdict === 'rejected') return state;
      const s2 = computeStep2(state.inputs);
      return {
        ...state,
        step2: { ...s2, completado: false },
        currentStep: 2,
        completedSteps: [...new Set([...state.completedSteps, 0, 1])],
      };
    }

    case 'COMPLETE_STEP_2': {
      if (state.step2.blocked) return state;
      return { ...state, step2: { ...state.step2, completado: true }, completedSteps: [...new Set([...state.completedSteps, 2])] };
    }

    case 'ADVANCE_TO_STEP_3': {
      if (!state.step2.completado) return state;
      const s3 = computeStep3(state);
      return { ...state, step3: s3, currentStep: 3, completedSteps: [...new Set([...state.completedSteps, 2])] };
    }

    case 'CICLO_A_SELECT_SEPARATOR': {
      const s3 = computeStep3(state, action.separadorTipo);
      const logEntry = { ciclo: 'A', paso: 3, condicion: `GVF ${(state.step3.GVF_crudo * 100).toFixed(1)}% > 15%`, accion: `Instalar ${action.separadorTipo}`, resultado: `GVF efectivo → ${(s3.GVF_efectivo * 100).toFixed(1)}%`, idx: state.iterationLog.length };
      return { ...state, step3: s3, iterationLog: [...state.iterationLog, logEntry] };
    }

    case 'COMPLETE_STEP_3': {
      if (state.step3.GVF_efectivo > 0.50) return state;
      return { ...state, step3: { ...state.step3, completado: true }, completedSteps: [...new Set([...state.completedSteps, 3])] };
    }

    case 'ADVANCE_TO_STEP_4': {
      if (!state.step3.completado) return state;
      const s4 = computeStep4(state);
      return { ...state, step4: s4, currentStep: 4, completedSteps: [...new Set([...state.completedSteps, 3])] };
    }

    case 'CICLO_B_ADJUST_FREQUENCY': {
      const s4 = computeStep4(state, state.step4.serie?.id, action.f_nueva);
      const log = { ciclo: 'B', paso: 4, condicion: `BEP ratio ${state.step4.bep_pct}%`, accion: `Frecuencia → ${action.f_nueva} Hz`, resultado: `BEP ratio → ${s4.bep_pct}%`, idx: state.iterationLog.length };
      return { ...state, step4: s4, iterationLog: [...state.iterationLog, log] };
    }

    case 'CICLO_B_CHANGE_SERIES': {
      const s4 = computeStep4(state, action.serie_id, null);
      const log = { ciclo: 'B', paso: 4, condicion: `Serie actual: ${state.step4.serie?.name}`, accion: `Cambiar a ${action.serie_id}`, resultado: `BEP ratio → ${s4.bep_pct}%`, idx: state.iterationLog.length };
      return { ...state, step4: s4, iterationLog: [...state.iterationLog, log] };
    }

    case 'COMPLETE_STEP_4': {
      const bp = state.step4.bep_pct;
      if (!bp || bp < 70 || bp > 130) return state;
      return { ...state, step4: { ...state.step4, completado: true }, completedSteps: [...new Set([...state.completedSteps, 4])] };
    }

    case 'ADVANCE_TO_STEP_5': {
      if (!state.step4.completado) return state;
      const s5 = computeStep5(state);
      return { ...state, step5: s5, currentStep: 5, completedSteps: [...new Set([...state.completedSteps, 4])] };
    }

    case 'CICLO_C_ADD_SHROUD': {
      const s5 = computeStep5(state, true);
      const log = { ciclo: 'C', paso: 5, condicion: `T° ${state.step5.T_motor_op}°C / v ${state.step5.v_fluido_anular} m/s`, accion: 'Agregar shroud', resultado: `OD shroud: ${s5.OD_shroud_in}"`, idx: state.iterationLog.length };
      return { ...state, step5: s5, iterationLog: [...state.iterationLog, log] };
    }

    case 'COMPLETE_STEP_5': {
      if (state.step5.T_motor_op >= state.step5.T_rated_motor) return state;
      return { ...state, step5: { ...state.step5, completado: true }, completedSteps: [...new Set([...state.completedSteps, 5])] };
    }

    case 'ADVANCE_TO_STEP_6': {
      if (!state.step5.completado) return state;
      const s6 = computeStep6(state);
      return { ...state, step6: s6, currentStep: 6, completedSteps: [...new Set([...state.completedSteps, 5])] };
    }

    case 'CICLO_D_CHANGE_AWG': {
      const s6 = computeStep6(state, action.awg);
      const log = { ciclo: 'D', paso: 6, condicion: `Caída ${state.step6.V_drop_pct}%`, accion: `AWG ${state.step6.AWG} → AWG ${action.awg}`, resultado: `Caída → ${s6.V_drop_pct}%`, idx: state.iterationLog.length };
      return { ...state, step6: s6, iterationLog: [...state.iterationLog, log] };
    }

    case 'COMPLETE_STEP_6': {
      return { ...state, step6: { ...state.step6, completado: true }, completedSteps: [...new Set([...state.completedSteps, 6])] };
    }

    case 'ADVANCE_TO_STEP_7': {
      if (!state.step6.completado) return state;
      const s7 = computeStep7(state);
      return { ...state, step7: s7, currentStep: 7, completedSteps: [...new Set([...state.completedSteps, 6])] };
    }

    case 'CICLO_E_REDUCE_OD': {
      // Calcula el OD máximo admisible y regresa a PASO 4
      const holgura_actual = state.step7.holgura_mm;
      const deficit_in = (6 - holgura_actual) / 25.4 * 2; // pulgadas de OD a reducir
      const OD_max = state.step7.OD_string_in - deficit_in - 0.1;
      const log = { ciclo: 'E', paso: 7, condicion: `Holgura ${state.step7.holgura_mm} mm insuficiente`, accion: `Establecer OD_max = ${OD_max.toFixed(2)}"`, resultado: 'Regresando a PASO 4', idx: state.iterationLog.length };
      return {
        ...state,
        step4: { ...S4_INIT, OD_max_constraint: +OD_max.toFixed(2) },
        step5: S5_INIT,
        step6: S6_INIT,
        step7: { ...S7_INIT, iteraciones_cicloE: state.step7.iteraciones_cicloE + 1 },
        currentStep: 4,
        completedSteps: state.completedSteps.filter(s => s < 4),
        iterationLog: [...state.iterationLog, log],
      };
    }

    case 'COMPLETE_STEP_7': {
      if (state.step7.status === 'blocked') return state;
      return { ...state, step7: { ...state.step7, completado: true }, completedSteps: [...new Set([...state.completedSteps, 7])], designStatus: 'in_progress' };
    }

    case 'ADVANCE_TO_STEP_8': {
      if (!state.step7.completado) return state;
      const s8 = computeStep8(state);
      return { ...state, step8: s8, currentStep: 8, completedSteps: [...new Set([...state.completedSteps, 7])] };
    }

    case 'COMPLETE_STEP_8': {
      return { ...state, step8: { ...state.step8, completado: true }, completedSteps: [...new Set([...state.completedSteps, 8])] };
    }

    case 'ADVANCE_TO_STEP_9': {
      if (!state.step8.completado) return state;
      const s9 = computeStep9(state);
      return { ...state, step9: s9, currentStep: 9, completedSteps: [...new Set([...state.completedSteps, 8])] };
    }

    case 'COMPLETE_STEP_9': {
      return { ...state, step9: { ...state.step9, completado: true }, completedSteps: [...new Set([...state.completedSteps, 9])] };
    }

    case 'ADVANCE_TO_STEP_10': {
      if (!state.step9.completado) return state;
      const s10 = computeStep10(state);
      return { ...state, step10: s10, currentStep: 10, completedSteps: [...new Set([...state.completedSteps, 9])] };
    }

    case 'COMPLETE_STEP_10': {
      return { ...state, step10: { ...state.step10, completado: true }, completedSteps: [...new Set([...state.completedSteps, 10])] };
    }

    case 'ADVANCE_TO_STEP_11': {
      if (!state.step10.completado) return state;
      return { ...state, step11: { completado: false, datasheet_ready: true }, currentStep: 11, completedSteps: [...new Set([...state.completedSteps, 10])] };
    }

    case 'COMPLETE_STEP_11': {
      return { ...state, step11: { completado: true, datasheet_ready: true }, completedSteps: [...new Set([...state.completedSteps, 11])], designStatus: 'approved' };
    }

    case 'JUMP_TO_STEP': {
      const targetOk = state.completedSteps.includes(action.step) || action.step === state.currentStep;
      if (!targetOk) return state;
      return { ...state, currentStep: action.step };
    }

    default: return state;
  }
}

// ─── Hook público ─────────────────────────────────────────────────
export function useBESDesign() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return {
    state,
    updateInput:         (f, v) => dispatch({ type: 'UPDATE_INPUT', field: f, value: v }),
    loadInputs:          (inputs) => dispatch({ type: 'LOAD_INPUTS', inputs }),
    loadState:           (st)    => dispatch({ type: 'LOAD_STATE', state: st }),
    validateStep0:       ()     => dispatch({ type: 'VALIDATE_STEP_0' }),
    advanceStep1:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_1' }),
    advanceStep2:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_2' }),
    completeStep2:       ()     => dispatch({ type: 'COMPLETE_STEP_2' }),
    advanceStep3:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_3' }),
    cicloA:              (sep)  => dispatch({ type: 'CICLO_A_SELECT_SEPARATOR', separadorTipo: sep }),
    completeStep3:       ()     => dispatch({ type: 'COMPLETE_STEP_3' }),
    advanceStep4:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_4' }),
    cicloB_freq:         (f)    => dispatch({ type: 'CICLO_B_ADJUST_FREQUENCY', f_nueva: f }),
    cicloB_serie:        (id)   => dispatch({ type: 'CICLO_B_CHANGE_SERIES', serie_id: id }),
    completeStep4:       ()     => dispatch({ type: 'COMPLETE_STEP_4' }),
    advanceStep5:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_5' }),
    cicloC:              ()     => dispatch({ type: 'CICLO_C_ADD_SHROUD' }),
    completeStep5:       ()     => dispatch({ type: 'COMPLETE_STEP_5' }),
    advanceStep6:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_6' }),
    cicloD:              (awg)  => dispatch({ type: 'CICLO_D_CHANGE_AWG', awg }),
    completeStep6:       ()     => dispatch({ type: 'COMPLETE_STEP_6' }),
    advanceStep7:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_7' }),
    cicloE:              ()     => dispatch({ type: 'CICLO_E_REDUCE_OD' }),
    completeStep7:       ()     => dispatch({ type: 'COMPLETE_STEP_7' }),
    advanceStep8:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_8' }),
    completeStep8:       ()     => dispatch({ type: 'COMPLETE_STEP_8' }),
    advanceStep9:        ()     => dispatch({ type: 'ADVANCE_TO_STEP_9' }),
    completeStep9:       ()     => dispatch({ type: 'COMPLETE_STEP_9' }),
    advanceStep10:       ()     => dispatch({ type: 'ADVANCE_TO_STEP_10' }),
    completeStep10:      ()     => dispatch({ type: 'COMPLETE_STEP_10' }),
    advanceStep11:       ()     => dispatch({ type: 'ADVANCE_TO_STEP_11' }),
    completeStep11:      ()     => dispatch({ type: 'COMPLETE_STEP_11' }),
    jumpToStep:          (s)    => dispatch({ type: 'JUMP_TO_STEP', step: s }),
  };
}
