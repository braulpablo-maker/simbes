/**
 * SIMBES — Componente ComingSoon
 * Placeholder visual para módulos no implementados.
 */

export function ComingSoon({ number, title, topics = [] }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0B0F1A', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 32,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <div style={{
        background: '#111827', border: '1px solid #1E293B',
        borderRadius: 12, padding: 48, maxWidth: 560, width: '100%',
        textAlign: 'center',
      }}>
        {/* Badge de módulo */}
        <div style={{
          display: 'inline-block', background: '#1E293B',
          color: '#F472B6', fontSize: 11, fontWeight: 700,
          padding: '4px 14px', borderRadius: 20, letterSpacing: 2,
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          MÓDULO {String(number).padStart(2, '0')}
        </div>

        {/* Título */}
        <h2 style={{ color: '#CBD5E1', fontSize: 22, fontWeight: 800,
          margin: '0 0 8px', letterSpacing: -0.5 }}>
          {title}
        </h2>

        {/* Estado */}
        <p style={{ color: '#64748B', fontSize: 12, margin: '0 0 32px' }}>
          En desarrollo · Roadmap Fase 1–2
        </p>

        {/* Temas que cubre */}
        <div style={{
          background: '#0D1424', border: '1px solid #1E293B',
          borderRadius: 8, padding: '16px 20px', textAlign: 'left',
        }}>
          <div style={{ fontSize: 10, color: '#64748B', letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 12 }}>
            Física que cubre este módulo
          </div>
          {topics.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '6px 0', borderBottom: i < topics.length - 1 ? '1px solid #1E293B' : 'none',
            }}>
              <span style={{ color: '#F472B6', marginTop: 1, flexShrink: 0 }}>→</span>
              <span style={{ color: '#94A3B8', fontSize: 12, lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Nota */}
        <p style={{ color: '#334155', fontSize: 10, margin: '24px 0 0', lineHeight: 1.6 }}>
          Mientras tanto, experimenta con el Módulo 1 — Análisis Nodal.
        </p>
      </div>
    </div>
  );
}
