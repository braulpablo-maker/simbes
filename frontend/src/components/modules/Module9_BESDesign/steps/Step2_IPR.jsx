/**
 * SIMBES — M9 PASO 2: IPR con Pwf como dato de entrada estratégico
 * ================================================================
 * DIFERENCIA CLAVE vs M1: Pwf es INPUT (decisión de yacimientos), no resultado.
 * Q_resultante es el OUTPUT calculado por la IPR.
 *
 * Gráfica: curva IPR completa + línea horizontal Pwf (entrada) + línea vertical Q_resultante
 */
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, Legend,
} from 'recharts';
import { buildIPRCurve, M3D_PER_STB } from '../../../../physics/ipr.js';
import { AlertPanel } from '../../../ui/index.jsx';

import { C } from '../../../../theme';

const IP_M3D_TO_STBD = 1 / 6.28981;

function Metric({ label, value, unit, color = C.text, sub }) {
  return (
    <div style={{
      background: C.surfaceAlt, borderRadius: 6, padding: '10px 14px',
      border: `1px solid ${C.border}`,
    }}>
      <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, color, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>
        {value} <span style={{ fontSize: 11, color: C.muted }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Step2_IPR({ inputs, step2, onAdvance, onBack }) {
  const { Q_m3d, AOF_m3d, drawdown_pct, zona, Q_relativo_aof, alerts, blocked } = step2;

  // Construir curva IPR en m³/d
  const IP_stbd = inputs.IP * IP_M3D_TO_STBD;
  const { points } = buildIPRCurve(inputs.Pr, inputs.Pb, IP_stbd, 150);
  const chartData = points.map(p => ({
    Q_m3d: +(p.Q * M3D_PER_STB).toFixed(2),
    Pwf:   +p.Pwf.toFixed(0),
  }));

  const Q_op_display = Q_m3d !== null ? Q_m3d.toFixed(1) : '—';
  const AOF_display  = AOF_m3d !== null ? AOF_m3d.toFixed(1) : '—';

  return (
    <div style={{ padding: '24px 0' }}>

      {/* Encabezado */}
      <div style={{
        background: `${C.indigo}12`, border: `1px solid ${C.indigo}30`,
        borderRadius: 8, padding: '12px 16px', marginBottom: 24,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.text, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>PASO 2 — IPR: caudal resultante al Pwf estratégico</span>
        <br />
        <strong style={{ color: C.indigo }}>Pwf = {inputs.Pwf} psi</strong> es un dato de entrada (decisión de yacimientos), no un resultado.
        La IPR calcula el <strong>Q que el yacimiento puede entregar</strong> a esa presión de fondo.
      </div>

      {/* Layout principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>

        {/* Gráfica IPR */}
        <div style={{
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '16px 8px 8px',
        }}>
          <div style={{
            fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            marginBottom: 8, marginLeft: 16, letterSpacing: 1,
          }}>
            IPR — Curva de afluencia del yacimiento · Pwf vs. Q (m³/d)
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 28 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis
                dataKey="Q_m3d"
                type="number"
                domain={[0, 'auto']}
                tick={{ fill: C.muted, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                tickFormatter={v => Math.round(v)}
                label={{ value: 'Q (m³/d)', position: 'insideBottom', offset: -18, fill: C.muted, fontSize: 10 }}
              />
              <YAxis
                domain={[0, inputs.Pr * 1.05]}
                tick={{ fill: C.muted, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
                label={{ value: 'Pwf (psi)', angle: -90, position: 'insideLeft', offset: 14, fill: C.muted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: C.text }}
                formatter={(v, n) => [n === 'Pwf' ? `${v} psi` : `${v} m³/d`, n]}
                labelFormatter={v => `Q = ${v} m³/d`}
              />

              {/* Curva IPR */}
              <Line
                dataKey="Pwf" stroke={C.indigo} strokeWidth={2.5}
                dot={false} isAnimationActive={false} name="IPR"
              />

              {/* Línea Pb — presión de burbuja */}
              <ReferenceLine y={inputs.Pb} stroke={C.yellow} strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: `Pb=${inputs.Pb}`, position: 'right', fill: C.yellow, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />

              {/* Línea Pwf — ENTRADA estratégica */}
              {inputs.Pwf && (
                <ReferenceLine y={inputs.Pwf} stroke={C.green} strokeDasharray="4 2" strokeWidth={2}
                  label={{ value: `Pwf=${inputs.Pwf} psi`, position: 'insideTopLeft', fill: C.green, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              )}

              {/* Línea Q_resultante */}
              {Q_m3d !== null && (
                <ReferenceLine x={+Q_m3d.toFixed(1)} stroke={C.warning} strokeDasharray="4 2" strokeWidth={2}
                  label={{ value: `Q=${Q_m3d.toFixed(1)} m³/d`, position: 'top', fill: C.warning, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} />
              )}

              {/* Punto de operación */}
              {Q_m3d !== null && (
                <ReferenceDot x={+Q_m3d.toFixed(1)} y={inputs.Pwf}
                  r={6} fill={C.danger} stroke={C.bg} strokeWidth={2} />
              )}
            </LineChart>
          </ResponsiveContainer>

          {/* Leyenda */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            padding: '8px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          }}>
            <span style={{ color: C.indigo }}>── IPR (Vogel+Darcy)</span>
            <span style={{ color: C.green }}>╌ Pwf estratégico (entrada)</span>
            <span style={{ color: C.warning }}>╌ Q resultante</span>
            <span style={{ color: C.yellow }}>╌ Pb (burbuja)</span>
            <span style={{ color: C.danger }}>● Punto operativo</span>
          </div>
        </div>

        {/* Panel derecho — métricas + alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Metric label="Q RESULTANTE" value={Q_op_display} unit="m³/d"
            color={C.warning}
            sub={`A Pwf = ${inputs.Pwf} psi`} />
          <Metric label="AOF — Caudal máximo teórico" value={AOF_display} unit="m³/d"
            color={C.indigo}
            sub="A Pwf = 0 psi" />
          <Metric label="DRAWDOWN" value={drawdown_pct !== null ? drawdown_pct.toFixed(1) : '—'} unit="%"
            color={drawdown_pct > 85 ? C.danger : drawdown_pct > 60 ? C.warning : C.ok}
            sub={`(Pr - Pwf) / Pr × 100`} />
          <Metric label="Q / AOF" value={Q_relativo_aof !== null ? Q_relativo_aof.toFixed(1) : '—'} unit="%"
            color={C.text}
            sub="Fracción del potencial total utilizado" />
          <div style={{
            background: zona === 'Vogel' ? `${C.yellow}14` : `${C.indigo}14`,
            border: `1px solid ${zona === 'Vogel' ? C.yellow : C.indigo}40`,
            borderRadius: 6, padding: '8px 12px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          }}>
            <div style={{ color: C.muted, marginBottom: 2 }}>ZONA IPR</div>
            <div style={{ color: zona === 'Vogel' ? C.yellow : C.indigo, fontWeight: 700, fontSize: 12 }}>
              {zona === 'Vogel' ? '⚡ VOGEL — bifásica' : '● DARCY — lineal'}
            </div>
            <div style={{ color: C.muted, marginTop: 3, fontSize: 9 }}>
              {zona === 'Vogel'
                ? `Pwf (${inputs.Pwf}) < Pb (${inputs.Pb}) → gas libre en fondo`
                : `Pwf (${inputs.Pwf}) ≥ Pb (${inputs.Pb}) → fluido monofásico`}
            </div>
          </div>

          {/* Alertas */}
          <div style={{ marginTop: 4 }}>
            <AlertPanel alerts={alerts} />
          </div>
        </div>
      </div>

      {/* Nota pedagógica */}
      <div style={{
        background: C.surfaceAlt, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '12px 16px', marginTop: 20,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.muted, lineHeight: 1.7,
      }}>
        <span style={{ color: C.indigo, fontWeight: 700 }}>¿Por qué Pwf es un dato de entrada y no un resultado?</span>
        <br />
        En M1 la Pwf emerge del balance nodal IPR∩VLP. En el diseño real, el equipo de{' '}
        <strong style={{ color: C.text }}>yacimientos</strong> define Pwf considerando el drawdown
        admisible, el mecanismo de producción y la política de agotamiento del campo. El ingeniero
        de producción recibe ese Pwf y diseña el sistema BES para alcanzarlo y sostenerlo.
        Esta inversión es la diferencia entre <em>operar un pozo</em> y <em>diseñar un sistema</em>.
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
        <button
          onClick={onBack}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            color: C.muted, fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, padding: '10px 20px', borderRadius: 6, cursor: 'pointer',
            letterSpacing: 1,
          }}>
          ← VOLVER A PASO 1
        </button>

        {!blocked && (
          <button
            onClick={onAdvance}
            style={{
              background: `${C.indigo}22`, border: `1px solid ${C.indigo}`,
              color: C.indigo, fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11, padding: '10px 24px', borderRadius: 6,
              cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
            }}>
            ✓ CONFIRMAR PASO 2 — Datos de afluencia listos
          </button>
        )}

        {blocked && (
          <div style={{
            background: `${C.danger}10`, border: `1px solid ${C.danger}30`,
            borderRadius: 6, padding: '10px 16px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: C.danger,
          }}>
            ❌ BLOQUEO: Pwf demasiado bajo. Volvé al PASO 0 y ajustá el Pwf estratégico.
          </div>
        )}
      </div>
    </div>
  );
}
