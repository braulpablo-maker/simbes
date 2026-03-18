/**
 * SIMBES — M9: Exportación de la Hoja de Selección BES
 * =====================================================
 * exportToPDF : abre ventana de impresión con el contenido del datasheet
 * exportToMD  : genera archivo Markdown descargable
 */

// ── PDF ───────────────────────────────────────────────────────────
export function exportToPDF(elementId = 'step11-sheet') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const content = el.innerHTML;
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Hoja de Selección BES — SIMBES M9</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Mono', 'Courier New', monospace;
      background: #fff; color: #1a1a2e;
      padding: 24px; font-size: 11px; line-height: 1.5;
    }
    @media print {
      body { padding: 12px; }
      @page { margin: 14mm; size: A4 portrait; }
    }
  </style>
</head>
<body>
  ${content}
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); window.close(); }, 600);
    };
  </script>
</body>
</html>`);
  win.document.close();
}

// ── Markdown ──────────────────────────────────────────────────────
export function exportToMD(state, inputs) {
  const {
    step2: s2 = {}, step3: s3 = {}, step4: s4 = {},
    step5: s5 = {}, step6: s6 = {}, step7: s7 = {},
    step8: s8 = {}, step9: s9 = {}, step10: s10 = {},
    iterationLog = [],
  } = state;

  const inp = inputs ?? {};
  const sp  = s9.setpoints ?? {};
  const f   = s10.factores ?? {};
  const today = new Date().toISOString().slice(0, 10);

  const lines = [
    `# Hoja de Selección BES — SIMBES M9`,
    `**Fecha:** ${today}  `,
    `**Uso:** Educativo — no usar para decisiones de ingeniería real`,
    ``,
    `---`,
    ``,
    `## A — Datos del Pozo y Fluido`,
    ``,
    `| Parámetro | Valor | Unidad |`,
    `|-----------|-------|--------|`,
    `| Presión estática (Pr) | ${inp.Pr ?? '—'} | psi |`,
    `| Presión de burbuja (Pb) | ${inp.Pb ?? '—'} | psi |`,
    `| Índice de productividad (IP) | ${inp.IP ?? '—'} | m³/d/psi |`,
    `| Pwf estratégico | ${inp.Pwf ?? '—'} | psi |`,
    `| Prof. bomba (D_bomba) | ${inp.D_bomba ?? '—'} | m |`,
    `| Prof. total (D_total) | ${inp.D_total ?? '—'} | m |`,
    `| Temperatura fondo | ${inp.T_fond ?? '—'} | °C |`,
    `| ID casing | ${inp.ID_cas ?? '—'} | pulg |`,
    `| GOR | ${inp.GOR ?? '—'} | m³/m³ |`,
    `| BSW | ${inp.BSW ?? '—'} | % |`,
    `| API | ${inp.API ?? '—'} | °API |`,
    `| H₂S | ${inp.H2S ? 'Sí — NACE MR0175' : 'No'} | |`,
    `| Sólidos | ${inp.solidos ?? '—'} | |`,
    ``,
    `---`,
    ``,
    `## B — Caudal de Diseño (PASO 2)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| Q de diseño | ${s2.Q_m3d?.toFixed(1) ?? '—'} | m³/d |`,
    `| AOF | ${s2.AOF_m3d?.toFixed(1) ?? '—'} | m³/d |`,
    `| Drawdown | ${s2.drawdown_pct?.toFixed(1) ?? '—'} | % |`,
    `| Zona IPR | ${s2.zona ?? '—'} | |`,
    ``,
    `---`,
    ``,
    `## C — Condiciones en Bomba (PASO 3)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| PIP | ${s3.PIP_psi ?? '—'} | psi |`,
    `| GVF crudo | ${s3.GVF_crudo != null ? (s3.GVF_crudo * 100).toFixed(1) : '—'} | % |`,
    `| GVF efectivo | ${s3.GVF_efectivo != null ? (s3.GVF_efectivo * 100).toFixed(1) : '—'} | % |`,
    `| Separador | ${s3.separador_tipo ?? 'Ninguno'} | |`,
    `| Q total en bomba | ${s3.Q_total_m3d?.toFixed(1) ?? '—'} | m³/d |`,
    ``,
    `---`,
    ``,
    `## D — Sistema de Bombeo (PASO 4)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| Serie de bomba | ${s4.serie?.name ?? s4.serie?.id ?? '—'} | |`,
    `| Número de etapas | ${s4.etapas ?? '—'} | etapas |`,
    `| TDH requerido | ${s4.TDH_m?.toFixed(1) ?? '—'} | m |`,
    `| Frecuencia operativa | ${s4.f_operativa ?? '—'} | Hz |`,
    `| BEP ratio | ${s4.bep_pct ?? '—'} | % |`,
    `| Tipo de impulsor | ${s4.tipo_impulsor ?? '—'} | |`,
    `| OD bomba | ${s4.OD_bomba_in ?? '—'} | pulg |`,
    `| HP hidráulico | ${s4.HP_hidraulico?.toFixed(1) ?? '—'} | HP |`,
    ``,
    `---`,
    ``,
    `## E — Motor (PASO 5)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| HP seleccionado | ${s5.HP_seleccionado?.toFixed(1) ?? '—'} | HP |`,
    `| Voltaje motor | ${s5.V_motor ?? '—'} | V |`,
    `| Corriente nominal | ${s5.I_nominal ?? '—'} | A |`,
    `| T° operación | ${s5.T_motor_op ?? '—'} | °C |`,
    `| T° nominal | ${s5.T_rated_motor ?? '—'} | °C |`,
    `| Velocidad anular | ${s5.v_fluido_anular ?? '—'} | m/s |`,
    `| Shroud | ${s5.shroud_requerido ? 'Requerido' : 'No requerido'} | |`,
    ``,
    `---`,
    ``,
    `## F — Cable Eléctrico (PASO 6)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| Calibre AWG | #${s6.AWG ?? '—'} | |`,
    `| Caída de voltaje | ${s6.V_drop_pct ?? '—'} | % |`,
    `| Aislamiento | ${s6.aislamiento_tipo ?? '—'} | |`,
    `| THD estimado | ${s6.THD_pct ?? '—'} | % |`,
    `| Cumple IEEE 519 | ${s6.cumple_ieee519 ? 'Sí' : 'No — evaluar VSD multipulso'} | |`,
    `| Factor vida útil | ${s6.life_factor != null ? (s6.life_factor * 100).toFixed(0) : '—'} | % |`,
    ``,
    `---`,
    ``,
    `## G — Verificación Mecánica (PASO 7)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| OD máx string | ${s7.OD_string_in?.toFixed(3) ?? '—'} | pulg |`,
    `| Holgura por lado | ${s7.holgura_mm?.toFixed(1) ?? '—'} | mm |`,
    `| Dogleg real | ${inp.Dev ?? '—'} | °/30m |`,
    `| Dogleg admisible | ${s7.dogleg_admisible ?? '—'} | °/30m |`,
    `| Status mecánico | ${s7.status?.toUpperCase() ?? '—'} | |`,
    ``,
    `---`,
    ``,
    `## H — Evaluación de Riesgos (PASO 8)`,
    ``,
    `| Riesgo | Estado | Mitigación |`,
    `|--------|--------|------------|`,
    ...(s8.riesgos ?? []).map(r => {
      const icon = r.estado === 'ok' ? '✅' : r.estado === 'warning' ? '⚠️' : '❌';
      return `| ${r.nombre} | ${icon} ${r.estado.toUpperCase()} | ${r.mitigacion} |`;
    }),
    ``,
    `---`,
    ``,
    `## I — Set Points de Protección (PASO 9)`,
    ``,
    `| | Valor | Unidad |`,
    `|--|-------|--------|`,
    `| Frecuencia de arranque | ${s9.f_arranque ?? '—'} | Hz |`,
    `| Rampa de subida | ${s9.rampa_Hz_min ?? '—'} | Hz/min |`,
    `| Sobrecorriente (paro) | ${sp.sobrecorriente ?? '—'} | A |`,
    `| Undercurrent (paro) | ${sp.undercurrent ?? '—'} | A |`,
    `| T° máx motor | ${sp.T_max_motor ?? '—'} | °C |`,
    `| PIP mínimo | ${sp.PIP_min ?? '—'} | psi |`,
    `| Vibración alerta | ${sp.vibracion_alerta ?? 4.0} | mm/s RMS |`,
    `| Vibración paro | ${sp.vibracion_paro ?? 8.0} | mm/s RMS |`,
    ``,
    `---`,
    ``,
    `## J — Evaluación Técnico-Económica (PASO 10)`,
    ``,
    `| | Valor | |`,
    `|--|-------|--|`,
    `| Caudal esperado | ${s10.Q_esperado?.toFixed(1) ?? '—'} m³/d | |`,
    `| MTBF base | ${s10.MTBF_base ?? '—'} días | referencia educativa |`,
    `| Run life estimada | ${s10.run_life_dias ?? '—'} días (${s10.run_life_dias != null ? (s10.run_life_dias / 365).toFixed(1) : '—'} años) | |`,
    `| Factor gas | ${f.factor_gas ?? '—'} | |`,
    `| Factor temperatura | ${f.factor_T ?? '—'} | |`,
    `| Factor sólidos | ${f.factor_solidos ?? '—'} | |`,
    `| Factor H₂S | ${f.factor_H2S ?? '—'} | |`,
    `| Factor total | ${f.factor_total != null ? (f.factor_total * 100).toFixed(0) : '—'}% | |`,
    `| CAPEX orientativo | ${s10.capex_categoria ?? '—'} | |`,
    ...(s10.capex_extras ?? []).map(e => `| Extra | ${e} | |`),
    ``,
    `---`,
    ``,
  ];

  if (iterationLog.length > 0) {
    lines.push(`## K — Log de Iteraciones (Ciclos A–F)`, ``);
    iterationLog.forEach((entry, i) => {
      lines.push(`${i + 1}. **Ciclo ${entry.ciclo} / P${entry.paso}** — ${entry.condicion} → ${entry.accion} → ${entry.resultado}`);
    });
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`*Generado por SIMBES M9 — Uso educativo únicamente. Validar con datos reales antes de emitir orden de compra.*`);

  const mdContent = lines.join('\n');
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `BES_selection_${today}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
