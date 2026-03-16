/**
 * SIMBES — Niveles pedagógicos
 * =============================
 * Define los niveles básico / intermedio / avanzado
 * y qué contenido es visible en cada nivel.
 */

export const LEVELS = {
  basic: {
    id:          'basic',
    label:       'Básico',
    description: '0–6 meses de experiencia. Foco en conceptos y causa-efecto cualitativo.',
    color:       '#22C55E',
    features: {
      showFormulas:        false,
      showDerivations:     false,
      showAdvancedAlerts:  false,
      sliderPrecision:     'coarse',  // pasos grandes
      theoryDepth:         'conceptual',
    },
  },
  intermediate: {
    id:          'intermediate',
    label:       'Intermedio',
    description: '6–18 meses. Comprende las ecuaciones. Puede interpretar diagnósticos.',
    color:       '#F59E0B',
    features: {
      showFormulas:        true,
      showDerivations:     false,
      showAdvancedAlerts:  true,
      sliderPrecision:     'medium',
      theoryDepth:         'equations',
    },
  },
  advanced: {
    id:          'advanced',
    label:       'Avanzado',
    description: '> 18 meses. Diseño completo. Análisis de sensibilidad. Casos DIFA.',
    color:       '#FB7185',
    features: {
      showFormulas:        true,
      showDerivations:     true,
      showAdvancedAlerts:  true,
      sliderPrecision:     'fine',    // pasos pequeños
      theoryDepth:         'full',
    },
  },
};

/** Retorna el nivel por id. Default: 'basic'. */
export function getLevel(id = 'basic') {
  return LEVELS[id] || LEVELS.basic;
}

/** Orden canónico para navegación de niveles. */
export const LEVEL_ORDER = ['basic', 'intermediate', 'advanced'];
