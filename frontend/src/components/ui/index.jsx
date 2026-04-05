/**
 * SIMBES — Átomos de UI reutilizables
 * =====================================
 * Slider      → slider estándar con ? hover tooltip (formato M2)
 * Param       → wrapper genérico para controles no-slider
 * Metric      → métrica de solo lectura con valor calculado
 * AlertPanel  → panel de alertas OK / WARNING / DANGER
 * ControlGroup → agrupador de sliders por categoría
 */

import React, { useState } from 'react';

import { C } from '../../theme';

// ─── Slider ──────────────────────────────────────────────────────

/**
 * Slider estándar con ? hover tooltip (mismo formato que M2).
 *
 * Props:
 *   label       {string}   - Nombre de la variable
 *   unit        {string}   - Unidad de la variable
 *   value       {number}   - Valor actual
 *   min         {number}
 *   max         {number}
 *   step        {number}
 *   dec         {number}   - Decimales a mostrar (default 0)
 *   onChange    {Function} - (value: number) => void
 *   tooltip     {string}   - Texto explicativo (aparece al hover en ?)
 *   accentColor {string}   - Color del valor y del acento del slider
 */
export function Slider({ label, unit, value, min, max, step, dec = 0, onChange, tooltip, accentColor = C.text, format }) {
  const [showTip,  setShowTip]  = useState(false);
  const [editing,  setEditing]  = useState(false);
  const [inputVal, setInputVal] = useState('');

  function commitInput() {
    const parsed = parseFloat(inputVal.replace(',', '.'));
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
    setEditing(false);
  }

  const displayStr = Number(value).toFixed(dec);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: C.text, fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
          {tooltip && (
            <span
              style={{ cursor: 'pointer', color: C.muted, fontSize: 11, border: `1px solid ${C.border}`, borderRadius: 4, padding: '0 5px', lineHeight: '16px', userSelect: 'none' }}
              onMouseEnter={() => setShowTip(true)}
              onMouseLeave={() => setShowTip(false)}
            >?</span>
          )}
        </div>
        {format ? (
          <span style={{ color: accentColor, fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' }}>{format(value)}</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <input
              type="text" inputMode="decimal"
              value={editing ? inputVal : displayStr}
              onFocus={() => { setEditing(true); setInputVal(displayStr); }}
              onChange={e => setInputVal(e.target.value)}
              onBlur={commitInput}
              onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); if (e.key === 'Escape') setEditing(false); }}
              style={{
                background: 'transparent',
                border: editing ? `1px solid ${accentColor}70` : '1px solid transparent',
                borderRadius: 4, outline: 'none',
                color: accentColor, fontWeight: 700, fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace', textAlign: 'right',
                width: `${Math.max(3, displayStr.length + 1)}ch`,
                padding: '0 3px',
              }}
            />
            <span style={{ color: C.muted, fontWeight: 400, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>{unit}</span>
          </div>
        )}
      </div>
      {showTip && tooltip && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 10px', marginBottom: 6, fontSize: 11, color: C.muted, lineHeight: 1.5, fontFamily: 'JetBrains Mono, monospace' }}>
          {tooltip}
        </div>
      )}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor, cursor: 'pointer' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

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
        <span style={{ fontSize: 11, color: C.muted, fontFamily: 'JetBrains Mono' }}
          title={tooltip}>
          {label} {tooltip && <span style={{ opacity: 0.5 }}>ⓘ</span>}
        </span>
        <span style={{ fontSize: 13, color, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
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
export function Metric({ label, value, unit = '', color = C.text, tooltip, sub, size = 20 }) {
  return (
    <div style={{
      background: C.surfaceAlt, borderRadius: 6, padding: '10px 14px',
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font, marginBottom: 2 }}
        title={tooltip}>{label}</div>
      <div style={{ fontSize: size, color, fontFamily: C.font, fontWeight: 700 }}>
        {value} <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, fontFamily: C.font, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Alert (ítem individual) ──────────────────────────────────────

/**
 * Alerta individual. Usar AlertPanel para listas de alertas.
 *
 * Props:
 *   type  {'ok'|'warn'|'warning'|'danger'}
 *   msg   {string}
 */
export function Alert({ type, msg }) {
  const c = type === 'danger' ? C.danger : (type === 'warn' || type === 'warning') ? C.warning : C.ok;
  const icon = type === 'danger' ? '🔴' : (type === 'warn' || type === 'warning') ? '🟡' : '🟢';
  return (
    <div style={{
      background: c + '12', border: `1px solid ${c}40`,
      borderRadius: 6, padding: '8px 12px',
      fontSize: 10, color: c, fontFamily: C.font, lineHeight: 1.6,
    }}>
      {icon} {msg}
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
          fontFamily: 'JetBrains Mono', fontSize: 11, color: colors[a.type],
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
        color, fontFamily: 'JetBrains Mono', textTransform: 'uppercase',
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
          color: C.text, fontFamily: 'JetBrains Mono', fontSize: 11,
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
