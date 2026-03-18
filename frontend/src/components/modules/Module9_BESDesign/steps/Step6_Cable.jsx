/**
 * SIMBES — M9 PASO 6: Selección y verificación del cable
 * ========================================================
 * Selecciona el AWG del cable por ampacidad, verifica caída de voltaje,
 * tipo de aislamiento (NACE), vida útil (Arrhenius) y THD (IEEE 519-2014).
 *
 * CICLO D: si caída > 10% → cambiar a AWG mayor (número menor).
 */
import { AlertPanel } from '../../../ui/index.jsx';

const C = {
  bg: '#0B0F1A', surface: '#111827', surfaceAlt: '#0D1424',
  border: '#1E293B', text: '#CBD5E1', muted: '#64748B',
  indigo: '#818CF8', green: '#34D399', yellow: '#FBBF24',
  ok: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
};

const AWG_OPTIONS = [1, 2, 4, 6, 8, 10, 12, 14];

const INSULATION_LABELS = {
  epdm_std: 'EPDM estándar',
  epdm_ht:  'EPDM alta temperatura',
  peek:     'PEEK (T° extrema / solventes)',
  lead_monel: 'Lead Sheath + Monel 400 (H₂S)',
};

const VSD_LABELS = {
  standard_6pulse: '6 pulsos estándar',
  multipulse_12:   'Multipulso 12 pulsos',
  multipulse_18:   'Multipulso 18 pulsos',
  afe:             'AFE (Active Front End)',
};

