/**
 * SIMBES — M9 PASO 3: Condiciones en la entrada de la bomba
 * =========================================================
 * Calcula PIP, GVF en succión, correcciones de viscosidad y
 * volumen real que maneja la bomba (incluyendo gas en solución).
 *
 * CICLO A: si GVF > 15%, seleccionar separador (AGS / gas handler).
 */
import { AlertPanel, Metric } from '../../../ui/index.jsx';

import { C } from '../../../../theme';

const SEP_OPTIONS = [
  { id: 'AGS_pasivo',   label: 'AGS Pasivo',    desc: 'Separador gravimétrico rotatorio — eficiencia ~60%' },
  { id: 'gas_handler',  label: 'Gas Handler',   desc: 'Manejo activo de gas — operación hasta GVF 50%' },
];


function GVFBar({ label, pct, color }) {
  const w = Math.min(100, pct * 100);
  const bgColor = pct > 0.5 ? C.danger : pct > 0.15 ? C.warning : C.ok;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>{label}</span>
        <span style={{ color: bgColor, fontWeight: 700 }}>{(pct * 100).toFixed(1)}%</span>
      </div>
      <div style={{ background: C.border, borderRadius: 3, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: bgColor, borderRadius: 3,
          transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function Step3_PumpConditions({ inputs, step3, onCicloA, onComplete, onAdvance, onBack }) {
  const {
    PIP_psi, GVF_crudo, GVF_efectivo, separador_tipo,
    Q_total_m3d, Q_liq_m3d, H_factor, Q_factor, eta_factor,
    visc_correction_active, alerts, completado, iteraciones_cicloA,
  } = step3;

  const needsSeparator = GVF_crudo > 0.15 && !separador_tipo;
  const gvfOk = GVF_efectivo <= 0.50;

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 3 — Condiciones en la entrada de la bomba</span>
        <br />
        Calcula la <strong>presión en la succión (PIP)</strong>, la fracción de gas volumétrico (GVF)
        y el <strong>volumen real</strong> que manejará la bomba (líquido + gas en solución + agua).
      </div>

      {/* Layout principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Panel izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Métricas PIP y caudal */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>PRESIÓN DE SUCCIÓN Y CAUDAL REAL</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Metric label="PIP (Pump Intake Pressure)" value={PIP_psi ?? '—'} unit="psi"
                color={PIP_psi < inputs.Pb ? C.warning : C.ok}
                sub={PIP_psi < inputs.Pb ? '⚠ Por debajo de Pb' : 'OK — sobre Pb'} />
              <Metric label="Q TOTAL EN BOMBA" value={Q_total_m3d?.toFixed(1) ?? '—'} unit="m³/d"
                color={C.indigo}
                sub="Incluye gas en solución + agua" />
              <Metric label="Q LÍQUIDO NETO" value={Q_liq_m3d?.toFixed(1) ?? '—'} unit="m³/d"
                color={C.text}
                sub={`BSW=${inputs.BSW}%`} />
            </div>
          </div>

          {/* GVF */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>GAS VOLUME FRACTION (GVF) EN SUCCIÓN</div>

            <GVFBar label="GVF crudo (sin separador)" pct={GVF_crudo ?? 0} />
            {separador_tipo && (
              <GVFBar label={`GVF efectivo (con ${separador_tipo})`} pct={GVF_efectivo ?? 0} />
            )}

            {/* CICLO A — selector de separador */}
            {(GVF_crudo > 0.15 || separador_tipo) && (
              <div style={{
                marginTop: 12, background: `${C.yellow}0A`,
                border: `1px dashed ${C.yellow}50`, borderRadius: 6, padding: '12px',
              }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                  color: C.yellow, fontWeight: 700, marginBottom: 8 }}>
                  CICLO A — Selección de separador de gas
                  {iteraciones_cicloA > 0 && <span style={{ color: C.muted, marginLeft: 8 }}>({iteraciones_cicloA} iteración/es)</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SEP_OPTIONS.map(opt => (
                    <button key={opt.id}
                      onClick={() => onCicloA(opt.id)}
                      style={{
                        background: separador_tipo === opt.id ? `${C.yellow}22` : C.surfaceAlt,
                        border: `1px solid ${separador_tipo === opt.id ? C.yellow : C.border}`,
                        color: separador_tipo === opt.id ? C.yellow : C.text,
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        padding: '8px 14px', borderRadius: 6, cursor: 'pointer',
                        textAlign: 'left',
                      }}>
                      <div style={{ fontWeight: 700 }}>{opt.label}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{opt.desc}</div>
                    </button>
                  ))}
                  {separador_tipo && (
                    <button onClick={() => onCicloA(null)}
                      style={{
                        background: C.surfaceAlt, border: `1px solid ${C.border}`,
                        color: C.muted, fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                      }}>
                      Sin separador
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Correcciones de viscosidad */}
          {visc_correction_active && (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '16px',
            }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, marginBottom: 12 }}>
                CORRECCIÓN DE VISCOSIDAD — Hydraulic Institute (visc={inputs.visc} cP)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <Metric label="C_H (cabeza)" value={H_factor?.toFixed(3)} unit=""
                  color={H_factor < 0.9 ? C.warning : C.ok}
                  sub="Factor sobre curva H-Q" />
                <Metric label="C_Q (caudal)" value={Q_factor?.toFixed(3)} unit=""
                  color={Q_factor < 0.9 ? C.warning : C.ok}
                  sub="Factor sobre caudal BEP" />
                <Metric label="C_η (eficiencia)" value={eta_factor?.toFixed(3)} unit=""
                  color={eta_factor < 0.8 ? C.danger : eta_factor < 0.9 ? C.warning : C.ok}
                  sub="Factor sobre eficiencia" />
              </div>
              <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
                [SIMPLIFIED: corrección HI representativa. Para diseño real usar curvas de fabricante corregidas por viscosidad.]
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho — alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: 1, marginBottom: 4 }}>DIAGNÓSTICO</div>
          <AlertPanel alerts={alerts ?? []} />

          {/* Nota teórica */}
          <div style={{
            marginTop: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.6,
          }}>
            <span style={{ color: C.indigo, fontWeight: 700 }}>PIP vs. Pb</span><br />
            Si PIP {'<'} Pb, el fluido ya está en fase bifásica en la succión. La bomba maneja gas libre,
            lo que degrada la curva H-Q y aumenta el riesgo de gas lock si GVF {'>'} 15%.
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
          }}>
          ← VOLVER A PASO 2
        </button>

        {!completado && gvfOk && (
          <button onClick={onComplete}
            style={{
              background: `${C.ok}18`, border: `1px solid ${C.ok}`,
              color: C.ok, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            ✓ CONFIRMAR PASO 3 — Condiciones en bomba OK
          </button>
        )}

        {completado && (
          <button onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            CONTINUAR → PASO 4: TDH y selección de bomba
          </button>
        )}

        {!gvfOk && (
          <div style={{
            background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.danger,
          }}>
            ❌ GVF efectivo {'>'} 50%. Gas lock probable. Usar gas handler o revisar GOR/PIP.
          </div>
        )}
      </div>
    </div>
  );
}
