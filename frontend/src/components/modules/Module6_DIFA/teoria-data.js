/**
 * SIMBES — M6: DIFA — Diagnóstico de Fallas BES
 * Datos de la pestaña Teoría para TheoryLayout.
 * Fuentes: API RP 11S1 | Práctica RCA de la industria
 */

export const TEORIA_M6 = [
  {
    id: 'difa',
    title: '① ¿Qué es el DIFA?',
    concepto: 'DIFA — Downhole Investigation and Failure Analysis. Proceso sistemático para identificar la causa raíz de fallas en equipos BES/ESP extraídos. Combina el historial operativo, la inspección física (teardown) y la codificación API RP 11S1. Su objetivo no es solo reparar — es prevenir la reincidencia.',
    formula:
`DIFA = Historial operativo (cartas amperimétricas, alarmas)
     + Inspección visual (teardown del equipo extraído)
     + Codificación API RP 11S1
     + Análisis de causa raíz (RCA)
     + Plan de prevención`,
    variables: null,
    regla: 'Sin DIFA, el equipo vuelve al pozo con el mismo problema.',
    tipo_regla: 'danger',
    ejemplo_resuelto: {
      contexto: "Un motor falla (quemado al aterrizarse a masa) a los 3 meses. El operador simplemente reemplaza el equipo sin desarmar.",
      pasos: [
        "Paso 1: Al no aplicar DIFA, no se averigua por qué se quemó dicho motor (ej. el sello dejó pasar agua porque se operaba a 160°C con sellos NBR de 120°C).",
        "Paso 2: Se compra y baja un repuesto idéntico con sello NBR de 120°C.",
        "Paso 3: El nuevo equipo volverá a fallar inexorablemente a los 3 meses porque la causa raíz (alta temperatura que destruye el elastómero secundario) sigue en pie.",
        "Conclusión: El RCA documentado detiene fallas en serie."
      ]
    }
  },

  {
    id: 'api',
    title: '② Codificación API RP 11S1',
    concepto: 'El estándar API RP 11S1 define un lenguaje común para clasificar los daños encontrados en el teardown. Permite comparar tendencias entre pozos, campañas y años dentro de un campo.',
    formula:
`Código: XYYY
  X   = categoría del sistema afectado
  YYY = tipo específico de daño

3700 — Corrosión / Picadura
  3712: Desgaste por recirculación
  3720: Incrustación de escala
  3730: Ataque por H₂S o CO₂

4900 — Sello primario / invasión de fluido
  4910: Gas lock → sobrecalentamiento del motor
  4930: Falla de elastómero → invasión

5400 — Sellos secundarios / daño mecánico
  5410: Surging (operación fuera de BEP)
  5430: Falla de rodamiento

5900 — Cable / sistema eléctrico
  5910: Caída de voltaje excesiva
  5930: Corrosión de cable por H₂S`,
    variables: null,
    regla: 'Un campo con 50+ equipos instalados puede identificar patrones estadísticos con solo 12 meses de teardown codificado.',
    tipo_regla: 'indigo',
    ejemplo_resuelto: {
      contexto: "Se observó que en el campo 'X' el 80% de los teardowns arrojaron el código 3730.",
      pasos: [
        "Paso 1: Entender el código: Serie 3700 = Corrosión. Especial 3730 = Ataque por Gases Acidos.",
        "Paso 2: Como el 80% de pozos sufren esto, debe haber una base general compartida: H2S no mitigado o materiales estándar inadecuados en toda la flota.",
        "Paso 3: Se cambia la especificación global de acero común a aleaciones especializadas para todos los futuros pozos, resolviendo en masa el problema top 1."
      ]
    }
  },

  {
    id: 'arbol',
    title: '③ Árbol de diagnóstico',
    concepto: 'El árbol de diagnóstico conecta síntomas observables con causas probables y sus códigos API. El objetivo es identificar el primer daño: todos los demás suelen ser consecuencias.',
    formula:
`SÍNTOMA                     → CAUSA              → CÓDIGO
Corriente < 60% nominal     → Gas en bomba        → 4910
                              Eje roto             → 5430
Corriente > 120% nominal    → Escala              → 3720
                              Alta viscosidad      → evaluar HI
Corriente oscilante         → Surging (sobre BEP) → 5410
                              Gas lock intermit.   → 4910
IR < 1 MΩ                  → Degradación T°      → 4930
                              Ataque H₂S          → 5930
Vibración alta + impactos   → Falla de rodamiento → 5430
Caudal reducido + I alta    → Incrustación escala → 3720`,
    variables: [
      { sym: 'IR',   unit: 'MΩ', desc: 'Insulation Resistance — resistencia de aislamiento del motor' },
      { sym: 'BPFO', unit: 'Hz', desc: 'Ball Pass Frequency Outer race — frecuencia de falla de rodamiento' },
    ],
    regla: 'Buscar siempre el PRIMER daño. Todos los demás suelen ser consecuencias en cadena.',
    tipo_regla: 'ok',
    ejemplo_resuelto: {
      contexto: "Un equipo falla y se observa: Corriente baja + IR cae a cero en caliente. El Teardown presenta elastómero reventado.",
      pasos: [
        "Paso 1: Clasificar síntomas: Invasión de fluido al motor por el sello (Código 4930).",
        "Paso 2: Verificar el historial: reportaba repetidamente T > 180°C, sobrepasando límite de O-rings estandar (ej. NBR).",
        "Paso 3: Causa Raíz Probable: Sobrecalentamiento recurrente que degradó agresivamente los elastómeros permitiendo paso de fluido.",
        "Paso 4: Prevención sugerida: Implementar O-rings de EPDM o PEEK y ajustar protección térmico-operativa."
      ]
    }
  },

  {
    id: 'teardown',
    title: '④ El Teardown Report',
    concepto: 'El Teardown Report es el documento central del DIFA. Se elabora al desarmar el equipo extraído en el taller. Un buen teardown convierte cada falla en conocimiento institucional permanente.',
    formula:
`Estructura mínima:
1. Datos del equipo (serial, modelo, fecha instalación)
2. Historial operativo (carta amperimérica, alarmas)
3. Inspección por componente:
     Bomba  → impulsores, difusores, eje, cojinetes
     Sello  → elastómero, cámara de aceite, laberinto
     Motor  → bobinas, aislamiento, cojinetes de empuje
     Cable  → aislamiento, conectores, boca
4. Fotografías de cada daño observado
5. Código API RP 11S1 por cada daño
6. Conclusión: causa raíz + código principal
7. Recomendaciones de prevención`,
    variables: null,
    regla: 'Sin fotografías, el teardown no es auditable. Las fotos son la evidencia forense de la falla.',
    tipo_regla: 'warning',
  },

  {
    id: 'prevencion',
    title: '⑤ Prevención — Cierre del ciclo',
    concepto: 'El DIFA solo tiene valor si cierra el ciclo: Falla → Análisis → Prevención → Cero Reincidencia. Las acciones de prevención se agrupan por familia de código API.',
    formula:
`3700 — Corrosión:
  → Tratamiento químico (inhibidor, biocida)
  → Materiales NACE MR0175

4900 — Sello / invasión:
  → Diseño térmico + elastómero correcto
  → Monitoreo de IR mensual

5400 — Mecánico / Surging:
  → Operar siempre 80–110% del BEP
  → Vibración como monitoreo continuo

5900 — Eléctrico / Cable:
  → Verificar V_drop < 5% antes de instalar
  → Lead Sheath en pozos amargos
  → Medición de IR anual`,
    variables: null,
    regla: 'Cada acción de prevención debe quedar documentada y con responsable asignado. Sin cierre formal, la falla se repite.',
    tipo_regla: 'ok',
    ejemplo_resuelto: {
      contexto: "Falla eléctrica detectada: Código 5930 (Corrosión por H2S en cable).",
      pasos: [
        "Paso 1: El teardown muestra el aislamiento del cable cristalizado y negro por ataque de sulfuro de hidrógeno, generando falla cruzada.",
        "Paso 2: Prevención M6: Se estipula usar 'Lead Sheath' (cable envuelto con funda protectora de plomo impenetrable a gases) al reacondicionar el pozo.",
        "Paso 3: Se agenda a ingeniería asignar diseño con NACE al próximo cable a cotizar.",
        "Conclusión: Prevención técnica ejecutada que cerrará la persistencia de fallas 5930."
      ]
    }
  },

  {
    id: 'glosario',
    title: '⑥ Glosario del Módulo',
    concepto: null,
    formula: null,
    variables: null,
    glosario: [
      { term: 'DIFA',    def: 'Downhole Investigation and Failure Analysis' },
      { term: 'API RP 11S1', def: 'Recommended Practice for ESP Teardown Report' },
      { term: 'Teardown', def: 'Desmontaje e inspección del equipo extraído del pozo' },
      { term: 'RCA',     def: 'Root Cause Analysis — análisis de causa raíz' },
      { term: 'IR',      def: 'Insulation Resistance — resistencia de aislamiento (MΩ)' },
      { term: 'NBR',     def: 'Nitrilo — elastómero para T° < 120°C sin H₂S' },
      { term: 'EPDM',    def: 'Etileno-propileno — elastómero hasta 177°C' },
      { term: 'PEEK',    def: 'Poliéteretercetona — plástico de ingeniería hasta 250°C' },
      { term: 'Monel 400', def: 'Aleación Ni-Cu resistente a H₂S' },
      { term: 'Lead Sheath', def: 'Funda de plomo en cable — protección contra H₂S' },
      { term: 'Surging', def: 'Operación sobre el BEP con recirculación en descarga' },
      { term: 'Gas Lock', def: 'Pérdida total de succión por gas en la bomba' },
    ],
  },
];
