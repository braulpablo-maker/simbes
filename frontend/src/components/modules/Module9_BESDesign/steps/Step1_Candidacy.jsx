/**
 * SIMBES — M9 PASO 1: Evaluación de candidatura BES
 * ==================================================
 * Tabla de 7 criterios con estado ✅/⚠️/❌.
 * Si hay ❌, muestra sistemas alternativos y bloquea el avance.
 */

const C = {
  bg:        '#0B0F1A',
  surface:   '#111827',
  surfaceAlt:'#0D1424',
  border:    '#1E293B',
  text:      '#CBD5E1',
  muted:     '#64748B',
  indigo:    '#818CF8',
  ok:        '#22C55E',
  warning:   '#F59E0B',
  danger:    '#EF4444',
};

const STATUS_CONFIG = {
  ok:      { icon: '✅', color: C.ok,      label: 'FAVORABLE' },
  warning: { icon: '⚠️',  color: C.warning, label: 'CONDICIONAL' },
  blocked: { icon: '❌', color: C.danger,  label: 'DESCALIFICANTE' },
};

const VERDICT_CONFIG = {
  approved:    { color: C.ok,      icon: '✅', label: 'CANDIDATO CONFIRMADO', desc: 'El pozo cumple todos los criterios para instalación BES. Podés continuar el diseño.' },
  conditional: { color: C.warning, icon: '⚠️',  label: 'CANDIDATO CONDICIONAL', desc: 'El pozo puede usar BES con restricciones. Revisá los criterios en amarillo antes de avanzar.' },
  rejected:    { color: C.danger,  icon: '❌', label: 'NO CANDIDATO A BES', desc: 'El pozo no cumple los criterios mínimos para BES. Revisá los criterios en rojo y los sistemas alternativos.' },
};

export default function Step1_Candidacy({ criterios, verdict, sistemasAlternativos, onAdvance, onBack }) {
  const vc = VERDICT_CONFIG[verdict];

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 1 — Candidatura BES</span>
        <br />
        Se evalúan 7 criterios operativos. Un criterio ❌ descalifica el pozo para BES convencional.
        Los criterios ⚠️ requieren atención en pasos posteriores del diseño.
      </div>

      {/* Tabla de criterios */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 8, overflow: 'hidden', marginBottom: 20,
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 3fr',
          background: C.surfaceAlt, padding: '8px 16px',
          borderBottom: `1px solid ${C.border}`,
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
          color: C.muted, letterSpacing: 1, fontWeight: 700,
        }}>
          <span>CRITERIO</span>
          <span>VALOR</span>
          <span>ESTADO</span>
          <span>DIAGNÓSTICO</span>
        </div>

        {/* Filas */}
        {criterios.map((c, i) => {
          const sc = STATUS_CONFIG[c.status];
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 3fr',
              padding: '10px 16px',
              borderBottom: i < criterios.length - 1 ? `1px solid ${C.border}` : 'none',
              background: c.status === 'blocked' ? `${C.danger}08`
                        : c.status === 'warning' ? `${C.warning}06` : 'transparent',
              alignItems: 'center',
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.text }}>
                {c.nombre}
              </span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: sc.color, fontWeight: 700 }}>
                {c.valor}{c.unidad ? ` ${c.unidad}` : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{sc.icon}</span>
                <span style={{
                  fontSize: 8, color: sc.color, fontFamily: 'IBM Plex Mono, monospace',
                  letterSpacing: 1, fontWeight: 700,
                }}>{sc.label}</span>
              </div>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                {c.msg}
              </span>
            </div>
          );
        })}
      </div>

      {/* Veredicto global */}
      <div style={{
        background: `${vc.color}12`, border: `1px solid ${vc.color}40`,
        borderRadius: 8, padding: '14px 18px', marginBottom: 20,
        fontFamily: 'IBM Plex Mono, monospace',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: vc.color, marginBottom: 4 }}>
          {vc.icon} {vc.label}
        </div>
        <div style={{ fontSize: 11, color: C.text, lineHeight: 1.6 }}>{vc.desc}</div>
      </div>

      {/* Sistemas alternativos (solo si rejected) */}
      {verdict === 'rejected' && sistemasAlternativos.length > 0 && (
        <div style={{
          background: C.surfaceAlt, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: 16, marginBottom: 24,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: 2,
            fontFamily: 'IBM Plex Mono, monospace', marginBottom: 12,
          }}>
            SISTEMAS ALTERNATIVOS RECOMENDADOS
          </div>
          {sistemasAlternativos.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, marginBottom: 8,
              padding: '8px 12px',
              background: C.surface, borderRadius: 6,
              border: `1px solid ${C.border}`,
            }}>
              <span style={{ color: C.warning, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, flexShrink: 0 }}>▸</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: 'IBM Plex Mono, monospace' }}>
                  {s.nombre}
                </div>
                <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace', marginTop: 2 }}>
                  {s.razon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botones de navegación */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
            letterSpacing: 1,
          }}>
          ← VOLVER A PASO 0
        </button>

        {verdict !== 'rejected' && (
          <button
            onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            CONTINUAR → PASO 2: IPR
          </button>
        )}

        {verdict === 'rejected' && (
          <div style={{
            background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.danger,
          }}>
            ❌ Pozo no candidato. Ajustá los datos en PASO 0 o considerá sistemas alternativos.
          </div>
        )}
      </div>
    </div>
  );
}
