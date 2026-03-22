/**
 * SIMBES — M9 PASO 0: Ingreso de datos del sistema
 * =================================================
 * Formulario con 4 secciones colapsables.
 * Inputs tipo number (no sliders) — datos de diseño requieren precisión.
 * Validación en tiempo real. Botón bloqueado hasta que todo sea válido.
 */
import { useState } from 'react';

import { C } from '../../../../theme';

// ── Sección colapsable ──────────────────────────────────────────
function Section({ title, color, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: C.surface,
          border: `1px solid ${color}40`, borderLeft: `3px solid ${color}`,
          color: C.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          padding: '9px 14px', cursor: 'pointer', textAlign: 'left',
          borderRadius: open ? '6px 6px 0 0' : 6,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 700, letterSpacing: 1,
        }}>
        <span style={{ color }}>{title}</span>
        <span style={{ color: C.muted }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          background: C.surfaceAlt, border: `1px solid ${C.border}`,
          borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 16,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Campo de entrada individual ──────────────────────────────────
function Field({ label, field, value, unit, min, max, step = 1, tooltip,
  type = 'number', color = C.muted, errors, onChange }) {
  const err = errors?.[field];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: 0.5 }} title={tooltip}>
        {label} {unit && <span style={{ color: C.muted, opacity: 0.6 }}>({unit})</span>}
        {tooltip && <span style={{ opacity: 0.5, marginLeft: 4 }}>ⓘ</span>}
      </label>
      <input
        type={type}
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(field, type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        style={{
          background: C.bg, border: `1px solid ${err ? C.danger : C.border}`,
          borderRadius: 4, padding: '6px 10px',
          color: err ? C.danger : C.text,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          width: '100%', boxSizing: 'border-box',
          outline: 'none',
        }}
      />
      {err && <span style={{ fontSize: 10, color: C.danger, fontFamily: 'JetBrains Mono, monospace' }}>{err}</span>}
    </div>
  );
}

