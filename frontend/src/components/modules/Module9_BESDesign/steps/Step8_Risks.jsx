/**
 * SIMBES — M9 PASO 8: Evaluación de riesgos operativos
 * ======================================================
 * Semáforo de 9 riesgos operativos derivados del diseño BES.
 * Cada riesgo muestra indicador, valor actual, umbrales y mitigación.
 *
 * CICLO F: si hay riesgo crítico → recomienda revisar el diseño.
 */
import { AlertPanel } from '../../../ui/index.jsx';

const C = {
  bg: '#0B0F1A', surface: '#111827', surfaceAlt: '#0D1424',
  border: '#1E293B', text: '#CBD5E1', muted: '#64748B',
  indigo: '#818CF8', green: '#34D399', yellow: '#FBBF24',
  ok: '#22C55E', warning: '#F59E0B', danger: '#EF4444',
};

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

function resumenLabel(estado) {
  if (estado === 'ok')      return 'SIN RIESGOS CRÍTICOS';
  if (estado === 'warning') return 'RIESGOS MODERADOS DETECTADOS';
  return 'RIESGO CRÍTICO — REVISAR DISEÑO';
}

export default function Step8_Risks({
  inputs, step8, onCicloF, onComplete, onAdvance, onBack,
}) {
  const {
    completado, riesgos, resumen_estado, hay_riesgo_critico,
    iteraciones_cicloF, alerts,
  } = step8;

  const resumenColor = estadoColor(resumen_estado);

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 8 — Evaluación de riesgos operativos</span>
        <br />
        Semáforo de riesgos derivado de los parámetros del diseño BES. Cada indicador es calculado
        automáticamente a partir de los pasos anteriores y comparado con umbrales operativos de referencia.
        {iteraciones_cicloF > 0 && (
          <span style={{ color: C.warning, marginLeft: 8 }}>CICLO F: {iteraciones_cicloF} iteración/es</span>
        )}
      </div>

      {/* Tabla de riesgos */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '16px', marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
          letterSpacing: 1, marginBottom: 12,
        }}>SEMÁFORO DE RIESGOS OPERATIVOS (9 INDICADORES)</div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
          <thead>
            <tr>
              {['', 'Riesgo', 'Indicador / Valor', 'Umbrales', 'Mitigación recomendada'].map((h, i) => (
                <th key={i} style={{
                  padding: '6px 10px', textAlign: 'left',
                  color: C.muted, fontSize: 10, fontWeight: 400,
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(riesgos ?? []).map((r, i) => {
              const color = estadoColor(r.estado);
              return (
                <tr key={i} style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: r.estado === 'danger' ? `${C.danger}08` : r.estado === 'warning' ? `${C.warning}06` : 'transparent',
                }}>
                  <td style={{ padding: '10px 10px', fontSize: 14, width: 28 }}>
                    {estadoEmoji(r.estado)}
                  </td>
                  <td style={{ padding: '10px 10px', color: color, fontWeight: 700 }}>
                    {r.nombre}
                  </td>
                  <td style={{ padding: '10px 10px', color: C.text }}>
                    <span style={{ color: C.muted, fontSize: 10 }}>{r.indicador}</span>
                    <br />
                    <span style={{ color, fontWeight: 700 }}>{r.valor_display}</span>
                  </td>
                  <td style={{ padding: '10px 10px', color: C.muted, fontSize: 10, lineHeight: 1.6 }}>
                    {r.umbral_alerta && (
                      <span style={{ color: C.warning }}>Alerta: {r.umbral_alerta}</span>
                    )}
                    {r.umbral_alerta && r.umbral_critico && <br />}
                    {r.umbral_critico && (
                      <span style={{ color: C.danger }}>Critico: {r.umbral_critico}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 10px', color: C.muted, fontSize: 10, lineHeight: 1.6 }}>
                    {r.mitigacion}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumen de estado */}
      <div style={{
        background: `${resumenColor}10`, border: `1px solid ${resumenColor}40`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        fontFamily: 'IBM Plex Mono, monospace',
      }}>
        <span style={{ color: resumenColor, fontWeight: 700, fontSize: 12 }}>
          {resumenLabel(resumen_estado)}
        </span>
      </div>

      {/* Riesgo critico */}
      {hay_riesgo_critico && (
        <div style={{
          background: `${C.danger}0A`, border: `1px solid ${C.danger}50`,
          borderRadius: 8, padding: '16px', marginBottom: 20,
        }}>
          <div style={{
            fontSize: 10, color: C.danger, fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: 1, fontWeight: 700, marginBottom: 8,
          }}>
            CICLO F — Riesgo crítico detectado
          </div>
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.text,
            marginBottom: 12, lineHeight: 1.7,
          }}>
            Uno o más indicadores superan el umbral crítico. Se recomienda revisar el diseño
            antes de continuar. El CICLO F regresará al paso correspondiente para ajustar parámetros.
          </div>
          {onCicloF && (
            <button onClick={onCicloF}
              style={{
                background: `${C.danger}22`, border: `1px solid ${C.danger}`,
                color: C.danger, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
                padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
              }}>
              ↺ CICLO F — Revisar diseño
            </button>
          )}
        </div>
      )}

      {/* AlertPanel */}
      <div style={{ marginBottom: 20 }}>
        <AlertPanel alerts={alerts ?? []} />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
          }}>
          ← VOLVER A PASO 7
        </button>

        {!completado && (
          <button onClick={onComplete}
            style={{
              background: `${C.indigo}18`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONFIRMAR PASO 8 → Evaluación de riesgos registrada
          </button>
        )}
      </div>

      {/* Completado */}
      {completado && (
        <div style={{
          marginTop: 24,
          background: `${C.ok}12`, border: `1px solid ${C.ok}40`,
          borderRadius: 8, padding: '20px',
          fontFamily: 'IBM Plex Mono, monospace',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.ok, marginBottom: 8 }}>
            Paso 8 completado — Evaluación de riesgos registrada
          </div>
          <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
            El análisis de riesgos operativos ha sido confirmado. Continua con la estrategia
            de operación y set points de protección.
          </div>
          <button onClick={onAdvance}
            style={{
              background: `${C.green}18`, border: `1px solid ${C.green}`,
              color: C.green, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONTINUAR → PASO 9
          </button>
        </div>
      )}
    </div>
  );
}
