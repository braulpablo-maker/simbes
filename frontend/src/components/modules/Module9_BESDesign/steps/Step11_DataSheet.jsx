/**
 * SIMBES — M9 PASO 11: Hoja de Selección BES
 * ============================================
 * Documento de solo lectura que resume todas las decisiones de diseño
 * tomadas a lo largo del asistente (Pasos 0–10 + log de iteraciones).
 * Formato: "selection sheet" industrial en JetBrains Mono.
 */

import { C } from '../../../../theme';

/* ─── Sub-componentes ─────────────────────────────────── */

function SectionHeader({ letter, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      borderBottom: `1px solid ${C.indigo}40`, paddingBottom: 6, marginBottom: 14,
    }}>
      <span style={{
        background: `${C.indigo}20`, border: `1px solid ${C.indigo}50`,
        color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 4,
        letterSpacing: 1,
      }}>{letter}</span>
      <span style={{
        color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 700, fontSize: 12, letterSpacing: 0.5,
      }}>{title}</span>
    </div>
  );
}

function Row({ label, value, unit = '', color = C.text }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr',
      borderBottom: `1px solid ${C.border}`, padding: '5px 0',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
    }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ color }}>
        {value !== null && value !== undefined ? `${value}` : '—'}
        {unit && value !== null && value !== undefined ? <span style={{ color: C.muted }}> {unit}</span> : null}
      </span>
    </div>
  );
}

