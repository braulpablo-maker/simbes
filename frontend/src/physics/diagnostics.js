/**
 * SIMBES — Motor de Diagnóstico DIFA
 * ===================================
 * Matching de síntomas observados → patrones de falla API RP 11S1.
 *
 * @ref API RP 11S1 — Recommended Practice for Electrical Submersible Pump Teardown Report
 * @ref SPE Brazil FATC 2022 — Failure analysis methodology for ESP
 */

import FAILURE_LIBRARY from '../data/failure-library.json';

// ── Catálogo de síntomas disponibles ─────────────────────────────────────────

export const SYMPTOMS = [
  // Grupo: Eléctrico
  { id: 'lowCurrent',     label: 'Corriente baja (< 60% nominal)',       group: 'electrico',   icon: '⬇️' },
  { id: 'highCurrent',    label: 'Corriente alta (> 120% nominal)',       group: 'electrico',   icon: '⬆️' },
  { id: 'erraticCurrent', label: 'Corriente errática / oscilante',        group: 'electrico',   icon: '〰️' },
  { id: 'lowIR',          label: 'IR bajo (< 1 MΩ) / falla a tierra',    group: 'electrico',   icon: '⚡' },
  // Grupo: Producción
  { id: 'gradualFlow',    label: 'Caudal reducido gradualmente (días/sem)', group: 'produccion', icon: '📉' },
  { id: 'abruptFlow',     label: 'Caudal reducido abruptamente (horas)',  group: 'produccion',  icon: '🔻' },
  // Grupo: Mecánico
  { id: 'highVibration',  label: 'Vibración > 4 mm/s RMS',               group: 'mecanico',    icon: '📳' },
  // Grupo: Térmico
  { id: 'highMotorTemp',  label: 'Temperatura motor sobre límite nominal', group: 'termico',    icon: '🌡️' },
  // Grupo: Hidráulico
  { id: 'highDischPress', label: 'Presión de descarga elevada',           group: 'hidraulico',  icon: '🔺' },
  { id: 'lowDischPress',  label: 'Presión de descarga baja / nula',       group: 'hidraulico',  icon: '⬇️' },
];

export const SYMPTOM_GROUPS = {
  electrico:   { label: 'Eléctrico',    color: '#F472B6' },
  produccion:  { label: 'Producción',   color: '#38BDF8' },
  mecanico:    { label: 'Mecánico',     color: '#34D399' },
  termico:     { label: 'Térmico',      color: '#FB923C' },
  hidraulico:  { label: 'Hidráulico',   color: '#A78BFA' },
};

export const API_SERIES = {
  '3700': { label: 'Serie 3700 — Corrosión / Picadura',          color: '#F59E0B' },
  '4900': { label: 'Serie 4900 — Sello primario / invasión',     color: '#EF4444' },
  '5400': { label: 'Serie 5400 — Sellos secundarios',            color: '#A78BFA' },
  '5900': { label: 'Serie 5900 — Sellos terciarios / cable',     color: '#38BDF8' },
};

// ── Motor de matching ─────────────────────────────────────────────────────────

/**
 * Dado un conjunto de síntomas activos, calcula la probabilidad relativa
 * de cada patrón de falla y los retorna ordenados por confianza.
 *
 * Algoritmo:
 *   score    = Σ weight(i) para cada síntoma activo i
 *   maxScore = Σ weight(i) para todos los síntomas del perfil
 *   penalty  = 0.15 × n_contradicciones_activas
 *   confidence = max(0, score / maxScore − penalty)
 *
 * Solo se retornan patrones con confidence > 0.10.
 *
 * @param {Set<string>} activeSymptoms - IDs de síntomas seleccionados
 * @returns {Array<Object>} patrones ordenados por confidence descendente
 *
 * @ref API RP 11S1 §5 — Failure Pattern Classification
 */
export function diagnose(activeSymptoms) {
  if (!activeSymptoms || activeSymptoms.size === 0) return [];

  const scored = FAILURE_LIBRARY.failure_patterns.map(pattern => {
    const profile       = pattern.symptom_weights || {};
    const contradicts   = pattern.contradicts || [];

    // Sumar score y maxScore
    let score    = 0;
    let maxScore = 0;
    Object.entries(profile).forEach(([symptom, weight]) => {
      maxScore += weight;
      if (activeSymptoms.has(symptom)) score += weight;
    });

    // Penalizar por contradicciones activas
    const activatedContradictions = contradicts.filter(s => activeSymptoms.has(s)).length;
    const penalty = activatedContradictions * 0.15;

    const confidence = maxScore > 0
      ? Math.max(0, score / maxScore - penalty)
      : 0;

    return { ...pattern, score, maxScore, confidence, activatedContradictions };
  });

  return scored
    .filter(p => p.confidence > 0.10)
    .sort((a, b) => b.confidence - a.confidence);
}

/**
 * Retorna el nivel de severidad de un diagnóstico.
 * Si el patrón más probable es "critical", el sistema debe alertar de inmediato.
 *
 * @param {Array} diagnosisResults - resultado de diagnose()
 * @returns {'critical'|'high'|'medium'|'none'}
 */
export function overallSeverity(diagnosisResults) {
  if (!diagnosisResults || diagnosisResults.length === 0) return 'none';
  const top = diagnosisResults[0];
  return top.severity || 'medium';
}

/**
 * Descripción textual del nivel de confianza.
 * @param {number} confidence - 0 a 1
 * @returns {string}
 */
export function confidenceLabel(confidence) {
  if (confidence >= 0.75) return 'Alta';
  if (confidence >= 0.45) return 'Media';
  return 'Baja';
}
