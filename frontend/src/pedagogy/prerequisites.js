/**
 * SIMBES — Grafo de prerequisitos entre módulos
 * ===============================================
 * Define qué módulos deben completarse antes de desbloquear otro.
 */

/**
 * Grafo de dependencias.
 * Clave: id del módulo a desbloquear.
 * Valor: array de ids que deben estar completados.
 */
export const PREREQUISITES = {
  m1: [],               // Análisis Nodal — siempre disponible
  m2: ['m1'],           // Hidráulica requiere IPR
  m3: ['m1', 'm2'],     // Gas requiere IPR + Hidráulica
  m4: ['m2'],           // Eléctrico requiere Hidráulica (TDH → kW)
  m5: ['m2', 'm4'],     // Sensores requiere Hidráulica + Eléctrico
  m6: ['m1', 'm2', 'm3', 'm4', 'm5'],  // DIFA requiere todos los anteriores
  m7: ['m1'],           // Confiabilidad puede hacerse con solo IPR
  m8: ['m1', 'm2', 'm3', 'm4'],        // Constructor requiere módulos core
};

/**
 * ¿Está un módulo desbloqueado dado el set de módulos completados?
 *
 * @param {string}   moduleId   - id del módulo a verificar (ej. 'm3')
 * @param {string[]} completed  - ids de módulos completados
 * @returns {boolean}
 */
export function isUnlocked(moduleId, completed = []) {
  const reqs = PREREQUISITES[moduleId] || [];
  return reqs.every(req => completed.includes(req));
}

/**
 * Lista de módulos que se desbloquean al completar un módulo dado.
 *
 * @param {string}   completedId
 * @param {string[]} alreadyCompleted
 * @returns {string[]}
 */
export function newlyUnlocked(completedId, alreadyCompleted = []) {
  const now = [...alreadyCompleted, completedId];
  return Object.keys(PREREQUISITES).filter(mid =>
    !alreadyCompleted.includes(mid) &&
    !now.includes(mid) === false &&
    isUnlocked(mid, now)
  );
}

/** Metadatos de cada módulo para el hub. */
export const MODULE_META = {
  m1: { number: 1, title: 'Análisis Nodal / IPR',     color: '#38BDF8', status: 'available' },
  m2: { number: 2, title: 'Diseño Hidráulico',        color: '#34D399', status: 'coming_soon' },
  m3: { number: 3, title: 'Gas y Multifásico',        color: '#A78BFA', status: 'coming_soon' },
  m4: { number: 4, title: 'Eléctrico / VSD',          color: '#F472B6', status: 'coming_soon' },
  m5: { number: 5, title: 'Sensores y Monitoreo',     color: '#FBBF24', status: 'coming_soon' },
  m6: { number: 6, title: 'Diagnóstico DIFA',         color: '#EF4444', status: 'coming_soon' },
  m7: { number: 7, title: 'Confiabilidad / MTBF',     color: '#FB923C', status: 'coming_soon' },
  m8: { number: 8, title: 'Constructor de Escenarios',color: '#E2E8F0', status: 'coming_soon' },
};
