/**
 * SIMBES — M5: Sensores y Monitoreo
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: ISO 10816-3 | API RP 11S5 | Práctica de campo BES
 */

export const TEORIA_M5 = [
  {
    id: 'amperimetrica',
    title: '① Cartas Amperimétricas',
    concepto: 'Las cartas amperimétricas son registros de corriente del motor vs. tiempo. Son el sensor más básico y universalmente disponible en un BES. Cada patrón de corriente tiene una firma diagnóstica característica.',
    formula:
`NORMAL:    Corriente estable ≈ 95–105% nominal. Ruido ±2%.

SURGING:   Corriente oscilante ±15–25% a 0.3–0.8 Hz.
           Causa: bomba fuera del BEP o ingesta cíclica de gas.

SUBCARGA:  Corriente baja sostenida < 70% nominal.
           Causa: gas en bomba, baja densidad, eje roto.

SOBRECARGA: Corriente alta > 115% nominal.
           Causa: alta viscosidad, sólidos, back-pressure alta.

GAS LOCK:  Caída súbita < 20% nominal — la bomba gira en gas.
           ACCIÓN INMEDIATA: paro y purga del sistema.`,
    variables: [
      { sym: 'I_nom',  unit: 'A', desc: 'Corriente nominal del motor al 100% de carga' },
      { sym: 'I_op',   unit: 'A', desc: 'Corriente de operación real medida en superficie' },
    ],
    regla: 'La carta amperimérica es el primer diagnóstico: revisar antes de cualquier intervención en el pozo.',
    tipo_regla: 'indigo',
    ejemplo_resuelto: {
      contexto: "Se recibe una alerta de paro en un BES; la carta registró una caída repentina de 80 A a 14 A constante durante 3 minutos antes del trip de bajacarga.",
      pasos: [
        "Paso 1: Identificar el patrón: Caída súbita y sostenida < 20% (14A / 80A ≈ 17.5%).",
        "Paso 2: Correlacionar patrón con diagnóstico: La bomba se ha quedado sin líquido para impulsar, típicamente por Gas Lock.",
        "Paso 3: Plan de acción: No intentar pender de nuevo en las mismas condiciones; asegurar purga de gas para cebar el sistema."
      ]
    }
  },

  {
    id: 'dpts',
    title: '② Sensores P/T Downhole (DPTS)',
    concepto: 'El DPTS mide presión y temperatura directamente en el fondo del pozo. Proporciona los datos más confiables para diagnóstico del sistema BES y para validar los modelos de simulación.',
    formula:
`T_BH = T_sup + (gradiente × profundidad)

Gradiente geotérmico típico: 2.5–4.0°C por cada 100 m

Datos clave:
  Ps (intake)   → comparar con Pb para evaluar GVF
  Pd (discharge)→ verificar TDH real vs. diseño
  T_motor       → aplicar Arrhenius si supera clase
  T_cable       → corregir resistencia (ver M4)`,
    variables: [
      { sym: 'Ps', unit: 'psi', desc: 'Pump intake pressure — comparar con Pb (si Ps < Pb → gas libre)' },
      { sym: 'Pd', unit: 'psi', desc: 'Pump discharge pressure — verificar TDH real' },
      { sym: 'T_BH', unit: '°C', desc: 'Temperatura de fondo — base para Arrhenius y corrección de cable' },
    ],
    regla: 'Ps < Pb → gas libre en succión (→ M3). T_motor > T_rated → Arrhenius activo (→ M4).',
    tipo_regla: 'warning',
    ejemplo_resuelto: {
      contexto: "Tenemos Pb=1200 psi. Sensor en succión marca Ps=1000 psi. El caudal ha caído 10%.",
      pasos: [
        "Paso 1: Evaluar la presión de succión vs el punto de burbujeo: Ps (1000) < Pb (1200).",
        "Paso 2: Diagnóstico térmico/presión: Al romper la Pb, hay gas libre formándose desde el Intake.",
        "Paso 3: Diagnóstico operativo: Ese gas interfiere con el bombeo de la etapa limitando el caudal en 10%.",
        "Conclusión: Confirmado inicio de degradación por gas multifásico y requerimiento de reducir velocidad o instalar AGS."
      ]
    }
  },

  {
    id: 'vibracion',
    title: '③ Vibración — Umbrales y diagnóstico',
    concepto: 'Los sensores de vibración piezoeléctricos miden velocidad radial/axial en mm/s RMS. Cada patrón de frecuencia corresponde a un mecanismo de falla específico.',
    formula:
`ZONAS ISO 10816-3 / API RP 11S5:
  Zona A: < 4.0 mm/s RMS  → Normal. Nueva instalación.
  Zona B: 4.0–6.3 mm/s    → Alerta temprana. Investigar.
  Zona C: > 6.3 mm/s      → Paro recomendado.

PATRONES → CAUSA:
  1× f_rot (60 Hz)    → Desbalanceo (masa excéntrica, sólidos)
  4–6× f_rot (BPFO)   → Defecto de rodamiento — falla inminente
  Broadband aleatorio  → Cavitación / surging / GVF > 15%`,
    variables: [
      { sym: 'RMS',  unit: 'mm/s', desc: 'Root Mean Square — valor cuadrático medio de la señal' },
      { sym: 'BPFO', unit: 'Hz',   desc: 'Ball Pass Frequency Outer race — frecuencia de falla de rodamiento' },
      { sym: 'f_rot',unit: 'Hz',   desc: 'Frecuencia de rotación del motor (2-polo: ≈ 60 Hz a 60 Hz VSD)' },
    ],
    regla: 'Impactos periódicos a 4–6× f_rot = rodamiento defectuoso. Planificar extracción urgente.',
    tipo_regla: 'danger',
    ejemplo_resuelto: {
      contexto: "El sensor de fondo marca una vibración sostenida de 5.2 mm/s RMS en el eje radial Y con frecuencia principal 1x f_rot.",
      pasos: [
        "Paso 1: Comparar con la norma ISO/API (Zona B = 4.0 a 6.3 mm/s).",
        "Paso 2: Como 5.2 está en la Zona B, el sistema está en ALERTA, pero no manda a TRIPE (paro > 6.3).",
        "Paso 3: Observamos el espectro: muestra repetición a 1x f_rot.",
        "Paso 4: Diagnóstico inicial: Desbalanceo probable de las etapas (masa excéntrica por sólidos o desgaste asimétrico)."
      ]
    }
  },

  {
    id: 'correlacion',
    title: '④ Correlación Sensores → Diagnóstico',
    concepto: 'La combinación de carta amperimérica + vibración + DPTS reduce la incertidumbre diagnóstica de ~60% a menos del 10%. Ningún sensor por sí solo es suficiente para un diagnóstico confiable.',
    formula:
`Corriente baja + Vibración alta + Ps < 0.5×Pb
  → Gas libre en bomba. Instalar separador.

Corriente oscilante + Vibración broadband
  → Surging / cavitación. Ajustar punto de operación.

Corriente alta + T_motor elevada + Vibración normal
  → Sobrecarga térmica. Verificar viscosidad y back-pressure.

Corriente baja + Impactos de alta frecuencia
  → Subcarga + falla de rodamiento. Extracción urgente.

Caída súbita de corriente a < 20%
  → Gas lock. PARAR inmediatamente.`,
    variables: null,
    regla: 'Combinar al menos 2 fuentes de datos antes de tomar decisión operativa. Un solo sensor engaña.',
    tipo_regla: 'ok',
    ejemplo_resuelto: {
      contexto: "El operador ve una Baja de Corriente (<70%) pero no está seguro si es bomba vacía (fluido liviano) o Gas Lock.",
      pasos: [
        "Paso 1: Verificar el DPTS para cruzar datos.",
        "Paso 2: Si el DPTS indica Ps=2000 psi (>> Pb de 1200), entonces no hay gas.",
        "Paso 3: Al no haber gas, la baja corriente debe provenir de rotura de eje (subcarga total) o desgaste masivo del impulsor que no está desplazando fluido.",
        "Conclusión: La correlación descarta M3 (Gas) y dirige la investigación hacia falla mecánica catastrófica."
      ]
    }
  },

  {
    id: 'glosario',
    title: '⑤ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'DPTS',    def: 'Downhole Pressure & Temperature Sensor — sensor P y T en fondo' },
      { term: 'Carta A.', def: 'Carta amperimérica — registro de corriente vs. tiempo' },
      { term: 'Surging', def: 'Oscilación de caudal y corriente por operación fuera del BEP' },
      { term: 'Gas Lock',def: 'Pérdida total de succión — la bomba gira en gas sin producir' },
      { term: 'Subcarga',def: 'Corriente < 70% nominal — posible gas, baja densidad o eje roto' },
      { term: 'RMS',     def: 'Root Mean Square — valor cuadrático medio de la vibración' },
      { term: 'BPFO',    def: 'Ball Pass Frequency Outer race — frecuencia de defecto de rodamiento' },
      { term: 'Zona A/B/C', def: 'Clasificación ISO de severidad de vibración (A=normal, C=paro)' },
      { term: 'Broadband',  def: 'Espectro frecuencial amplio — señal característica de cavitación' },
    ],
  },
];
