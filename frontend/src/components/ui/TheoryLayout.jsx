/**
 * SIMBES — TheoryLayout
 * =====================
 * Componente estándar para la pestaña Teoría de todos los módulos.
 * Accordion colapsable · Outfit para texto · JetBrains Mono para datos.
 *
 * Props:
 *   sections    {Array}  — ver estructura en teoria-data.js de cada módulo
 *   accentColor {string} — color de acento del módulo (default: C.indigo)
 */
import { useState } from 'react';
import { C } from '@/theme';

/* ─── Sub-componentes internos ──────────────────────────────── */

function FormulaBlock({ text, accent }) {
  return (
    <div style={{
      background: C.surfaceAlt, border: `1px solid ${C.border}`,
      borderRadius: C.radiusSm, padding: '14px 18px',
    }}>
      <pre style={{
        fontFamily: C.font, fontSize: 13, color: accent,
        margin: 0, lineHeight: 2.0, whiteSpace: 'pre-wrap',
      }}>
        {text}
      </pre>
    </div>
  );
}

function VariablesTable({ variables, accent }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: C.radiusSm, overflow: 'hidden' }}>
      {/* Encabezado */}
      <div style={{
        display: 'grid', gridTemplateColumns: '90px 110px 1fr',
        background: C.surface, padding: '7px 14px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {['Símbolo', 'Unidad', 'Descripción'].map(h => (
          <span key={h} style={{
            fontFamily: C.fontUI, fontSize: 10, fontWeight: 600,
            color: C.muted, textTransform: 'uppercase', letterSpacing: 0.8,
          }}>{h}</span>
        ))}
      </div>
      {/* Filas */}
      {variables.map((v, i) => (
        <div key={v.sym + i} style={{
          display: 'grid', gridTemplateColumns: '90px 110px 1fr',
          padding: '8px 14px',
          background: i % 2 === 0 ? C.bg : C.surface,
          borderBottom: i < variables.length - 1 ? `1px solid ${C.border}` : 'none',
        }}>
          <span style={{ fontFamily: C.font, fontSize: 12, color: accent, fontWeight: 700 }}>{v.sym}</span>
          <span style={{ fontFamily: C.font, fontSize: 12, color: C.muted }}>{v.unit}</span>
          <span style={{ fontFamily: C.fontUI, fontSize: 12, color: C.text, lineHeight: 1.5 }}>{v.desc}</span>
        </div>
      ))}
    </div>
  );
}

function ReglaBadge({ texto, tipo = 'indigo', accent }) {
  const color = tipo === 'warning' ? C.warning
              : tipo === 'ok'      ? C.ok
              : tipo === 'danger'  ? C.danger
              :                     accent;
  return (
    <div style={{
      padding: '10px 16px', borderRadius: C.radiusSm,
      background: `${color}18`, border: `1px solid ${color}40`,
      fontFamily: C.fontUI, fontSize: 12, fontWeight: 600,
      color, lineHeight: 1.6,
    }}>
      💡 {texto}
    </div>
  );
}

function GlosarioGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {items.map(g => (
        <div key={g.term} style={{
          background: C.surface, borderRadius: C.radiusSm,
          padding: '9px 12px', border: `1px solid ${C.border}`,
        }}>
          <div style={{
            fontFamily: C.font, fontSize: 11,
            color: C.indigo, fontWeight: 700, marginBottom: 3,
          }}>{g.term}</div>
          <div style={{
            fontFamily: C.fontUI, fontSize: 11,
            color: C.muted, lineHeight: 1.5,
          }}>{g.def}</div>
        </div>
      ))}
    </div>
  );
}