// ── Toggle booleano ──────────────────────────────────────────────
function Toggle({ label, field, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5 }}>
        {label}
      </label>
      <button
        onClick={() => onChange(field, !value)}
        style={{
          background: value ? '#EF444418' : C.bg,
          border: `1px solid ${value ? C.danger : C.border}`,
          borderRadius: 4, padding: '6px 10px',
          color: value ? C.danger : C.muted,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          cursor: 'pointer', textAlign: 'left',
        }}>
        {value ? '✓ Sí — Presente' : '✗ No — Ausente'}
      </button>
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────
function SelectField({ label, field, value, options, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <label style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(field, e.target.value)}
        style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 4, padding: '6px 10px',
          color: C.text, fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          width: '100%', cursor: 'pointer',
        }}>
        {options.map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
      </select>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function Step0_DataEntry({ inputs, errors, step0Valid, onUpdate, onValidate, onAdvance }) {
  return (
    <div style={{ padding: '24px 0' }}>

      {/* Instrucción */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 0 — Ingreso de datos del sistema</span>
        <br />
        Ingresá los parámetros del pozo, yacimiento y fluido. Todos los campos son requeridos.
        La <strong style={{ color: C.indigo }}>Pwf (Presión Fluyente de Fondo)</strong> es una{' '}
        <strong>decisión estratégica de yacimientos</strong> — no es un resultado calculado.
      </div>

      {/* Sección 1 — Yacimiento */}
      <Section title="① YACIMIENTO" color={C.indigo} defaultOpen={true}>
        <Field label="Pr — Presión estática" field="Pr" value={inputs.Pr} unit="psi"
          min={500} max={10000} step={50} tooltip="Presión promedio actual del reservorio (prueba de presión)"
          errors={errors} onChange={onUpdate} />
        <Field label="Pb — Presión de burbuja" field="Pb" value={inputs.Pb} unit="psi"
          min={100} max={inputs.Pr} step={50} tooltip="Presión a la que el primer gas libre aparece. Pb ≤ Pr siempre."
          errors={errors} onChange={onUpdate} />
        <Field label="IP — Índice de Productividad" field="IP" value={inputs.IP} unit="m³/d/psi"
          min={0.01} max={5} step={0.01} tooltip="Capacidad de entrega del yacimiento por unidad de drawdown. De prueba de pozo."
          errors={errors} onChange={onUpdate} />
        <Field label="Pwf — Presión fluyente de fondo" field="Pwf" value={inputs.Pwf} unit="psi"
          min={100} max={inputs.Pr - 50} step={50}
          tooltip="Decisión estratégica de yacimientos. Define el drawdown y el Q resultante. No es un resultado calculado."
          color={C.indigo} errors={errors} onChange={onUpdate} />
      </Section>

      {/* Sección 2 — Pozo */}
      <Section title="② GEOMETRÍA DEL POZO" color={C.green}>
        <Field label="D_bomba — Prof. asentamiento bomba" field="D_bomba" value={inputs.D_bomba} unit="m"
          min={500} max={5000} step={50} tooltip="Profundidad vertical verdadera del punto de descarga de la bomba."
          errors={errors} onChange={onUpdate} />
        <Field label="D_total — Prof. total del pozo" field="D_total" value={inputs.D_total} unit="m"
          min={inputs.D_bomba + 50} max={6000} step={50}
          tooltip="Profundidad total del pozo. Debe ser mayor que D_bomba."
          errors={errors} onChange={onUpdate} />
        <Field label="WHP — Presión en cabeza de pozo" field="WHP" value={inputs.WHP} unit="psi"
          min={30} max={500} step={10} tooltip="Presión de descarga en superficie (wellhead pressure)."
          errors={errors} onChange={onUpdate} />
        <Field label="γ — Gradiente del fluido" field="gamma" value={inputs.gamma} unit="psi/ft"
          min={0.30} max={0.55} step={0.01} tooltip="Gradiente de presión del fluido producido. Agua: 0.433, crudo típico: 0.35–0.42."
          errors={errors} onChange={onUpdate} />
        <Field label="T_fond — Temperatura de fondo" field="T_fond" value={inputs.T_fond} unit="°C"
          min={40} max={200} step={5} tooltip="Temperatura en la profundidad de la bomba. Afecta aislamiento y vida útil."
          errors={errors} onChange={onUpdate} />
        <Field label="T_sup — Temperatura superficial" field="T_sup" value={inputs.T_sup} unit="°C"
          min={5} max={50} step={1} tooltip="Temperatura promedio en superficie. Afecta corrección del cable."
          errors={errors} onChange={onUpdate} />
        <Field label="ID_cas — Diámetro interno casing" field="ID_cas" value={inputs.ID_cas} unit="pulg"
          min={4.5} max={13.375} step={0.125} tooltip="Drift del casing (ID libre). Determina restricción de OD de la serie BES."
          errors={errors} onChange={onUpdate} />
        <Field label="Dev — Desviación del pozo" field="Dev" value={inputs.Dev} unit="°/30m"
          min={0} max={90} step={1} tooltip="Dogleg severity máximo. Afecta instalación mecánica del string BES."
          errors={errors} onChange={onUpdate} />
      </Section>

      {/* Sección 3 — Fluido */}
      <Section title="③ PROPIEDADES DEL FLUIDO" color={C.purple}>
        <Field label="GOR — Gas-Oil Ratio" field="GOR" value={inputs.GOR} unit="m³/m³"
          min={0} max={800} step={5} tooltip="Gas-Oil Ratio en condiciones estándar de superficie."
          errors={errors} onChange={onUpdate} />
        <Field label="BSW — Corte de agua" field="BSW" value={inputs.BSW} unit="%"
          min={0} max={98} step={1} tooltip="Basic Sediment & Water. Fracción de agua en la producción total."
          errors={errors} onChange={onUpdate} />
        <Field label="Viscosidad del crudo" field="visc" value={inputs.visc} unit="cp"
          min={1} max={500} step={1} tooltip="Viscosidad a temperatura de bomba. Alta viscosidad degrada curva H-Q."
          errors={errors} onChange={onUpdate} />
        <Field label="Gravedad API" field="API" value={inputs.API} unit="°API"
          min={10} max={50} step={1} tooltip="Gravedad API del crudo. Determina densidad y factor volumétrico Bo."
          errors={errors} onChange={onUpdate} />
        <Toggle label="H₂S — Gas amargo" field="H2S" value={inputs.H2S} onChange={onUpdate} />
        <Toggle label="CO₂ — Dióxido de carbono" field="CO2" value={inputs.CO2} onChange={onUpdate} />
        <SelectField label="Contenido de sólidos" field="solidos" value={inputs.solidos}
          options={[['Bajo', 'Bajo — sin riesgo de abrasión'], ['Medio', 'Medio — abrasión moderada'], ['Alto', 'Alto — requiere bomba hardface']]}
          onChange={onUpdate} />
      </Section>

      {/* Sección 4 — Superficie */}
      <Section title="④ INSTALACIÓN DE SUPERFICIE" color={C.pink}>
        <Field label="Voltaje disponible" field="V_sup" value={inputs.V_sup} unit="V"
          min={480} max={13800} step={120} tooltip="Voltaje del transformador en superficie. Determina rango de motor seleccionable."
          errors={errors} onChange={onUpdate} />
        <SelectField label="Frecuencia de red" field="f_red" value={inputs.f_red}
          options={[['60', '60 Hz (América)'], ['50', '50 Hz (Europa/Asia)']]}
          onChange={(f, v) => onUpdate(f, parseFloat(v))} />
        <SelectField label="Topología VSD" field="VSD" value={inputs.VSD}
          options={[
            ['standard_6pulse', '6 pulsos (estándar) — THD 25–35%'],
            ['multipulse_12', '12 pulsos — THD 15–20%'],
            ['multipulse_18', '18 pulsos — THD < 5%'],
            ['afe', 'AFE (Active Front End) — THD < 3%'],
          ]}
          onChange={onUpdate} />
      </Section>

      {/* Errores globales */}
      {!step0Valid && Object.keys(errors).length > 0 && (
        <div style={{
          background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.danger,
        }}>
          ✖ {Object.keys(errors).length} campo(s) con error. Corregí antes de continuar.
        </div>
      )}

      {/* Botón Validar / Continuar */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={onValidate}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
            letterSpacing: 1,
          }}>
          VALIDAR DATOS
        </button>
        <button
          onClick={onAdvance}
          disabled={!step0Valid}
          style={{
            background: step0Valid ? `${C.indigo}22` : C.surface,
            border: `1px solid ${step0Valid ? C.indigo : C.border}`,
            color: step0Valid ? C.indigo : C.muted,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, padding: '10px 24px', borderRadius: 6,
            cursor: step0Valid ? 'pointer' : 'not-allowed',
            fontWeight: 700, letterSpacing: 1, opacity: step0Valid ? 1 : 0.5,
          }}>
          CONTINUAR → PASO 1: CANDIDATURA BES
        </button>
      </div>
    </div>
  );
}
