/**
 * SIMBES — Wrapper Recharts: Gráfica Nodal (IPR + VLP)
 * ======================================================
 * Recibe datos ya calculados y renderiza la gráfica.
 * No contiene lógica de física.
 */

import {
  ComposedChart, Line, ReferenceLine, ReferenceDot,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COLORS = {
  ipr:     '#38BDF8',
  vlp:     '#34D399',
  bep:     '#F472B6',
  pb:      '#FBBF24',
  opPoint: '#FB7185',
};

/**
 * Gráfica Nodal IPR + VLP.
 *
 * Props:
 *   data        {Array<{ Q, IPR, VLP }>}  - puntos de la curva
 *   opPoint     {{ Q, Pwf } | null}        - punto de operación
 *   Pb_psi      {number}                   - presión de burbuja
 *   bepQ_stbd   {number}                   - caudal BEP
 *   xLabel      {string}                   - etiqueta eje X (con unidad)
 *   yLabel      {string}                   - etiqueta eje Y (con unidad)
 */
export default function NodalChart({
  data = [], opPoint = null, Pb_psi, bepQ_stbd,
  xLabel = 'Caudal (STB/d)', yLabel = 'Pwf (psi)',
}) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
        <XAxis
          dataKey="Q"
          label={{ value: xLabel, position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }}
          tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
          tickFormatter={v => v.toFixed(0)}
        />
        <YAxis
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }}
          tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'IBM Plex Mono' }}
          tickFormatter={v => v.toFixed(0)}
        />
        <Tooltip
          contentStyle={{ background: '#111827', border: '1px solid #1E293B',
            fontFamily: 'IBM Plex Mono', fontSize: 11 }}
          labelStyle={{ color: '#CBD5E1' }}
          formatter={(val, name) => [val != null ? val.toFixed(1) : '—', name]}
        />
        <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: 10 }} />

        <Line dataKey="IPR" name="IPR" stroke={COLORS.ipr} dot={false} strokeWidth={2} />
        <Line dataKey="VLP" name="VLP" stroke={COLORS.vlp} dot={false} strokeWidth={2} />

        {Pb_psi != null && (
          <ReferenceLine y={Pb_psi} stroke={COLORS.pb} strokeDasharray="6 3"
            label={{ value: `Pb ${Pb_psi}`, fill: COLORS.pb, fontSize: 10,
              fontFamily: 'IBM Plex Mono', position: 'right' }} />
        )}
        {bepQ_stbd != null && (
          <ReferenceLine x={bepQ_stbd} stroke={COLORS.bep} strokeDasharray="4 4"
            label={{ value: 'BEP', fill: COLORS.bep, fontSize: 10,
              fontFamily: 'IBM Plex Mono', position: 'top' }} />
        )}
        {opPoint && (
          <ReferenceDot x={opPoint.Q} y={opPoint.Pwf} r={7}
            fill={COLORS.opPoint} stroke="#0B0F1A" strokeWidth={2} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