function Metric({ label, value, unit, color = C.text, sub }) {
  return (
    <div style={{
      background: C.surfaceAlt, borderRadius: 6, padding: '10px 14px',
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, color, fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>
        {value} <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function VDropBar({ pct }) {
  if (pct == null) return null;
  const color = pct > 10 ? C.danger : pct > 5 ? C.warning : C.ok;
  const w = Math.min(100, (pct / 15) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>Caída de voltaje</span>
        <span style={{ color, fontWeight: 700 }}>{pct?.toFixed(2)}%</span>
      </div>
      <div style={{ position: 'relative', background: C.border, borderRadius: 4, height: 10 }}>
        <div style={{ position: 'absolute', left: `${(5/15)*100}%`, width: 2, height: '100%', background: C.warning, opacity: 0.7 }} />
        <div style={{ position: 'absolute', left: `${(10/15)*100}%`, width: 2, height: '100%', background: C.danger, opacity: 0.7 }} />
        <div style={{ width: `${w}%`, height: '100%', borderRadius: 4, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: C.muted }}>
        <span>0%</span><span style={{ color: C.warning }}>5%</span>
        <span style={{ color: C.danger }}>10%</span><span>15%</span>
      </div>
    </div>
  );
}

function LifeBar({ factor }) {
  if (factor == null) return null;
  const pct = factor * 100;
  const color = pct < 30 ? C.danger : pct < 60 ? C.warning : C.ok;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>Factor vida útil Arrhenius</span>
        <span style={{ color, fontWeight: 700 }}>{pct?.toFixed(0)}% de vida nominal</span>
      </div>
      <div style={{ background: C.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}

export default function Step6_Cable({ inputs, step6, onCicloD, onComplete, onAdvance, onBack }) {
  const {
    AWG, V_drop_V, V_drop_pct, aislamiento_tipo, life_factor,
    THD_pct, cumple_ieee519, OD_cable_in, alerts, completado, iteraciones_cicloD,
  } = step6;

  const dropOk = V_drop_pct != null && V_drop_pct <= 10;

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 6 — Selección y verificación del cable</span>
        <br />
        Selecciona el AWG por ampacidad, verifica <strong>caída de voltaje ≤ 10%</strong>,
        tipo de aislamiento (NACE MR0175), vida útil (Arrhenius) y armónicas (IEEE 519-2014).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Panel izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Cable seleccionado */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>CABLE SELECCIONADO</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Metric label="AWG" value={AWG ?? '—'} unit=""
                color={C.indigo} sub="Flat cable plano BES" />
              <Metric label="CAÍDA (V)" value={V_drop_V?.toFixed(0) ?? '—'} unit="V"
                color={V_drop_pct > 10 ? C.danger : V_drop_pct > 5 ? C.warning : C.ok} />
              <Metric label="OD CABLE" value={OD_cable_in ?? '—'} unit='"'
                color={C.text} />
              <Metric label="AISLAMIENTO"
                value={INSULATION_LABELS[aislamiento_tipo] ?? aislamiento_tipo ?? '—'} unit=""
                color={C.text} />
            </div>

            <VDropBar pct={V_drop_pct} />
          </div>

          {/* CICLO D — cambio de AWG */}
          <div style={{
            background: C.surface,
            border: `1px solid ${V_drop_pct > 10 ? C.danger : C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 8 }}>
              CICLO D — Cambio de AWG
              {iteraciones_cicloD > 0 && <span style={{ color: C.muted, marginLeft: 8 }}>({iteraciones_cicloD} iter.)</span>}
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted,
              marginBottom: 10 }}>
              AWG menor (nro más bajo) → conductor más grueso → menor resistencia → menor caída de voltaje.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {AWG_OPTIONS.map(awg => (
                <button key={awg}
                  onClick={() => onCicloD(awg)}
                  style={{
                    background: AWG === awg ? `${C.yellow}22` : C.surfaceAlt,
                    border: `1px solid ${AWG === awg ? C.yellow : C.border}`,
                    color: AWG === awg ? C.yellow : C.text,
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                    padding: '6px 16px', borderRadius: 6, cursor: 'pointer',
                    fontWeight: AWG === awg ? 700 : 400,
                  }}>
                  AWG {awg}
                </button>
              ))}
            </div>
          </div>

          {/* Arrhenius y THD */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>VIDA ÚTIL Y ARMÓNICAS</div>

            <LifeBar factor={life_factor} />

            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
                <span>THD voltaje — VSD: {VSD_LABELS[inputs.VSD] ?? inputs.VSD}</span>
                <span style={{ color: cumple_ieee519 ? C.ok : C.warning, fontWeight: 700 }}>
                  {THD_pct?.toFixed(0)}% {cumple_ieee519 ? '✓ IEEE 519' : '✗ excede IEEE 519'}
                </span>
              </div>
              <div style={{ background: C.border, borderRadius: 4, height: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (THD_pct / 40) * 100)}%`, height: '100%',
                  background: cumple_ieee519 ? C.ok : C.warning,
                }} />
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
                color: C.muted, marginTop: 3 }}>
                Límite IEEE 519-2014: THDv {'<'} 5% en PCC · VSD actual: {inputs.VSD}
              </div>
            </div>

            {!cumple_ieee519 && (
              <div style={{
                marginTop: 10, background: `${C.warning}0A`, border: `1px solid ${C.warning}30`,
                borderRadius: 6, padding: '8px 12px',
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.warning,
              }}>
                Para cumplir IEEE 519-2014: cambiar VSD en PASO 0 a "Multipulso 18 pulsos" (THD ~5%) o "AFE" (THD ~3%).
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho — alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: 1, marginBottom: 4 }}>DIAGNÓSTICO</div>
          <AlertPanel alerts={alerts ?? []} />

          <div style={{
            background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.6,
          }}>
            <span style={{ color: C.indigo, fontWeight: 700 }}>NACE MR0175</span><br />
            T° {'>'} 140°C → EPDM/PEEK (no NBR). H₂S presente → Lead Sheath + Monel 400.
            <br /><br />
            <span style={{ color: C.indigo, fontWeight: 700 }}>R(T) = R₂₀ × (1 + α·ΔT)</span><br />
            α_Cu = 0.00393 /°C. A mayor T° de fondo, mayor R → mayor caída de voltaje.
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
          }}>
          ← VOLVER A PASO 5
        </button>

        {!completado && dropOk && (
          <button onClick={onComplete}
            style={{
              background: `${C.ok}18`, border: `1px solid ${C.ok}`,
              color: C.ok, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            ✓ CONFIRMAR PASO 6 — Cable AWG {AWG} · caída {V_drop_pct?.toFixed(1)}%
          </button>
        )}

        {!completado && !dropOk && (
          <div style={{
            background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.danger,
          }}>
            ❌ Caída {V_drop_pct?.toFixed(1)}% {'>'} 10%. CICLO D: cambiar a AWG menor.
          </div>
        )}

        {completado && (
          <button onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            CONTINUAR → PASO 7: Verificación mecánica
          </button>
        )}
      </div>
    </div>
  );
}
