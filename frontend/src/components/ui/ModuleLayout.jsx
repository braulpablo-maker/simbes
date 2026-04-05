/**
 * SIMBES — ModuleLayout
 * ======================
 * Shared layout wrapper for all tabbed modules (M1–M8).
 * Provides a unified header and underline-style tab bar.
 *
 * Props:
 *   moduleId    – e.g. "M01", "M02"
 *   title       – module title
 *   subtitle    – description line below title
 *   accentColor – per-module accent for tab highlights
 *   tabs        – [{ id, label }]
 *   activeTab   – current tab id
 *   onTabChange – callback(tabId)
 *   onBack      – optional callback to go back to Hub
 *   children    – rendered below the tab bar
 */
import { C } from '../../theme';

export default function ModuleLayout({
  moduleId,
  title,
  subtitle,
  accentColor = C.primary,
  tabs,
  activeTab,
  onTabChange,
  onBack,
  badge,
  children,
}) {
  return (
    <div style={{
      fontFamily: C.fontUI,
      background: C.bg,
      minHeight: '100vh',
      color: C.text,
      padding: '24px clamp(16px, 3vw, 32px) 48px',
      maxWidth: 1300,
      margin: '0 auto',
    }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'transparent',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            padding: '5px 12px',
            color: C.muted,
            cursor: 'pointer',
            fontSize: 10,
            fontFamily: C.fontUI,
          }}>← Hub</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 9, letterSpacing: 3, color: accentColor,
              fontWeight: 800, fontFamily: C.font,
            }}>{moduleId}</span>
            <span style={{
              fontSize: 21, fontWeight: 800, color: '#F1F5F9',
              fontFamily: C.fontUI,
            }}>{title}</span>
          </div>
          {subtitle && (
            <div style={{
              fontSize: 9, color: C.muted, letterSpacing: 1,
              fontFamily: C.fontUI, marginTop: 2,
            }}>{subtitle}</div>
          )}
        </div>
        {badge !== undefined ? badge : (
          <span style={{
            fontSize: 9, color: C.ok,
            background: C.ok + '18',
            padding: '2px 10px', borderRadius: 10,
            border: `1px solid ${C.ok}30`,
            fontFamily: C.fontUI,
          }}>✅ Disponible</span>
        )}
      </div>

      {/* ── Tab Bar ── */}
      {tabs && tabs.length > 0 && (
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 40, zIndex: 100,
          background: C.bg, paddingTop: 8,
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              style={{
                padding: '8px 18px',
                border: 'none',
                borderRadius: '6px 6px 0 0',
                background: activeTab === t.id ? accentColor + '18' : 'transparent',
                borderBottom: activeTab === t.id
                  ? `2px solid ${accentColor}`
                  : '2px solid transparent',
                color: activeTab === t.id ? accentColor : C.muted,
                cursor: 'pointer',
                fontSize: 10,
                fontFamily: C.fontUI,
                fontWeight: activeTab === t.id ? 700 : 400,
                letterSpacing: 0.5,
              }}
            >{t.label}</button>
          ))}
        </div>
      )}

      {/* ── Content ── */}
      {children}
    </div>
  );
}
