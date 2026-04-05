/**
 * SIMBES — Sistema de Diseño "Cyber Monitor" v1.0
 * =================================================
 * Fuente única de verdad para colores, tipografía y espaciado.
 * Importar en cada componente: import { C } from '@/theme';
 *
 * Spec: Dark-mode de alto rendimiento para telemetría e IA.
 * Paleta: Deep Navy base · Electric Cyan acento · Alto contraste.
 */

export const C = {
  // ── Fondos ──────────────────────────────────────────────────────
  bg:         '#0F172A',   // Deep Navy — fondo principal
  surface:    '#1E293B',   // Slate Dark — tarjetas y paneles
  surfaceAlt: '#162032',   // Entre bg y surface — charts y sub-paneles
  border:     '#334155',   // Borde de componentes

  // ── Texto ───────────────────────────────────────────────────────
  text:       '#F1F5F9',   // Ghost White — texto principal
  muted:      '#94A3B8',   // Slate Gray — etiquetas secundarias

  // ── Acento primario (Electric Cyan) ─────────────────────────────
  indigo:     '#38BDF8',   // Mantiene el nombre por compatibilidad → ahora Cyan
  primary:    '#38BDF8',   // Alias semántico

  // ── Alertas / estados ───────────────────────────────────────────
  ok:         '#22C55E',   // Green Neon
  warning:    '#F59E0B',   // Amber
  danger:     '#EF4444',   // Red Alert

  // ── Aliases usados en algunos componentes ───────────────────────
  green:      '#22C55E',
  yellow:     '#FBBF24',
  purple:     '#A78BFA',   // Violet — M3 accent
  warn:       '#F59E0B',   // Alias for warning

  // ── Tipografía ──────────────────────────────────────────────────
  font:       "'JetBrains Mono', 'Courier New', monospace",  // datos numéricos, métricas, charts
  fontUI:     "'Outfit', sans-serif",                         // títulos, etiquetas, botones, nav

  // ── Bordes redondeados ──────────────────────────────────────────
  radius:     '16px',   // tarjetas grandes
  radiusSm:   '8px',    // botones, inputs, badges

  // ── Sombras ─────────────────────────────────────────────────────
  shadow:     '0 8px 24px rgba(56, 189, 248, 0.06)',
  shadowCard: '0 4px 16px rgba(56, 189, 248, 0.04)',
};
