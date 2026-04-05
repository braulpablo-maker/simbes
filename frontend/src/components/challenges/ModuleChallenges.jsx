/**
 * SIMBES — Módulo de Desafíos (PBL: Aprendizaje Basado en Problemas)
 * ====================================================================
 * Lista de desafíos definidos en data/challenges.json.
 * Cada desafío carga una versión embebida del simulador M1
 * con parámetros iniciales fijos y verifica success_criteria en tiempo real.
 */
import { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceDot, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import CHALLENGES from '../../data/challenges.json';
import { C } from '../../theme';
import { Slider } from '../ui';

// ── Physics (M1 engine inlined) ──────────────────────────────────────────────
const M3D_PER_STB = 0.158987;
const FT_PER_M    = 3.28084;

function calcAOF(Pr, Pb, IP) {
  const qb = IP * Math.max(Pr - Pb, 0);
  return qb + (IP * Pb) / 1.8;
}
function iprQtoPwf(Q, Pr, Pb, IP) {
  const qb = IP * Math.max(Pr - Pb, 0);
  if (Q <= qb) return Pr - Q / IP;
  const qVogelMax = (IP * Pb) / 1.8;
  const f   = Math.min(1, (Q - qb) / qVogelMax);
  const disc = 0.04 + 3.2 * (1 - f);
  if (disc < 0) return 0;
  return Math.max(0, ((-0.2 + Math.sqrt(disc)) / 1.6) * Pb);
}
function pumpHeadFt(Q, freq, H0 = 8500, Qmax = 4200) {
  const ratio = freq / 60;
  const Qref  = Q / ratio;
  const Href  = H0 * Math.max(0, 1 - Math.pow(Qref / Qmax, 1.85));
  return Href * ratio * ratio;
}
function vlpPwf(Q, depth_ft, Pwh, freq, grad) {
  const staticPsi = grad * depth_ft;
  const pumpPsi   = pumpHeadFt(Q, freq) * grad;
  const frictionPsi = 1.4e-5 * Q * Q; // [SIMPLIFIED]
  return Math.max(0, Pwh + staticPsi - pumpPsi + frictionPsi);
}
function findOpPoint(Pr, Pb, IP_stbd, depth_ft, Pwh, freq, grad) {
  const aof  = calcAOF(Pr, Pb, IP_stbd);
  const maxQ = aof * 1.2;
  let prev = null;
  for (let i = 0; i <= 2000; i++) {
    const Q    = (maxQ * i) / 2000;
    const diff = iprQtoPwf(Q, Pr, Pb, IP_stbd) - vlpPwf(Q, depth_ft, Pwh, freq, grad);
    if (prev !== null && prev.diff * diff < 0) {
      const t   = prev.diff / (prev.diff - diff);
      const Qop = prev.Q + t * (Q - prev.Q);
      const Pwfop = (iprQtoPwf(Qop, Pr, Pb, IP_stbd) + vlpPwf(Qop, depth_ft, Pwh, freq, grad)) / 2;
      return { Q: Math.round(Qop), Pwf: Math.round(Pwfop) };
    }
    prev = { Q, diff };
  }
  return null;
}
function bepQ(freq) { return 2100 * (freq / 60); }

function computeChallengeSim(init, freq, BSW) {
  const { Pr, Pb, IP: IP_m3dpsi, depth, Pwh, densidad } = init;
  const RHO_AGUA = 1.074;
  const rhoMix   = (1 - (BSW || 0) / 100) * densidad + ((BSW || 0) / 100) * RHO_AGUA;
  const grad     = rhoMix * 0.4335;
  const depth_ft = depth * FT_PER_M;
  const IP_stbd  = IP_m3dpsi / M3D_PER_STB;
  const safePb   = Math.min(Pb, Pr - 50);
  const aof_stbd = calcAOF(Pr, safePb, IP_stbd);
  const aof      = aof_stbd * M3D_PER_STB;
  const qb       = IP_stbd * Math.max(Pr - safePb, 0) * M3D_PER_STB;
  const maxQ_stbd = aof_stbd * 1.18;
  const N = 120;
  const data = [];
  for (let i = 0; i <= N; i++) {
    const Q_stbd = (maxQ_stbd * i) / N;
    data.push({
      Q:   parseFloat((Q_stbd * M3D_PER_STB).toFixed(1)),
      IPR: Math.max(0, iprQtoPwf(Q_stbd, Pr, safePb, IP_stbd)),
      VLP: Math.round(vlpPwf(Q_stbd, depth_ft, Pwh, freq, grad)),
    });
  }
  const opRaw  = findOpPoint(Pr, safePb, IP_stbd, depth_ft, Pwh, freq, grad);
  const op     = opRaw ? { Q: +(opRaw.Q * M3D_PER_STB).toFixed(1), Pwf: opRaw.Pwf } : null;
  const bep_m3d = bepQ(freq) * M3D_PER_STB;
  const alerts = [];
  if (!op) {
    alerts.push({ type: 'danger', msg: 'Sin punto de operación — la bomba no puede vencer el TDH requerido.' });
  } else {
    const dd = (Pr - op.Pwf) / Pr;
    const r  = op.Q / bep_m3d;
    if (op.Pwf < safePb * 0.25)
      alerts.push({ type: 'warning', msg: `Pwf (${op.Pwf.toLocaleString()} psi) muy inferior a Pb → alto riesgo de gas libre.` });
    if (dd > 0.82)
      alerts.push({ type: 'danger', msg: `Drawdown ${Math.round(dd*100)}% — riesgo de producción de arena.` });
    if (r < 0.68)
      alerts.push({ type: 'warning', msg: `Operando al ${Math.round(r*100)}% del BEP → recirculación.` });
    if (r > 1.32)
      alerts.push({ type: 'warning', msg: `Operando al ${Math.round(r*100)}% del BEP → surging.` });
    if (alerts.length === 0)
      alerts.push({ type: 'ok', msg: `Sistema en rango óptimo. Q = ${Math.round(r*100)}% del BEP · Drawdown ${Math.round(dd*100)}%.` });
  }
  return { data, op, aof, qb, bep_m3d, safePb, alerts, grad };
}

// ── Success criteria evaluator ───────────────────────────────────────────────
function evaluateCriteria(criteria, sim, freq) {
  if (!sim.op) return { passed: false, msg: 'Sin punto de operación activo.' };
  const dd = Math.round((sim.op.Pwf / sim.op.Pwf === sim.op.Pwf ? 100 : 0));
  // recompute drawdown properly
  const draw = sim.op ? Math.round((criteria._Pr - sim.op.Pwf) / criteria._Pr * 100) : 0;

  switch (criteria.type) {
    case 'drawdown_range': {
      const pass = draw >= criteria.min && draw <= criteria.max;
      return { passed: pass, msg: pass ? `✓ Drawdown ${draw}% — dentro del rango esperado (${criteria.min}%–${criteria.max}%).` : `Drawdown actual: ${draw}%. Objetivo: ${criteria.min}%–${criteria.max}%.` };
    }
    case 'alert_type': {
      const found = sim.alerts.some(a => a.type === criteria.alert_type);
      return { passed: found, msg: found ? `✓ Alerta de ${criteria.alert_type.toUpperCase()} detectada correctamente.` : `Aún no hay alerta de tipo ${criteria.alert_type.toUpperCase()}.` };
    }
    case 'freq_range': {
      const pass = freq >= criteria.min && freq <= criteria.max;
      return { passed: pass, msg: pass ? `✓ Frecuencia ${freq} Hz está en el rango óptimo (${criteria.min}–${criteria.max} Hz).` : `Frecuencia actual: ${freq} Hz. Busca el rango ${criteria.min}–${criteria.max} Hz.` };
    }
    case 'combined': {
      const noAlerts = !sim.alerts.some(a => criteria.no_alerts.includes(a.type));
      const ddOk     = draw <= criteria.drawdown_max;
      const pass     = noAlerts && ddOk;
      return {
        passed: pass,
        msg: pass
          ? `✓ Sistema óptimo — Drawdown ${draw}% ≤ ${criteria.drawdown_max}% y sin alertas críticas.`
          : `Drawdown: ${draw}% (máx ${criteria.drawdown_max}%) · ${noAlerts ? 'Sin alertas' : 'Hay alertas activas'}. Sigue ajustando.`,
      };
    }
    default: return { passed: false, msg: 'Criterio desconocido.' };
  }
}

// ── Small alert row ──────────────────────────────────────────────────────────
const ALERT_CFG = {
  ok:      { bg: '#22C55E12', border: '#22C55E40', text: '#4ADE80', dot: '#22C55E' },
  warning: { bg: '#F59E0B12', border: '#F59E0B40', text: '#FCD34D', dot: '#F59E0B' },
  danger:  { bg: '#EF444412', border: '#EF444440', text: '#FCA5A5', dot: '#EF4444' },
};
function AlertRow({ type, msg }) {
  const c = ALERT_CFG[type] || ALERT_CFG.ok;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 6, padding: '7px 11px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, marginTop: 4, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: c.text, lineHeight: 1.6, fontFamily: C.font }}>{msg}</span>
    </div>
  );
}