function Section({ children, style }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: '16px 20px', marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function estadoEmoji(estado) {
  if (estado === 'ok')      return '✅';
  if (estado === 'warning') return '⚠️';
  return '❌';
}

function estadoColor(estado) {
  if (estado === 'ok')      return C.ok;
  if (estado === 'warning') return C.warning;
  return C.danger;
}

function boolLabel(v) {
  if (v === true)  return 'Si';
  if (v === false) return 'No';
  return '—';
}

/* ─── Componente principal ───────────────────────────── */

export default function Step11_DataSheet({ inputs, state }) {
  const {
    step1, step2, step3, step4, step5, step6,
    step7, step8, step9, step10, iterationLog,
  } = state ?? {};

  const inp = inputs ?? {};
  const s2  = step2  ?? {};
  const s3  = step3  ?? {};
  const s4  = step4  ?? {};
  const s5  = step5  ?? {};
  const s6  = step6  ?? {};
  const s7  = step7  ?? {};
  const s8  = step8  ?? {};
  const s9  = step9  ?? {};
  const s10 = step10 ?? {};
  const log = iterationLog ?? [];

  const today = new Date().toLocaleDateString('es-AR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const sp  = s9.setpoints  ?? {};
  const f   = s10.factores  ?? {};
  const mon = s9.monitoreo  ?? {};
  const serie = s4.serie ?? {};

  return (
    <div id="step11-sheet" style={{ padding: '24px 0', fontFamily: 'JetBrains Mono, monospace' }}>

      {/* Header bar */}
      <div style={{
        background: `${C.indigo}18`, border: `1px solid ${C.indigo}40`,
        borderRadius: 8, padding: '14px 20px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ color: C.indigo, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
          HOJA DE SELECCION BES — SIMBES M9
        </span>
        <span style={{ color: C.muted, fontSize: 10 }}>
          Generado: {today}
        </span>
      </div>

      {/* A — DATOS DEL POZO */}
      <Section>
        <SectionHeader letter="A" title="DATOS DEL POZO" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <Row label="Presión estática (Pr)"        value={inp.Pr}      unit="psi" />
          <Row label="Presión de burbuja (Pb)"      value={inp.Pb}      unit="psi" />
          <Row label="Índice de productividad (IP)" value={inp.IP}      unit="STB/d/psi" />
          <Row label="Pwf objetivo"                 value={inp.Pwf}     unit="psi" />
          <Row label="Diámetro bomba (D_bomba)"     value={inp.D_bomba} unit="in" />
          <Row label="Profundidad total (D_total)"  value={inp.D_total} unit="ft" />
          <Row label="Temperatura de fondo (T_fond)" value={inp.T_fond}  unit="°C" />
          <Row label="ID casing (ID_cas)"           value={inp.ID_cas}  unit="in" />
          <Row label="GOR"                          value={inp.GOR}     unit="scf/STB" />
          <Row label="BSW"                          value={inp.BSW}     unit="%" />
          <Row label="Gravedad API"                 value={inp.API}     unit="°API" />
          <Row label="H₂S"                         value={inp.H2S}     unit="ppm" />
          <Row label="Sólidos"                      value={inp.solidos} unit="ppm" />
        </div>
      </Section>

      {/* B — CAUDAL DE DISEÑO */}
      <Section>
        <SectionHeader letter="B" title="CAUDAL DE DISEÑO" />
        <Row label="Caudal de diseño (Q)"    value={s2.Q_m3d}        unit="m³/d" color={C.indigo} />
        <Row label="AOF"                     value={s2.AOF_m3d}      unit="m³/d" />
        <Row label="Drawdown"                value={s2.drawdown_pct !== null && s2.drawdown_pct !== undefined ? s2.drawdown_pct.toFixed(1) : null} unit="%" />
        <Row label="Zona IPR"                value={s2.zona_ipr}     />
      </Section>

      {/* C — CONDICIONES EN BOMBA */}
      <Section>
        <SectionHeader letter="C" title="CONDICIONES EN BOMBA" />
        <Row label="PIP"                     value={s3.PIP_psi}          unit="psi" />
        <Row label="GVF crudo"               value={s3.GVF_crudo !== null && s3.GVF_crudo !== undefined ? s3.GVF_crudo.toFixed(1) : null}   unit="%" />
        <Row label="GVF efectivo"            value={s3.GVF_efectivo !== null && s3.GVF_efectivo !== undefined ? s3.GVF_efectivo.toFixed(1) : null} unit="%" />
        <Row label="Separador"               value={s3.separador_tipo}   />
        <Row label="Q total bomba"           value={s3.Q_total_m3d}      unit="m³/d" />
        <Row label="Corrección viscosidad"   value={s3.correccion_visc !== undefined ? boolLabel(s3.correccion_visc) : null} />
      </Section>

      {/* D — SISTEMA DE BOMBEO */}
      <Section>
        <SectionHeader letter="D" title="SISTEMA DE BOMBEO" />
        <Row label="Serie de bomba"          value={serie.name}              color={C.indigo} />
        <Row label="Número de etapas"        value={s4.etapas}               unit="etapas" />
        <Row label="TDH"                     value={s4.TDH_m}                unit="m" />
        <Row label="Frecuencia operativa"    value={s4.f_operativa}          unit="Hz" />
        <Row label="Operación vs BEP"        value={s4.bep_pct !== null && s4.bep_pct !== undefined ? s4.bep_pct.toFixed(1) : null} unit="%" />
        <Row label="Tipo de impulsor"        value={s4.tipo_impulsor}        />
      </Section>

      {/* E — MOTOR */}
      <Section>
        <SectionHeader letter="E" title="MOTOR" />
        <Row label="Potencia seleccionada"   value={s5.HP_seleccionado}      unit="HP" />
        <Row label="Voltaje motor"           value={s5.V_motor}              unit="V" />
        <Row label="Corriente nominal"       value={s5.I_nominal}            unit="A" />
        <Row label="Temperatura operativa"   value={s5.T_motor_op}           unit="°C" />
        <Row label="Vel. fluido anular"      value={s5.v_fluido_anular !== null && s5.v_fluido_anular !== undefined ? s5.v_fluido_anular.toFixed(2) : null} unit="m/s" />
        <Row label="Shroud requerido"        value={s5.shroud_requerido !== undefined ? boolLabel(s5.shroud_requerido) : null} />
      </Section>

      {/* F — CABLE ELÉCTRICO */}
      <Section>
        <SectionHeader letter="F" title="CABLE ELÉCTRICO" />
        <Row label="Calibre AWG"             value={s6.AWG !== null && s6.AWG !== undefined ? `#${s6.AWG}` : null} />
        <Row label="Caída de voltaje"        value={s6.V_drop_pct !== null && s6.V_drop_pct !== undefined ? s6.V_drop_pct.toFixed(1) : null} unit="%" />
        <Row label="Tipo de aislamiento"     value={s6.aislamiento_tipo}     />
        <Row label="THD"                     value={s6.THD_pct !== null && s6.THD_pct !== undefined ? s6.THD_pct.toFixed(1) : null} unit="%" />
        <Row label="Cumple IEEE 519"         value={s6.cumple_ieee519 !== undefined ? boolLabel(s6.cumple_ieee519) : null}
          color={s6.cumple_ieee519 === true ? C.ok : s6.cumple_ieee519 === false ? C.danger : C.muted} />
        <Row label="Factor vida útil"        value={s6.life_factor !== null && s6.life_factor !== undefined ? s6.life_factor.toFixed(2) : null} />
      </Section>

      {/* G — VERIFICACIÓN MECÁNICA */}
      <Section>
        <SectionHeader letter="G" title="VERIFICACION MECANICA" />
        <Row label="OD máx. string"          value={s7.OD_string_in !== null && s7.OD_string_in !== undefined ? s7.OD_string_in.toFixed(3) : null} unit="in" />
        <Row label="Holgura anular"          value={s7.holgura_mm !== null && s7.holgura_mm !== undefined ? s7.holgura_mm.toFixed(1) : null} unit="mm"
          color={s7.holgura_mm < 6 ? C.danger : s7.holgura_mm < 12 ? C.warning : C.ok} />
        <Row label="Dogleg OK"               value={s7.dogleg_ok !== undefined ? boolLabel(s7.dogleg_ok) : null}
          color={s7.dogleg_ok === true ? C.ok : s7.dogleg_ok === false ? C.danger : C.muted} />
      </Section>

      {/* H — RIESGOS */}
      <Section>
        <SectionHeader letter="H" title="RIESGOS OPERATIVOS" />
        <Row
          label="Estado general"
          value={s8.resumen_estado ? s8.resumen_estado.toUpperCase() : null}
          color={estadoColor(s8.resumen_estado)}
        />
        <Row
          label="Riesgo crítico"
          value={s8.hay_riesgo_critico !== undefined ? (s8.hay_riesgo_critico ? 'SI' : 'No') : null}
          color={s8.hay_riesgo_critico ? C.danger : C.ok}
        />
        {(s8.riesgos ?? []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 8 }}>DETALLE DE RIESGOS</div>
            {s8.riesgos.map((r, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '4px 0', borderBottom: `1px solid ${C.border}`,
                fontSize: 10,
              }}>
                <span>{estadoEmoji(r.estado)}</span>
                <span style={{ color: estadoColor(r.estado), fontWeight: 700, minWidth: 160 }}>{r.nombre}</span>
                <span style={{ color: C.text }}>{r.valor_display}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* I — SET POINTS */}
      <Section>
        <SectionHeader letter="I" title="SET POINTS DE OPERACION" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 40px' }}>
          <Row label="Frecuencia arranque"    value={s9.f_arranque}      unit="Hz" />
          <Row label="Rampa aceleración"      value={s9.rampa_Hz_min}    unit="Hz/min" />
          <Row label="Sobrecorriente"         value={sp.sobrecorriente}  unit="A" />
          <Row label="Undercurrent"           value={sp.undercurrent}    unit="A" />
          <Row label="T° máx motor"           value={sp.T_max_motor}     unit="°C" />
          <Row label="PIP mínimo"             value={sp.PIP_min}         unit="psi" />
          <Row label="Vibración alerta"       value={sp.vibracion_alerta ?? 4.0} unit="mm/s RMS" />
          <Row label="Vibración paro"         value={sp.vibracion_paro   ?? 8.0} unit="mm/s RMS" />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>MONITOREO ACTIVO</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 10 }}>
            {[
              { label: 'Carta amperométrica', key: 'carta_amperimetrica' },
              { label: 'P/T downhole',        key: 'P_T_downhole' },
              { label: 'Vibración',           key: 'vibracion' },
              { label: 'THD superficie',      key: 'THD_superficie' },
            ].map(({ label, key }) => (
              <span key={key} style={{ color: mon[key] ? C.ok : C.muted }}>
                {mon[key] ? '✅' : '—'} {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* J — EVALUACIÓN TÉCNICO-ECONÓMICA */}
      <Section>
        <SectionHeader letter="J" title="EVALUACION TECNICO-ECONOMICA" />
        <Row label="Vida útil ajustada"      value={s10.run_life_dias}    unit="días" />
        <Row label="CAPEX orientativo"       value={s10.capex_categoria}
          color={
            s10.capex_categoria === 'Bajo'     ? C.ok :
            s10.capex_categoria === 'Medio'    ? C.warning :
            s10.capex_categoria === 'Alto'     ? '#F97316' :
            s10.capex_categoria === 'Muy Alto' ? C.danger : C.muted
          }
        />
        <Row label="Factor total penalización" value={f.factor_total !== null && f.factor_total !== undefined ? f.factor_total.toFixed(2) : null} />
        {(s10.capex_extras ?? []).length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>NOTAS CAPEX</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
              {s10.capex_extras.map((item, i) => (
                <li key={i} style={{ color: C.text }}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {/* K — LOG DE ITERACIONES */}
      <Section>
        <SectionHeader letter="K" title="LOG DE ITERACIONES" />
        {log.length === 0 ? (
          <div style={{ color: C.muted, fontSize: 11 }}>Sin iteraciones registradas (diseño lineal).</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {log.map((entry, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '100px 1fr',
                borderBottom: `1px solid ${C.border}`, padding: '6px 0',
                fontSize: 10,
              }}>
                <span style={{ color: C.indigo, fontWeight: 700 }}>
                  [{i + 1}] Ciclo {entry.ciclo} / P{entry.paso}
                </span>
                <span style={{ color: C.muted, lineHeight: 1.6 }}>
                  <span style={{ color: C.text }}>{entry.condicion}</span>
                  {entry.condicion && entry.accion ? ' → ' : ''}
                  {entry.accion && <span style={{ color: C.warning }}>{entry.accion}</span>}
                  {entry.accion && entry.resultado ? ' → ' : ''}
                  {entry.resultado && <span style={{ color: C.ok }}>{entry.resultado}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Footer legal */}
      <div style={{
        background: `${C.muted}08`, border: `1px solid ${C.border}`,
        borderRadius: 6, padding: '10px 16px', marginTop: 8,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted,
        lineHeight: 1.6, textAlign: 'center',
      }}>
        Este documento es generado automaticamente por SIMBES. Para uso educativo unicamente
        — validar con datos reales antes de emitir orden de compra.
      </div>
    </div>
  );
}
