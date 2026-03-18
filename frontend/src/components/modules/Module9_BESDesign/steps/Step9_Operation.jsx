/**
 * SIMBES — M9 PASO 9: Estrategia de operación y set points
 * ==========================================================
 * Muestra los parámetros de arranque, set points de protección VSD
 * y el plan de monitoreo recomendado para el sistema BES diseñado.
 */
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

function SetpointRow({ label, value, unit }) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: '8px 10px', color: C.muted, fontSize: 11 }}>{label}</td>
      <td style={{ padding: '8px 10px', color: C.indigo, fontWeight: 700, fontSize: 13 }}>
        {value ?? '—'}
      </td>
      <td style={{ padding: '8px 10px', color: C.muted, fontSize: 10 }}>{unit}</td>
    </tr>
  );
}

function MonitoreoRow({ label, activo }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 0', borderBottom: `1px solid ${C.border}`,
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 11,
    }}>
      <span style={{ color: activo ? C.ok : C.muted, fontSize: 13 }}>
        {activo ? '✅' : '—'}
      </span>
      <span style={{ color: activo ? C.text : C.muted }}>
        {label}
      </span>
    </div>
  );
}

export default function Step9_Operation({
  inputs, step9, onComplete, onAdvance, onBack,
}) {
  const {
    completado, f_arranque, rampa_Hz_min, setpoints, monitoreo, alerts,
  } = step9;

  const sp = setpoints ?? {};
  const mon = monitoreo ?? {};

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 9 — Estrategia de operación y set points</span>
        <br />
        Parámetros de arranque del VSD, set points de protección derivados del diseño
        y plan de monitoreo recomendado para el sistema BES seleccionado.
      </div>

      {/* Layout dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Columna izquierda — Set points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Parámetros de arranque */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{
              fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12,
            }}>PARÁMETROS DE ARRANQUE</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Metric
                label="FRECUENCIA DE ARRANQUE"
                value={f_arranque ?? '—'}
                unit="Hz"
                color={C.indigo}
                sub="Frecuencia inicial VSD"
              />
              <Metric
                label="RAMPA DE ACELERACIÓN"
                value={rampa_Hz_min ?? '—'}
                unit="Hz/min"
                color={C.indigo}
                sub="Velocidad de incremento de frecuencia"
              />
            </div>
          </div>

          {/* Set points de protección VSD */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{
              fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12,
            }}>SET POINTS DE PROTECCIÓN VSD</div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono, monospace' }}>
              <thead>
                <tr>
                  {['Protección', 'Valor', 'Unidad'].map((h, i) => (
                    <th key={i} style={{
                      padding: '6px 10px', textAlign: 'left',
                      color: C.muted, fontSize: 10, fontWeight: 400,
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <SetpointRow label="Sobrecorriente"    value={sp.sobrecorriente} unit="A" />
                <SetpointRow label="Undercurrent"      value={sp.undercurrent}   unit="A" />
                <SetpointRow label="T° máx motor"      value={sp.T_max_motor}    unit="°C" />
                <SetpointRow label="PIP mínimo"        value={sp.PIP_min}        unit="psi" />
                <SetpointRow label="Vibración alerta"  value={sp.vibracion_alerta ?? 4.0} unit="mm/s RMS" />
                <SetpointRow label="Vibración paro"    value={sp.vibracion_paro  ?? 8.0} unit="mm/s RMS" />
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna derecha — Monitoreo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Monitoreo recomendado */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{
              fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: 1, marginBottom: 12,
            }}>MONITOREO RECOMENDADO</div>

            <MonitoreoRow label="Carta amperométrica"   activo={mon.carta_amperimetrica} />
            <MonitoreoRow label="Sensor P/T downhole"   activo={mon.P_T_downhole} />
            <MonitoreoRow label="Vibración"             activo={mon.vibracion} />
            <MonitoreoRow label="THD en superficie"     activo={mon.THD_superficie} />
          </div>

          {/* InfoBox */}
          <div style={{
            background: C.surfaceAlt, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: '12px 14px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.7,
          }}>
            <span style={{ color: C.indigo, fontWeight: 700 }}>Nota sobre set points</span>
            <br />
            Los set points son calculados desde los parámetros del equipo seleccionado
            (PASOS 4–6). Ajustar con el fabricante antes de la puesta en marcha.
          </div>

          {/* AlertPanel */}
          <AlertPanel alerts={alerts ?? []} />
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
          ← VOLVER A PASO 8
        </button>

        {!completado && (
          <button onClick={onComplete}
            style={{
              background: `${C.indigo}18`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONFIRMAR PASO 9 — Set points registrados
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
            Paso 9 completado — Estrategia de operación registrada
          </div>
          <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
            Los set points y el plan de monitoreo han sido registrados.
            Continua con la evaluación técnico-económica del diseño.
          </div>
          <button onClick={onAdvance}
            style={{
              background: `${C.green}18`, border: `1px solid ${C.green}`,
              color: C.green, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONTINUAR → PASO 10
          </button>
        </div>
      )}
    </div>
  );
}