// ── Mini metric ──────────────────────────────────────────────────────────────
function MiniMetric({ label, value, unit, color = C.text }) {
  return (
    <div style={{ background: C.surface, borderRadius: 6, padding: '8px 12px', border: `1px solid ${C.border}`, flex: 1 }}>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: C.fontUI, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 800, color, fontFamily: C.font }}>{value}</div>
      <div style={{ fontSize: 9, color: C.muted, fontFamily: C.fontUI }}>{unit}</div>
    </div>
  );
}

// ── Challenge Card ───────────────────────────────────────────────────────────
function ChallengeCard({ ch, completed, onClick }) {
  const DIFF_COLOR = { básico: C.ok, intermedio: C.warning, avanzado: C.danger };
  return (
    <div
      onClick={onClick}
      style={{
        background: completed ? ch.color + '08' : C.surface,
        border: `1px solid ${completed ? ch.color + '50' : C.border}`,
        borderTop: `3px solid ${ch.color}`,
        borderRadius: 12, padding: '16px 18px',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{ch.module}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ fontSize: 8, color: DIFF_COLOR[ch.difficulty] || C.muted, background: (DIFF_COLOR[ch.difficulty] || C.muted) + '18', padding: '2px 7px', borderRadius: 8, fontFamily: C.fontUI, fontWeight: 600 }}>{ch.difficulty}</span>
          {completed && <span style={{ fontSize: 8, color: C.ok, background: C.ok + '18', padding: '2px 7px', borderRadius: 8, fontFamily: C.fontUI, fontWeight: 600 }}>✓ Resuelto</span>}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: C.fontUI, marginBottom: 4 }}>{ch.title}</div>
      <div style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI, lineHeight: 1.5, marginBottom: 10 }}>{ch.problem_description.slice(0, 120)}…</div>
      <div style={{ fontSize: 10, color: ch.color, fontFamily: C.fontUI, fontWeight: 600 }}>Abrir desafío →</div>
    </div>
  );
}

