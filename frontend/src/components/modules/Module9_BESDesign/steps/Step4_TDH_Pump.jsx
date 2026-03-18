/**
 * SIMBES — M9 PASO 4: TDH y selección de bomba
 * ==============================================
 * Muestra el desglose del TDH requerido, los candidatos de serie de bomba,
 * la frecuencia operativa óptima y el ratio BEP.
 *
 * CICLO B: ajustar frecuencia o cambiar serie si BEP ratio fuera de 70–130%.
 */
import { useState } from 'react';
import { AlertPanel } from '../../../ui/index.jsx';

const C = {
  bg: '#0B0F1A', surface: '#111827', surfaceAlt: '#0D1424',
  border: '#1E293B', text: '#CBD5E1', muted: '#64748B',
  indigo: '#818CF8', green: '#34D399', yellow: '#FBBF24',
  ok: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
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

function TDHBar({ label, value_m, total_m, color }) {
  if (!total_m || total_m === 0) return null;
  const pct = Math.max(0, Math.min(100, (value_m / total_m) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>{label}</span>
        <span style={{ color }}>{value_m?.toFixed(1)} m ({pct.toFixed(0)}%)</span>
      </div>
      <div style={{ background: C.border, borderRadius: 3, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function BEPGauge({ bep_pct }) {
  if (bep_pct == null) return null;
  const color = (bep_pct >= 70 && bep_pct <= 130) ? C.ok
              : (bep_pct >= 60 && bep_pct <= 140) ? C.warning : C.danger;
  // Bar from 0–200%
  const w = Math.min(100, (bep_pct / 200) * 100);
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>Ratio Q/BEP</span>
        <span style={{ color, fontWeight: 700 }}>{bep_pct?.toFixed(0)}%</span>
      </div>
      <div style={{ position: 'relative', background: C.border, borderRadius: 4, height: 12 }}>
        {/* zonas */}
        <div style={{ position: 'absolute', left: '35%', width: '30%', height: '100%',
          background: `${C.ok}30`, borderRadius: 0 }} />
        <div style={{ position: 'absolute', left: `${w}%`, width: 3, height: '100%',
          background: color, borderRadius: 2, transform: 'translateX(-50%)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: C.muted }}>
        <span>0%</span><span>BEP 70–130% (zona OK)</span><span>200%</span>
      </div>
    </div>
  );
}

export default function Step4_TDH_Pump({
  inputs, step4, onCicloB_freq, onCicloB_serie, onComplete, onAdvance, onBack,
}) {
  const {
    TDH_m, TDH_components, serie, etapas, H_stage_m, TDH_disponible_m,
    f_operativa, bep_pct, Ns, tipo_impulsor, OD_bomba_in, HP_hidraulico,
    OD_max_constraint, candidatos, alerts, completado, iteraciones_cicloB,
  } = step4;

  const [f_nueva, setF_nueva] = useState(f_operativa ?? inputs.f_red ?? 60);
  const [serie_sel, setSerie_sel] = useState(serie?.id ?? '');

  const bepOk = bep_pct != null && bep_pct >= 70 && bep_pct <= 130;

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 4 — TDH y selección de serie de bomba</span>
        <br />
        Calcula el <strong>Total Dynamic Head (TDH)</strong> requerido corregido por PIP,
        selecciona la serie de bomba óptima y ajusta la frecuencia operativa para operar cerca del BEP.
        {OD_max_constraint && (
          <span style={{ color: C.danger, marginLeft: 8 }}>
            ⚠ CICLO E activo: OD máximo {OD_max_constraint}"
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Panel izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Desglose TDH */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>DESGLOSE DEL TDH REQUERIDO</div>

            {TDH_components && (
              <>
                <TDHBar label="H estática (D_bomba − PIP/γ)" value_m={TDH_components.H_static_m} total_m={TDH_m} color={C.indigo} />
                <TDHBar label="H fricción (Darcy-Weisbach)" value_m={TDH_components.H_friction_m} total_m={TDH_m} color={C.warning} />
                <TDHBar label="H contrapresión (WHP/γ)" value_m={TDH_components.H_back_m} total_m={TDH_m} color={C.green} />
              </>
            )}

            <div style={{
              marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            }}>
              <Metric label="TDH REQUERIDO" value={TDH_m?.toFixed(0) ?? '—'} unit="m"
                color={C.indigo} sub={`${(TDH_m * 3.281)?.toFixed(0)} ft`} />
              <Metric label="HP HIDRÁULICO (c/margen 20%)" value={HP_hidraulico ?? '—'} unit="HP"
                color={C.warning} />
            </div>
          </div>

          {/* Selección de serie */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>SERIES CANDIDATAS</div>

            {candidatos?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidatos.map(c => (
                  <button key={c.id}
                    onClick={() => { setSerie_sel(c.id); onCicloB_serie(c.id); }}
                    style={{
                      background: serie?.id === c.id ? `${C.indigo}18` : C.surfaceAlt,
                      border: `1px solid ${serie?.id === c.id ? C.indigo : C.border}`,
                      borderRadius: 6, padding: '10px 14px', cursor: 'pointer',
                      textAlign: 'left',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                        color: serie?.id === c.id ? C.indigo : C.text, fontWeight: 700,
                      }}>{c.name}</span>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted }}>
                        OD {c.OD_in}" · BEP {c.BEP_stbd} stb/d
                      </span>
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: C.muted, marginTop: 3 }}>
                      Rango: {c.range_m3d[0]}–{c.range_m3d[1]} m³/d · {c.impeller_type} · Ns≈{c.Ns_approx}
                      {OD_max_constraint && c.OD_in > OD_max_constraint && (
                        <span style={{ color: C.danger, marginLeft: 6 }}>⚠ OD excede límite</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.muted }}>
                No hay series candidatas para el caudal actual.
              </div>
            )}

            {/* Serie seleccionada — detalles */}
            {serie && (
              <div style={{
                marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10,
              }}>
                <Metric label="ETAPAS REQUERIDAS" value={etapas ?? '—'} unit="etapas"
                  color={C.text} sub={`H/etapa = ${H_stage_m?.toFixed(1)} m`} />
                <Metric label="Ns VELOCIDAD ESP." value={Ns ?? '—'} unit=""
                  color={C.text} sub={tipo_impulsor ?? ''} />
                <Metric label="OD BOMBA" value={OD_bomba_in ?? '—'} unit='"'
                  color={C.text} sub={serie?.note ?? ''} />
              </div>
            )}
          </div>

          {/* CICLO B — ajuste de frecuencia */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 8 }}>
              CICLO B — Ajuste de frecuencia operativa
              {iteraciones_cicloB > 0 && <span style={{ color: C.muted, marginLeft: 8 }}>({iteraciones_cicloB} iter.)</span>}
            </div>

            <BEPGauge bep_pct={bep_pct} />

            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted, marginBottom: 4 }}>
                  Frecuencia operativa: <strong style={{ color: C.indigo }}>{f_nueva} Hz</strong>
                </div>
                <input type="range" min={40} max={72} step={0.5}
                  value={f_nueva}
                  onChange={e => setF_nueva(+e.target.value)}
                  style={{ width: '100%', accentColor: C.indigo }} />
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: C.muted }}>
                  <span>40 Hz</span><span>60 Hz</span><span>72 Hz</span>
                </div>
              </div>
              <button
                onClick={() => onCicloB_freq(f_nueva)}
                style={{
                  background: `${C.yellow}22`, border: `1px solid ${C.yellow}`,
                  color: C.yellow, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                  padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                Aplicar {f_nueva} Hz
              </button>
            </div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
              color: C.muted, marginTop: 6 }}>
              Frecuencia actual aplicada: <span style={{ color: C.indigo }}>{f_operativa} Hz</span>
              {' · '}BEP ratio: <span style={{ color: bepOk ? C.ok : C.warning }}>{bep_pct?.toFixed(0)}%</span>
            </div>
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
            <span style={{ color: C.indigo, fontWeight: 700 }}>¿Por qué el BEP importa?</span><br />
            Operar fuera del 70–130% BEP genera recirculación interna, surging o cavitación.
            Cada 10% alejado del BEP reduce el MTBF estimado de la bomba en ~15%.
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
          ← VOLVER A PASO 3
        </button>

        {!completado && bepOk && (
          <button onClick={onComplete}
            style={{
              background: `${C.ok}18`, border: `1px solid ${C.ok}`,
              color: C.ok, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            ✓ CONFIRMAR PASO 4 — TDH y bomba OK (BEP {bep_pct?.toFixed(0)}%)
          </button>
        )}

        {!completado && !bepOk && (
          <div style={{
            background: `${C.warning}10`, border: `1px solid ${C.warning}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.warning,
          }}>
            ⚠ BEP ratio {bep_pct?.toFixed(0)}% fuera de rango (70–130%). Ajustar frecuencia o cambiar serie.
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
            CONTINUAR → PASO 5: Motor
          </button>
        )}
      </div>
    </div>
  );
}