function ReferenciasBlock({ items, accent }) {
  return (
    <div style={{
      marginTop: 8, background: C.surfaceAlt,
      border: `1px solid ${C.border}`,
      borderRadius: C.radiusSm, padding: '14px 18px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        fontFamily: C.fontUI, fontSize: 11, fontWeight: 800, color: accent,
        textTransform: 'uppercase', letterSpacing: 1.5,
      }}>
        <span>📚 REFERENCIAS BIBLIOGRÁFICAS</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((ref, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ color: accent, fontSize: 12, marginTop: 1 }}>•</span>
            <span style={{ fontFamily: C.fontUI, fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
              {ref}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────── */

export default function TheoryLayout({ sections = [], accentColor }) {
  const accent = accentColor ?? C.indigo;
  const [openId, setOpenId] = useState(sections[0]?.id ?? null);

  const toggle = id => setOpenId(prev => prev === id ? null : id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {sections.map(sec => {
        const isOpen = openId === sec.id;
        return (
          <div key={sec.id} style={{
            borderRadius: C.radiusSm, overflow: 'hidden',
            border: `1px solid ${isOpen ? accent + '50' : C.border}`,
            boxShadow: isOpen ? C.shadowCard : 'none',
            transition: 'box-shadow 200ms',
          }}>

            {/* ── Cabecera del acordeón ─────────────────── */}
            <button
              onClick={() => toggle(sec.id)}
              style={{
                width: '100%', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 18px',
                background: isOpen ? `${accent}14` : C.surface,
                border: 'none', cursor: 'pointer',
                fontFamily: C.fontUI, fontSize: 13, fontWeight: 600,
                color: isOpen ? accent : C.text,
                letterSpacing: 0.2,
              }}
            >
              <span>{sec.title}</span>
              <span style={{ fontSize: 10, opacity: 0.6, transition: 'transform 200ms',
                transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)' }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* ── Contenido ─────────────────────────────── */}
            {isOpen && (
              <div style={{
                padding: '20px 18px', background: C.bg,
                display: 'flex', flexDirection: 'column', gap: 16,
                borderTop: `1px solid ${C.border}`,
              }}>

                {/* Concepto pedagógico */}
                {sec.concepto && (
                  <p style={{
                    fontFamily: C.fontUI, fontSize: 13,
                    color: C.muted, lineHeight: 1.75, margin: 0,
                  }}>
                    {sec.concepto}
                  </p>
                )}

                {/* Fórmula */}
                {sec.formula && <FormulaBlock text={sec.formula} accent={accent} />}

                {/* Tabla de variables */}
                {sec.variables?.length > 0 && (
                  <VariablesTable variables={sec.variables} accent={accent} />
                )}

                {/* Regla operativa */}
                {sec.regla && (
                  <ReglaBadge texto={sec.regla} tipo={sec.tipo_regla} accent={accent} />
                )}

                {/* Ejemplo Resuelto PED-001 */}
                {sec.ejemplo_resuelto && (
                  <div style={{
                    marginTop: 8, background: '#0F172A',
                    border: `1px solid ${accent}40`, borderLeft: `3px solid ${accent}`,
                    borderRadius: '0 6px 6px 0', padding: '14px 18px',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                      fontFamily: C.fontUI, fontSize: 11, fontWeight: 800, color: accent,
                      textTransform: 'uppercase', letterSpacing: 1.5,
                    }}>
                      <span>📐 EJEMPLO RESUELTO</span>
                    </div>
                    {sec.ejemplo_resuelto.contexto && (
                      <p style={{ margin: '0 0 10px', fontFamily: C.fontUI, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                        {sec.ejemplo_resuelto.contexto}
                      </p>
                    )}
                    <div style={{
                      background: '#1E293B', padding: '10px 14px', borderRadius: 6,
                      border: `1px dashed ${accent}30`, fontFamily: C.font, fontSize: 12,
                      display: 'flex', flexDirection: 'column', gap: 6, lineHeight: 1.5
                    }}>
                      {sec.ejemplo_resuelto.pasos.map((paso, i) => (
                        <div key={i} style={{ display: 'flex' }}>
                          <span style={{ color: accent, marginRight: 8, fontWeight: 700 }}>{'>'}</span>
                          <span style={{ color: C.muted }}>{paso}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contenido extra (gráficas, grids especiales) */}
                {sec.extra && sec.extra}

                {/* Glosario */}
                {sec.glosario?.length > 0 && <GlosarioGrid items={sec.glosario} />}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