// ── Challenge Simulator ──────────────────────────────────────────────────────
function ChallengeSimulator({ ch, onBack, onSolve }) {
  const init = ch.initial_state;
  const [freq, setFreq] = useState(init.freq);
  const [BSW,  setBSW]  = useState(init.BSW || 0);
  const [showExpl, setShowExpl] = useState(false);

  const sim = useMemo(() => {
    const result = computeChallengeSim(init, freq, BSW);
    return result;
  }, [freq, BSW]);

  // Inject Pr into criteria for drawdown calc
  const criteriaWithPr = { ...ch.success_criteria, _Pr: init.Pr };
  const evaluation     = evaluateCriteria(criteriaWithPr, sim, freq);

  const dd = sim.op ? Math.round((init.Pr - sim.op.Pwf) / init.Pr * 100) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Back + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 10, padding: '5px 12px', cursor: 'pointer', fontFamily: C.font }}>← Volver</button>
        <div style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>DESAFÍO · {ch.module} · {ch.difficulty}</div>
      </div>

      {/* Problem statement */}
      <div style={{ background: ch.color + '0A', border: `1px solid ${ch.color}30`, borderRadius: 10, padding: '16px 20px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: C.fontUI, marginBottom: 8 }}>{ch.title}</div>
        <p style={{ margin: '0 0 10px', fontSize: 11, color: C.muted, lineHeight: 1.8, fontFamily: C.fontUI }}>{ch.problem_description}</p>
        <div style={{ background: ch.color + '15', borderRadius: 6, padding: '8px 12px', fontSize: 10, color: ch.color, fontFamily: C.fontUI }}>
          <strong>Pista:</strong> {ch.hint}
        </div>
      </div>

      {/* Fixed params banner */}
      <div style={{ background: C.surface, borderRadius: 8, padding: '10px 16px', border: `1px solid ${C.border}`, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: C.muted, fontFamily: C.font, letterSpacing: 1 }}>PARÁMETROS FIJOS:</span>
        {[
          ['Pr', init.Pr, 'psi'], ['Pb', init.Pb, 'psi'], ['IP', init.IP.toFixed(2), 'm³/d/psi'],
          ['Prof.', init.depth, 'm'], ['Pwh', init.Pwh, 'psi'], ['ρ_oil', init.densidad, 'kg/L'],
        ].map(([l, v, u]) => (
          <span key={l} style={{ fontSize: 10, color: C.text, fontFamily: C.font }}>
            <span style={{ color: C.muted }}>{l}: </span>{v} <span style={{ color: C.muted }}>{u}</span>
          </span>
        ))}
      </div>

      {/* Simulator controls + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: C.surface, borderRadius: 8, padding: '14px 16px', border: `1px solid ${ch.color}33` }}>
            <div style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>■ Variables libres</div>
            <Slider label="Frecuencia VSD" unit="Hz" value={freq} min={30} max={70} step={1} onChange={setFreq} accentColor={ch.color}
              tooltip="Modifica la frecuencia para encontrar el punto de operación óptimo. Q ∝ f, H ∝ f², P ∝ f³." />
            <Slider label="BSW — Corte de Agua" unit="%" value={BSW} min={0} max={80} step={5} onChange={setBSW} accentColor="#60A5FA"
              tooltip="Aumenta el corte de agua para simular variaciones en la densidad de la mezcla." />
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <MiniMetric label="Q operativo" value={sim.op ? sim.op.Q.toFixed(1) : '—'} unit="m³/d" color={ch.color} />
            <MiniMetric label="Pwf" value={sim.op ? sim.op.Pwf.toLocaleString() : '—'} unit="psi" color={C.text} />
            <MiniMetric label="Drawdown" value={dd !== null ? `${dd}%` : '—'} unit="de Pr" color={dd > 80 ? C.danger : dd > 60 ? C.warning : C.ok} />
            <MiniMetric label="AOF" value={sim.aof.toFixed(1)} unit="m³/d" color={C.muted} />
          </div>

          {/* Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sim.alerts.map((a, i) => <AlertRow key={i} {...a} />)}
          </div>
        </div>

        {/* Chart */}
        <div style={{ background: '#162032', border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 12px 10px 6px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={sim.data} margin={{ top: 4, right: 24, bottom: 24, left: 20 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="#334155" />
              <XAxis dataKey="Q" type="number" domain={[0, 'dataMax']} tick={{ fill: '#475569', fontSize: 9 }}
                label={{ value: 'Q (m³/d)', position: 'insideBottom', offset: -16, fill: '#475569', fontSize: 10 }} />
              <YAxis domain={[0, Math.ceil(init.Pr * 1.08 / 500) * 500]} tick={{ fill: '#475569', fontSize: 9 }}
                label={{ value: 'Pwf (psi)', angle: -90, position: 'insideLeft', offset: 14, fill: '#475569', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #2D3748', fontSize: 10, fontFamily: C.font }} />
              <ReferenceLine y={sim.safePb} stroke="#FBBF24" strokeDasharray="6 3" strokeWidth={1.5}
                label={{ value: `Pb=${sim.safePb.toLocaleString()}`, fill: '#FBBF24', fontSize: 8, position: 'insideTopRight' }} />
              {sim.op && (
                <ReferenceLine x={sim.bep_m3d} stroke="#F472B6" strokeDasharray="4 4" strokeWidth={1}
                  label={{ value: 'BEP', fill: '#F472B6', fontSize: 8, position: 'insideTopLeft' }} />
              )}
              <Line dataKey="IPR" stroke="#38BDF8" strokeWidth={2.5} dot={false} name="IPR" />
              <Line dataKey="VLP" stroke="#34D399" strokeWidth={2.5} dot={false} name="VLP" strokeDasharray="10 4" />
              {sim.op && (
                <ReferenceDot x={sim.op.Q} y={sim.op.Pwf} r={7} fill="#FB7185" stroke="#0F172A" strokeWidth={2}
                  label={{ value: `(${sim.op.Q}, ${sim.op.Pwf.toLocaleString()})`, fill: '#FB7185', fontSize: 9, position: 'right', offset: 5 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Verification panel */}
      <div style={{
        background: evaluation.passed ? C.ok + '10' : C.surface,
        border: `1px solid ${evaluation.passed ? C.ok + '50' : C.border}`,
        borderRadius: 10, padding: '14px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 9, color: evaluation.passed ? C.ok : C.muted, fontFamily: C.font, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
            {evaluation.passed ? '✓ DESAFÍO RESUELTO' : 'CRITERIO DE ÉXITO'}
          </div>
          <div style={{ fontSize: 11, color: C.text, fontFamily: C.fontUI, lineHeight: 1.6 }}>{evaluation.msg}</div>
        </div>
        {evaluation.passed && (
          <button
            onClick={() => { onSolve(ch.id); setShowExpl(true); }}
            style={{ background: C.ok, border: 'none', borderRadius: 8, color: '#0F172A', fontSize: 11, fontWeight: 700, padding: '9px 20px', cursor: 'pointer', fontFamily: C.fontUI, whiteSpace: 'nowrap' }}
          >Ver explicación</button>
        )}
      </div>

      {/* Explanation (shown after solving) */}
      {showExpl && (
        <div style={{ background: ch.color + '0A', border: `1px solid ${ch.color}40`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>EXPLICACIÓN</div>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.9, fontFamily: C.fontUI }}>{ch.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ── Directed Challenge View (M2–M4: no embedded simulator) ──────────────────
const MODULE_ID_MAP = { M2: 'm2', M3: 'm3', M4: 'm4', M5: 'm5', M6: 'm6', M7: 'm7' };

function DirectedChallengeView({ ch, onBack, onSolve, alreadySolved, onNavigate }) {
  const [showExpl,    setShowExpl]    = useState(false);
  const [justSolved,  setJustSolved]  = useState(false);
  const MODULE_LABELS = { M2: 'Diseño Hidráulico', M3: 'Gas y Multifásico', M4: 'Eléctrico / VSD', M5: 'Sensores', M6: 'Diagnóstico DIFA', M7: 'Confiabilidad' };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 10, padding: '4px 12px', cursor: 'pointer', fontFamily: C.font, marginBottom: 20 }}>
        ← Volver a desafíos
      </button>

      {/* Header */}
      <div style={{ borderTop: `3px solid ${ch.color}`, background: ch.color + '08', border: `1px solid ${ch.color}30`, borderRadius: 10, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2 }}>{ch.module} · {MODULE_LABELS[ch.module]}</span>
          <span style={{ fontSize: 8, color: C.muted, fontFamily: C.fontUI, background: C.surface, padding: '2px 8px', borderRadius: 8 }}>{ch.difficulty}</span>
        </div>
        <h2 style={{ margin: '0 0 10px', fontSize: 18, fontWeight: 800, color: C.text, fontFamily: C.fontUI }}>{ch.title}</h2>
        <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: C.fontUI, lineHeight: 1.8 }}>{ch.problem_description}</p>
      </div>

      {/* Datos iniciales */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: C.muted, fontFamily: C.font, letterSpacing: 2, marginBottom: 10 }}>PARÁMETROS DE CONTEXTO</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(ch.initial_state).map(([k, v]) => (
            <div key={k} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 10, fontFamily: C.font }}>
              <span style={{ color: C.muted }}>{k}: </span>
              <span style={{ color: ch.color, fontWeight: 700 }}>{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Objetivo */}
      <div style={{ background: C.surface, border: `1px solid ${ch.color}40`, borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: ch.color, fontFamily: C.font, letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>OBJETIVO DEL DESAFÍO</div>
        <p style={{ margin: 0, fontSize: 11, color: C.text, fontFamily: C.fontUI, lineHeight: 1.7 }}>{ch.success_criteria.description}</p>
      </div>

      {/* Hint */}
      <div style={{ background: '#FBBF2408', border: '1px solid #FBBF2440', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 11, color: '#FCD34D', fontFamily: C.fontUI, lineHeight: 1.7 }}>
        💡 <strong>Pista:</strong> {ch.hint}
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {onNavigate && MODULE_ID_MAP[ch.module] && (
          <button
            onClick={() => onNavigate(MODULE_ID_MAP[ch.module])}
            style={{ background: ch.color + '18', border: `1px solid ${ch.color}40`, color: ch.color, fontFamily: C.font, fontSize: 11, padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            → Ir al {ch.module} · {MODULE_LABELS[ch.module]}
          </button>
        )}
        {!alreadySolved && !justSolved && (
          <button onClick={() => { onSolve(ch.id); setJustSolved(true); setShowExpl(true); }}
            style={{ background: ch.color + '18', border: `1px solid ${ch.color}`, color: ch.color, fontFamily: C.font, fontSize: 11, padding: '8px 18px', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            ✓ Marcar como resuelto
          </button>
        )}
        {(alreadySolved || justSolved) && !showExpl && (
          <button onClick={() => setShowExpl(true)}
            style={{ background: C.ok + '18', border: `1px solid ${C.ok}`, color: C.ok, fontFamily: C.font, fontSize: 11, padding: '8px 18px', borderRadius: 6, cursor: 'pointer' }}>
            Ver explicación
          </button>
        )}
      </div>

      {/* UX-009 — Toast de confirmación al marcar como resuelto */}
      {justSolved && (
        <div style={{ background: C.ok + '15', border: `1px solid ${C.ok}50`, borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14 }}>🎉</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.ok, fontFamily: C.fontUI }}>¡Desafío completado! +1 en tu progreso</div>
            <div style={{ fontSize: 10, color: C.muted, fontFamily: C.fontUI, marginTop: 2 }}>El avance quedó guardado. Podés ver la explicación a continuación.</div>
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExpl && (
        <div style={{ marginTop: 20, background: ch.color + '0A', border: `1px solid ${ch.color}40`, borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 9, color: ch.color, fontFamily: C.font, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>EXPLICACIÓN</div>
          <p style={{ margin: 0, fontSize: 11, color: C.muted, lineHeight: 1.9, fontFamily: C.fontUI }}>{ch.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ModuleChallenges({ onBack, onNavigate }) {
  const [selected,  setSelected]  = useState(null);
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('simbes_challenges') || '[]'); } catch { return []; }
  });

  const markSolved = (id) => {
    const next = [...new Set([...completed, id])];
    setCompleted(next);
    try { localStorage.setItem('simbes_challenges', JSON.stringify(next)); } catch {}
  };

  if (selected) {
    const ch = CHALLENGES.find(c => c.id === selected);
    return (
      <div style={{ fontFamily: C.fontUI, background: C.bg, minHeight: '100vh', color: C.text, padding: '24px 28px' }}>
        {ch.simulator === 'directed'
          ? <DirectedChallengeView ch={ch} onBack={() => setSelected(null)} onSolve={markSolved} alreadySolved={completed.includes(ch.id)} onNavigate={onNavigate} />
          : <ChallengeSimulator ch={ch} onBack={() => setSelected(null)} onSolve={markSolved} />
        }
      </div>
    );
  }

  return (
    <div style={{ fontFamily: C.fontUI, background: C.bg, minHeight: '100vh', color: C.text, padding: '28px 32px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          {onBack && <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, fontSize: 10, padding: '4px 12px', cursor: 'pointer', fontFamily: C.font }}>← Hub</button>}
          <div style={{ background: '#38BDF818', border: '1px solid #38BDF840', borderRadius: 6, padding: '2px 10px', fontSize: 10, color: C.primary, fontFamily: C.font, fontWeight: 700, letterSpacing: 2 }}>MODO DESAFÍOS</div>
          <span style={{ fontSize: 11, color: C.muted, fontFamily: C.fontUI }}>{completed.length}/{CHALLENGES.length} resueltos</span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 800, color: C.text, fontFamily: C.fontUI, letterSpacing: -0.3 }}>
          Desafíos de Campo
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: C.muted, fontFamily: C.fontUI }}>
          Aprendizaje Basado en Problemas · Escenarios reales de operación BES · Identifica causas raíz usando el simulador
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: C.muted, fontFamily: C.fontUI }}>Progreso general</span>
          <span style={{ fontSize: 10, color: C.ok, fontFamily: C.fontUI, fontWeight: 700 }}>{Math.round(completed.length / CHALLENGES.length * 100)}%</span>
        </div>
        <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: C.ok, borderRadius: 2, width: `${completed.length / CHALLENGES.length * 100}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Challenge grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {CHALLENGES.map(ch => (
          <ChallengeCard
            key={ch.id}
            ch={ch}
            completed={completed.includes(ch.id)}
            onClick={() => setSelected(ch.id)}
          />
        ))}
      </div>
    </div>
  );
}
