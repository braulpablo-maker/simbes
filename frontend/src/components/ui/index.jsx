/**
 * SIMBES — Átomos de UI reutilizables
 * =====================================
 * Param       → slider con etiqueta, valor y tooltip
 * Metric      → métrica de solo lectura con valor calculado
 * AlertPanel  → panel de alertas OK / WARNING / DANGER
 * ControlGroup → agrupador de sliders por categoría
 */

import React from 'react';

const C = {
  ok:      '#22C55E',
  warning: '#F59E0B',
  danger:  '#EF4444',
  text:    '#CBD5E1',
  muted:   '#64748B',
  surface: '#111827',
  border:  '#1E293B',
};

// ─── Param ───────────────────────────────────────────────────────

/**
 * Slider interactivo con etiqueta, valor y unidad.
 *
 * Props:
 *   label      {string}   - Nombre de la variable
 *   value      {number}   - Valor actual
 *   min        {number}
 *   max        {number}
 *   step       {number}
 *   unit       {string}   - Unidad (ej. "psi", "Hz")
 *   color      {string}   - Color del acento (hex)
 *   tooltip    {string}   - Texto explicativo
 *   onChange   {Function} - (value: number) => void
 *   format     {Function} - Formateador del valor mostrado (opcional)
 */
export function Param({ label, value, min, max, step, unit, color = C.text,
  tooltip, onChange, format }) {
  const display = format ? format(value) : value;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'IBM Plex Mono' }}
          title={tooltip}>
          {label} {tooltip && <span style={{ opacity: 0.5 }}>ⓘ</span>}
        </span>
        <span style={{ fontSize: 13, color, fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>
          {display} <span style={{ fontSize: 10, color: C.muted }}>{unit}</span>
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: color, cursor: 'pointer' }}
      />
    </div>
  );
}

// ─── Metric ──────────────────────────────────────────────────────

/**
 * Métrica de solo lectura.
 *
 * Props:
 *   label   {string}
 *   value   {string|number}
 *   unit    {string}
 *   color   {string}
 *   tooltip {string}
 */
export function Metric({ label, value, unit = '', color = C.text, tooltip }) {
  return (
    <div style={{
      background: '#0D1424', borderRadius: 6, padding: '8px 12px',
      border: `1px solid ${C.border}`, marginBottom: 8,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'IBM Plex Mono' }}
        title={tooltip}>{label}</div>
      <div style={{ fontSize: 20, color, fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>
        {value} <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>
      </div>
    </div>
  );
}

// ─── AlertPanel ──────────────────────────────────────────────────

/**
 * Panel de alertas con soporte para ok / warning / danger.
 *
 * Props:
 *   alerts  {Array<{ type: 'ok'|'warning'|'danger', msg: string }>}
 */
export function AlertPanel({ alerts = [] }) {
  if (!alerts.length) return null;
  const icons  = { ok: '●', warning: '▲', danger: '✖' };
  const colors = { ok: C.ok, warning: C.warning, danger: C.danger };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {alerts.map((a, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: `${colors[a.type]}12`,
          border: `1px solid ${colors[a.type]}40`,
          borderRadius: 6, padding: '8px 12px',
          fontFamily: 'IBM Plex Mono', fontSize: 11, color: colors[a.type],
        }}>
          <span style={{ marginTop: 1 }}>{icons[a.type]}</span>
          <span style={{ color: C.text }}>{a.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── ControlGroup ────────────────────────────────────────────────

/**
 * Agrupador de controles con título y línea de acento.
 *
 * Props:
 *   title    {string}
 *   color    {string}
 *   children {ReactNode}
 */
export function ControlGroup({ title, color = C.text, children }) {
  return (
    <div style={{
      borderLeft: `3px solid ${color}`,
      paddingLeft: 12, marginBottom: 20,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: 2,
        color, fontFamily: 'IBM Plex Mono', textTransform: 'uppercase',
        marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── SectionToggle ───────────────────────────────────────────────

/**
 * Sección colapsable con título.
 *
 * Props:
 *   title    {string}
 *   children {ReactNode}
 *   defaultOpen {boolean}
 */
export function SectionToggle({ title, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: '#1E293B', border: 'none',
          color: C.text, fontFamily: 'IBM Plex Mono', fontSize: 11,
          padding: '8px 12px', cursor: 'pointer', textAlign: 'left',
          borderRadius: open ? '6px 6px 0 0' : 6,
          display: 'flex', justifyContent: 'space-between',
        }}>
        <span>{title}</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          background: '#0D1424', border: '1px solid #1E293B',
          borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 16,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
