/**
 * SIMBES — M9 PASO 10: Evaluación técnico-económica (orientativa)
 * =================================================================
 * Muestra vida útil esperada, factores de penalización por condiciones
 * de pozo y categoría CAPEX orientativa. Solo para fines educativos.
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

function factorColor(v) {
  if (v === null || v === undefined) return C.muted;
  if (v >= 1.0) return C.ok;
  if (v >= 0.8) return C.warning;
  return C.danger;
}

function capexStyle(cat) {
  const map = {
    'Bajo':     { bg: `${C.ok}18`,      border: `1px solid ${C.ok}50`,      color: C.ok },
    'Medio':    { bg: `${C.warning}18`, border: `1px solid ${C.warning}50`, color: C.warning },
    'Alto':     { bg: `#F9731618`,      border: `1px solid #F9731650`,      color: '#F97316' },
    'Muy Alto': { bg: `${C.danger}18`,  border: `1px solid ${C.danger}50`,  color: C.danger },
  };
  return map[cat] ?? { bg: `${C.muted}18`, border: `1px solid ${C.muted}50`, color: C.muted };
}

export default function Step10_Economics({
  inputs, step10, onComplete, onAdvance, onBack,
}) {
  const {
    completado, Q_esperado, MTBF_base, run_life_dias, R_at_runlife,
    factores, capex_categoria, capex_extras, alerts,
  } = step10;

  const f = factores ?? {};
  const cs = capexStyle(capex_categoria);

  const formatFactor = (v) => v !== null && v !== undefined ? v.toFixed(2) : '—';
  const formatPct = (v) => v !== null && v !== undefined ? `${(v * 100).toFixed(1)}%` : '—';

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 16,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 10 — Evaluación técnico-económica (orientativa)</span>
        <br />
        Estimación de vida útil ajustada por condiciones de pozo y categoría CAPEX referencial
        para el sistema BES diseñado. Los factores de penalización son multiplicativos.
      </div>

      {/* Nota educativa */}
      <div style={{
        background: `${C.yellow}0A`, border: `1px solid ${C.yellow}30`,
        borderRadius: 6, padding: '10px 14px', marginBottom: 20,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: C.yellow, lineHeight: 1.6,
      }}>
        Los valores económicos son orientativos con fines educativos. No usar para decisiones de inversión real.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* SECCIÓN 1 — Vida útil */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '16px',
        }}>
          <div style={{
            fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: 1, marginBottom: 12,
          }}>VIDA ÚTIL ESPERADA</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <Metric
              label="MTBF BASE"
              value={MTBF_base ?? '—'}
              unit="días"
              color={C.text}
              sub="Referencia de fabricante"
            />
            <Metric
              label="VIDA ÚTIL AJUSTADA"
              value={run_life_dias ?? '—'}
              unit="días"
              color={run_life_dias < 365 ? C.danger : run_life_dias < 730 ? C.warning : C.ok}
              sub="Ajustada por factores de campo"
            />
            <Metric
              label="PROB. SUPERVIVENCIA"
              value={R_at_runlife !== null && R_at_runlife !== undefined ? `${(R_at_runlife * 100).toFixed(1)}` : '—'}
              unit="%"
              color={R_at_runlife < 0.37 ? C.danger : R_at_runlife < 0.60 ? C.warning : C.ok}
              sub="P(T ≥ run_life) = e^(-t/MTBF)"
            />
            <Metric
              label="CAUDAL ESPERADO"
              value={Q_esperado ?? '—'}
              unit="m³/d"
              color={C.indigo}
            />
          </div>
        </div>

        {/* SECCIÓN 2 — Factores de penalización */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '16px',
        }}>
          <div style={{
            fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: 1, marginBottom: 12,
          }}>FACTORES DE PENALIZACIÓN</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>
            <thead>
              <tr>
                {['Condición', 'Factor', 'Impacto'].map((h, i) => (
                  <th key={i} style={{
                    padding: '6px 10px', textAlign: 'left',
                    color: C.muted, fontSize: 10, fontWeight: 400,
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Gas (GVF)',            key: 'factor_gas' },
                { label: 'Temperatura',          key: 'factor_T' },
                { label: 'Sólidos',              key: 'factor_solidos' },
                { label: 'H\u2082S (gas amargo)', key: 'factor_H2S' },
              ].map(({ label, key }) => {
                const val = f[key];
                const color = factorColor(val);
                return (
                  <tr key={key} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '8px 10px', color: C.text }}>{label}</td>
                    <td style={{ padding: '8px 10px', color, fontWeight: 700, fontSize: 14 }}>
                      {formatFactor(val)}
                    </td>
                    <td style={{ padding: '8px 10px', color: C.muted, fontSize: 10 }}>
                      {val === null || val === undefined ? '—' : val >= 1.0 ? 'Sin penalización' : val >= 0.8 ? 'Penalización moderada' : 'Penalización severa'}
                    </td>
                  </tr>
                );
              })}
              <tr style={{ borderTop: `2px solid ${C.border}` }}>
                <td style={{ padding: '10px 10px', color: C.text, fontWeight: 700 }}>Factor total acumulado</td>
                <td style={{ padding: '10px 10px', color: factorColor(f.factor_total), fontWeight: 700, fontSize: 16 }}>
                  {formatFactor(f.factor_total)}
                </td>
                <td style={{ padding: '10px 10px', color: C.muted, fontSize: 10 }}>
                  Producto de todos los factores
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECCIÓN 3 — CAPEX orientativo */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '16px',
        }}>
          <div style={{
            fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: 1, marginBottom: 12,
          }}>CAPEX ORIENTATIVO</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.muted }}>
              Categoría estimada:
            </span>
            {capex_categoria ? (
              <span style={{
                background: cs.bg, border: cs.border, color: cs.color,
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 13,
                fontWeight: 700, padding: '4px 14px', borderRadius: 20,
              }}>
                {capex_categoria}
              </span>
            ) : (
              <span style={{ color: C.muted, fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>—</span>
            )}
          </div>

          {(capex_extras ?? []).length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
              {capex_extras.map((item, i) => (
                <li key={i} style={{ color: C.text }}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        {/* AlertPanel */}
        <AlertPanel alerts={alerts ?? []} />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
          }}>
          ← VOLVER A PASO 9
        </button>

        {!completado && (
          <button onClick={onComplete}
            style={{
              background: `${C.indigo}18`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONFIRMAR PASO 10
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
            Paso 10 completado — Evaluación técnico-económica registrada
          </div>
          <div style={{ fontSize: 11, color: C.text, lineHeight: 1.8, marginBottom: 16 }}>
            La estimación de vida útil y CAPEX orientativo han sido registrados.
            Continua con la hoja de selección final del sistema BES.
          </div>
          <button onClick={onAdvance}
            style={{
              background: `${C.green}18`, border: `1px solid ${C.green}`,
              color: C.green, fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700,
            }}>
            CONTINUAR → PASO 11: Hoja de Selección
          </button>
        </div>
      )}
    </div>
  );
}
