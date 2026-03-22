/**
 * SIMBES — M9 PASO 7: Verificación mecánica del string BES
 * =========================================================
 * Verifica que el conjunto (bomba + motor + shroud + cable) cabe dentro
 * del drift del casing y que la desviación del pozo es admisible.
 *
 * CICLO E: si holgura insuficiente → establece OD_max y regresa a PASO 4.
 */
import { AlertPanel, Metric } from '../../../ui/index.jsx';

import { C } from '../../../../theme';


// Diagrama anular simplificado (ASCII-like SVG)
function AnnularDiagram({ ID_cas_in, OD_string_in, holgura_mm }) {
  if (!ID_cas_in || !OD_string_in) return null;

  const WIDTH = 200;
  const HEIGHT = 200;
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;
  const scale = 80 / ID_cas_in; // escalar para que el casing ocupe 80px de radio

  const r_cas    = ID_cas_in    * scale;
  const r_string = OD_string_in * scale;

  const holguraOk = holgura_mm >= 6;
  const holguraColor = holgura_mm < 0 ? C.danger : holgura_mm < 6 ? C.danger : holgura_mm < 12 ? C.warning : C.ok;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
      <svg width={WIDTH} height={HEIGHT} style={{ overflow: 'visible' }}>
        {/* Casing */}
        <circle cx={cx} cy={cy} r={r_cas} fill="none"
          stroke={C.border} strokeWidth={6} />
        <text x={cx} y={cy - r_cas - 10} textAnchor="middle"
          fill={C.muted} fontSize={9} fontFamily="JetBrains Mono, monospace">
          ID casing {ID_cas_in}"
        </text>

        {/* String */}
        <circle cx={cx} cy={cy} r={Math.min(r_string, r_cas - 2)} fill={`${C.indigo}30`}
          stroke={r_string > r_cas ? C.danger : C.indigo} strokeWidth={2} />
        <text x={cx} y={cy + 4} textAnchor="middle"
          fill={C.indigo} fontSize={9} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
          OD {OD_string_in}"
        </text>

        {/* Holgura label */}
        {holgura_mm >= 0 && (
          <>
            <line x1={cx + r_string + 2} y1={cy} x2={cx + r_cas - 2} y2={cy}
              stroke={holguraColor} strokeWidth={2} markerEnd="url(#arrow)" />
            <text x={cx + r_string + (r_cas - r_string) / 2} y={cy - 6} textAnchor="middle"
              fill={holguraColor} fontSize={9} fontFamily="JetBrains Mono, monospace">
              {holgura_mm?.toFixed(0)} mm
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

export default function Step7_Mechanical({
  inputs, step7, onCicloE, onComplete, onAdvance, onBack,
}) {
  const {
    OD_string_in, componentes, holgura_mm, dogleg_ok,
    dogleg_admisible, status, alerts, completado, iteraciones_cicloE,
  } = step7;

  const isBlocked    = status === 'blocked';
  const isConditional = status === 'conditional';
  const isOk          = status === 'ok';

  const statusColor  = isBlocked ? C.danger : isConditional ? C.warning : C.ok;
  const statusLabel  = isBlocked ? '❌ BLOQUEADO' : isConditional ? '⚠ CONDICIONAL' : '✅ OK';

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 7 — Verificación mecánica del string BES</span>
        <br />
        Verifica que el conjunto de equipos <strong>cabe dentro del drift del casing</strong>
        (holgura ≥ 6 mm por lado) y que la desviación del pozo es admisible para el cable seleccionado.
        {iteraciones_cicloE > 0 && (
          <span style={{ color: C.warning, marginLeft: 8 }}>CICLO E: {iteraciones_cicloE} iteración/es</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Panel izquierdo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tabla de componentes */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>COMPONENTES DEL STRING BES</div>

            <table style={{ width: '100%', borderCollapse: 'collapse',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
              <thead>
                <tr>
                  {['Componente', 'OD (pulg)', 'Estado'].map(h => (
                    <th key={h} style={{
                      padding: '6px 10px', textAlign: 'left',
                      color: C.muted, fontSize: 10, fontWeight: 400,
                      borderBottom: `1px solid ${C.border}`,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {componentes?.map((comp, i) => (
                  <tr key={i} style={{ opacity: comp.aplica ? 1 : 0.35 }}>
                    <td style={{ padding: '8px 10px', color: C.text }}>{comp.nombre}</td>
                    <td style={{ padding: '8px 10px', color: comp.aplica ? C.indigo : C.muted }}>
                      {comp.aplica ? `${comp.OD_in?.toFixed(3)}"` : '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: comp.aplica ? C.ok : C.muted }}>
                      {comp.aplica ? '✓ incluido' : '— no aplica'}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '8px 10px', color: C.text, fontWeight: 700 }}>OD MÁXIMO STRING</td>
                  <td style={{ padding: '8px 10px', color: C.warning, fontWeight: 700 }}>
                    {OD_string_in?.toFixed(3)}"
                  </td>
                  <td style={{ padding: '8px 10px', color: C.muted }}>
                    ID casing: {inputs.ID_cas}"
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Diagrama anular + holgura */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>CLEARANCE ANULAR</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center' }}>
              <AnnularDiagram
                ID_cas_in={inputs.ID_cas}
                OD_string_in={OD_string_in}
                holgura_mm={holgura_mm}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Metric label="HOLGURA POR LADO" value={holgura_mm?.toFixed(1) ?? '—'} unit="mm"
                  color={holgura_mm < 6 ? C.danger : holgura_mm < 12 ? C.warning : C.ok}
                  sub="Mínimo admisible: 6 mm" />
                <Metric label="STATUS MECÁNICO" value={statusLabel} unit=""
                  color={statusColor} />
              </div>
            </div>
          </div>

          {/* Verificación dogleg */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '16px',
          }}>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: 1, marginBottom: 12 }}>VERIFICACIÓN DE DOGLEG (DESVIACIÓN DEL POZO)</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <Metric label="DOGLEG REAL" value={inputs.Dev?.toFixed(1) ?? '—'} unit="°/30m"
                color={dogleg_ok === false ? C.danger : C.text} />
              <Metric label="DOGLEG ADMISIBLE (AWG)" value={dogleg_admisible ?? '—'} unit="°/30m"
                color={C.text} sub="Radio mínimo de curvatura del cable" />
              <Metric label="VERIF. DOGLEG" value={dogleg_ok === undefined ? '—' : dogleg_ok ? '✓ OK' : '✗ EXCEDE'} unit=""
                color={dogleg_ok ? C.ok : C.danger} />
            </div>
          </div>

          {/* CICLO E */}
          {isBlocked && (
            <div style={{
              background: `${C.danger}0A`, border: `1px solid ${C.danger}50`,
              borderRadius: 8, padding: '16px',
            }}>
              <div style={{ fontSize: 10, color: C.danger, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>
                CICLO E — String no cabe en el casing
              </div>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.text,
                marginBottom: 12, lineHeight: 1.7 }}>
                Holgura actual: <strong style={{ color: C.danger }}>{holgura_mm?.toFixed(1)} mm</strong> (mínimo 6 mm).
                <br />
                El CICLO E establecerá un límite de OD máximo y regresará al PASO 4
                para seleccionar una serie de bomba y motor más pequeños.
              </div>
              <button onClick={onCicloE}
                style={{
                  background: `${C.danger}22`, border: `1px solid ${C.danger}`,
                  color: C.danger, fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
                  padding: '10px 20px', borderRadius: 6, cursor: 'pointer', fontWeight: 700,
                }}>
                ↺ CICLO E — Reducir OD y volver a PASO 4
              </button>
            </div>
          )}
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
            <span style={{ color: C.indigo, fontWeight: 700 }}>Holgura mínima API</span><br />
            6 mm mínimo por lado para garantizar bajada sin atasco.
            {'<'} 12 mm → requiere inspección previa del casing.
            <br /><br />
            <span style={{ color: C.indigo, fontWeight: 700 }}>Dogleg severity</span><br />
            Limita el radio mínimo de curvatura del cable plano. AWG menor → radio mayor admisible.
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
          ← VOLVER A PASO 6
        </button>

        {!completado && !isBlocked && (
          <button onClick={onComplete}
            style={{
              background: `${statusColor}18`, border: `1px solid ${statusColor}`,
              color: statusColor, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            {isOk
              ? `✓ CONFIRMAR PASO 7 — Holgura ${holgura_mm?.toFixed(0)} mm · Diseño completo`
              : `⚠ ACEPTAR CON CONDICIÓN — ${holgura_mm?.toFixed(0)} mm (ajustado)`}
          </button>
        )}
      </div>

      {/* Continuar a PASO 8 */}
      {completado && onAdvance && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            CONTINUAR → PASO 8: Evaluación de riesgos
          </button>
        </div>
      )}
    </div>
  );
}
