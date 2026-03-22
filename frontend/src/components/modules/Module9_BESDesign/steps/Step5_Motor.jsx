/**
 * SIMBES — M9 PASO 5: Selección y verificación del motor
 * ========================================================
 * Selecciona el tier de motor por HP requerido, verifica temperatura
 * de operación y velocidad anular del fluido.
 *
 * CICLO C: si T° ≥ T_nominal o v_anular < 0.30 m/s → agregar shroud.
 */
import { AlertPanel, Metric } from '../../../ui/index.jsx';

import { C } from '../../../../theme';


function TempGauge({ T_op, T_rated }) {
  if (T_op == null || T_rated == null) return null;
  const pct = Math.min(100, (T_op / (T_rated * 1.15)) * 100);
  const limitPct = (T_rated / (T_rated * 1.15)) * 100;
  const color = T_op >= T_rated ? C.danger : T_op >= T_rated * 0.90 ? C.warning : C.ok;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>T° motor operación</span>
        <span style={{ color, fontWeight: 700 }}>{T_op?.toFixed(0)}°C / {T_rated}°C nom.</span>
      </div>
      <div style={{ position: 'relative', background: C.border, borderRadius: 4, height: 14 }}>
        {/* Línea de T_rated */}
        <div style={{
          position: 'absolute', left: `${limitPct}%`, width: 2, height: '100%',
          background: C.danger, opacity: 0.7,
        }} />
        {/* Barra T_op */}
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: color, transition: 'width 0.4s',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.muted }}>
        <span>0°C</span>
        <span style={{ color: C.danger }}>T_rated={T_rated}°C</span>
        <span>{(T_rated * 1.15).toFixed(0)}°C</span>
      </div>
    </div>
  );
}

function AnnularVelBar({ v_ms }) {
  if (v_ms == null) return null;
  const color = v_ms < 0.30 ? C.danger : v_ms < 0.50 ? C.warning : C.ok;
  const pct = Math.min(100, (v_ms / 2.0) * 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted }}>
        <span>Velocidad anular</span>
        <span style={{ color, fontWeight: 700 }}>{v_ms?.toFixed(3)} m/s</span>
      </div>
      <div style={{ position: 'relative', background: C.border, borderRadius: 4, height: 10 }}>
        {/* Mínimo 0.30 m/s */}
        <div style={{ position: 'absolute', left: '15%', width: 2, height: '100%', background: C.danger, opacity: 0.7 }} />
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: C.muted }}>
        <span>0 m/s</span>
        <span style={{ color: C.danger }}>0.30 m/s mín.</span>
        <span>2.0 m/s</span>
      </div>
    </div>
  );
}

export default function Step5_Motor({ inputs, step5, onCicloC, onComplete, onAdvance, onBack }) {
  const {
    HP_seleccionado, V_motor, I_nominal, T_motor_op, T_rated_motor,
    v_fluido_anular, shroud_requerido, OD_motor_in, OD_shroud_in,
    alerts, completado, iteraciones_cicloC,
  } = step5;

  const tempOk = T_motor_op != null && T_motor_op < T_rated_motor;
  const needsCicloC = shroud_requerido && !completado;

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 5 — Selección y verificación del motor</span>
        <br />
        Selecciona el tier de motor por HP requerido. Verifica que la{' '}
        <strong>temperatura de operación</strong> no supere la nominal y que el fluido
        refrigera adecuadamente el motor (velocidad anular ≥ 0.30 m/s).
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Panel izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Motor seleccionado */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>MOTOR SELECCIONADO [SIMPLIFICADO — genérico por tier HP]</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
              <Metric label="HP REQUERIDO" value={HP_seleccionado ?? '—'} unit="HP"
                color={C.warning} />
              <Metric label="VOLTAJE NOMINAL" value={V_motor ?? '—'} unit="V"
                color={C.text} />
              <Metric label="CORRIENTE NOMINAL" value={I_nominal ?? '—'} unit="A"
                color={C.text} />
              <Metric label="OD MOTOR" value={OD_motor_in ?? '—'} unit='"'
                color={C.text}
                sub={shroud_requerido && OD_shroud_in ? `+shroud → ${OD_shroud_in?.toFixed(2)}"` : ''} />
            </div>
          </div>

          {/* Verificación térmica */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>VERIFICACIÓN TÉRMICA Y REFRIGERACIÓN</div>

            <TempGauge T_op={T_motor_op} T_rated={T_rated_motor} />

            <div style={{ height: 16 }} />

            <AnnularVelBar v_ms={v_fluido_anular} />

            <div style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
              <strong style={{ color: C.text }}>Modelo térmico [SIMPLIFIED]:</strong>{' '}
              v {'<'} 0.30 m/s → ΔT = +30°C · v 0.30–1.00 → ΔT = +15°C · v {'>'} 1.00 → ΔT = +8°C
              <br />
              T° operación = T° fondo ({inputs.T_fond}°C) + ΔT por velocidad anular
            </div>
          </div>

          {/* CICLO C — shroud */}
          <div style={{
            background: C.surface, border: `1px solid ${shroud_requerido ? C.warning : C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 8 }}>
              CICLO C — Shroud (camisa de flujo)
              {iteraciones_cicloC > 0 && <span style={{ color: C.ok, marginLeft: 8 }}>✓ Shroud instalado</span>}
            </div>

            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted,
              marginBottom: 10, lineHeight: 1.6 }}>
              El shroud fuerza al fluido producido a pasar junto al motor antes de subir por el tubing,
              aumentando la velocidad anular y mejorando la refrigeración.
              Agrega ~0.50" al OD efectivo del motor.
            </div>

            {!shroud_requerido && (
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.ok }}>
                ✅ No se requiere shroud — temperatura y velocidad dentro de rango.
              </div>
            )}

            {shroud_requerido && !completado && (
              <button onClick={onCicloC}
                style={{
                  background: `${C.warning}18`, border: `1px solid ${C.warning}`,
                  color: C.warning, fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                }}>
                ⚙ CICLO C — Instalar shroud (+0.50" OD efectivo)
              </button>
            )}

            {shroud_requerido && OD_shroud_in && (
              <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: C.ok }}>
                Shroud instalado. OD efectivo motor+shroud: {OD_shroud_in?.toFixed(2)}".
                Verificar clearance en PASO 7.
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho — alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: 1, marginBottom: 4 }}>DIAGNÓSTICO</div>
          <AlertPanel alerts={alerts ?? []} />

          <div style={{
            background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.6,
          }}>
            <span style={{ color: C.indigo, fontWeight: 700 }}>Regla de Arrhenius</span><br />
            Por cada 10°C sobre la T° nominal, la vida útil del aislamiento se{' '}
            <strong>reduce a la mitad</strong>. Controlar la temperatura del motor es
            crítico para el MTBF del sistema.
          </div>
        </div>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
          }}>
          ← VOLVER A PASO 4
        </button>

        {!completado && tempOk && (
          <button onClick={onComplete}
            style={{
              background: `${C.ok}18`, border: `1px solid ${C.ok}`,
              color: C.ok, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            ✓ CONFIRMAR PASO 5 — Motor verificado ({T_motor_op?.toFixed(0)}°C {'<'} {T_rated_motor}°C)
          </button>
        )}

        {!completado && !tempOk && (
          <div style={{
            background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.danger,
          }}>
            ❌ T° motor supera T° nominal. Usar CICLO C para instalar shroud.
          </div>
        )}

        {completado && (
          <button onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            CONTINUAR → PASO 6: Cable
          </button>
        )}
      </div>
    </div>
  );
}
