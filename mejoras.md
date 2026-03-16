# Mejoras.md - SIMBES

> Este archivo es utilizado para mejorar la app
> Consta de dos partes, parte 1 Mejoras propuestas y Parte dos Repuestas a las nmejoras propuestas, esta segunda parte se debe dejar registro de que ocurrio con la mejora propuestas, se implemento o se descarto.

## Parte 1 - Mejora propuesta

### Todos los modulos
1. Cuando se usa el scroll conviene dejar fijo los 4 tab A, B, C, D para una mejor navegación entre Tabs, mejora la experiencia de usuario.
2. Cuando se navega por los modulos en la parte superior dice: SIMBES / M1 · Análisis Nodal, etc ese texto debería estar en negritas y un tamaño de 130%.
3. Se menciona en algunos casos la palabra cabeza, por ejemplo en teoria modulo 2, "TDH es la cabeza total" en estos casos cabeza hace referencia a altura, evaluar cada caso de la app y reemplazar. Numerar en la parte 2 cuantas veces se menciona "cabeza"y cuantas se reemplaron.
4. Para pasar de un modulo a otro hay que pasar siempre por el HUB, permitir paras de un modulo al siguiente o anterior, con dos botone sobre el margen superios derecho.
5. GOR, expresar en m3/m3
6. Temperatura en grados Celsius


### Modulo 1
1. Revisar ecuación de VLP en la teoria
2. En teroia explicar que es BEP y porque es importante
3. Explicar mejor el concepto de VLP (Vertical Lift Perftormance)
4. Leyes de afinidad: explicar con mas detalle
5. Caso practico: el caudal del texto "La producción del campo objetivo es 45 m³/d" es correcto? Confirmar o modificar.
en la pregunta guiada del paso 3 nuevamente se menciona el caudal de 45 "A 65 Hz, ¿se alcanza el objetivo de 45 m³/d? ¿Hay riesgo de surging?" Ese caudal es correcto?

### Modulo 2
1. La teoria menciona tres geometrías de impulsor. Agregar un grafico con los tres tipos de curvas como ejemplo para que se entienda mejor las caracteristicas.
2. El grafico en el simulador tiene el formato de los numeros del eje X con decimal, redondear.
3. El grafico del caso practico tiene el formato de los numeros del eje X con decimal, redondear.

### Mdulo 3
1. El grafico en el simulador tiene el formato de los numeros del eje X con decimal, redondear.
2. en el Tab simulador donde se representa ▌ GVF wellbore: 
▌ GVF bomba: el texto tiene poco contraste con el fondo, cambiar a color gris claro o blanco.
3. en el tab caso practico idem punto 2. de este modulo.



## Parte 2 - Respuesta a las mejoras propuestas

### Sprint A — Fixes visuales globales (2026-03-15)

**Global.1 — Tabs A/B/C/D sticky al scroll** ✅ Implementado
- M1: `position: sticky, top: 0, zIndex: 100` en TabBar
- M2/M3: sticky en el header div que contiene título + tabs
- M4/M5/M6/M7/M8: sticky en el div de tabs con background para tapar contenido al scrollear

**Global.2 — Breadcrumb en negritas y 130%** ✅ Implementado
- M1: h1 `fontSize: 20 → 26`
- M2/M3: título `fontSize: 18 → 24`, `fontWeight: 700 → 800`
- M4/M5/M6/M7/M8: título `fontSize: 16 → 21`

**M3.2 / M3.3 — Contraste texto GVF wellbore / GVF bomba** ✅ Implementado
- GVFGauge: añadido `color: '#CBD5E1'` al contenedor. Aplica a Tab Simulador y Caso Práctico.

### Sprint B — Fixes de gráficas (2026-03-15)

**M2.2 — Eje X simulador M2 sin decimales** ✅ Implementado — `tickFormatter={v => Math.round(v)}`

**M2.3 — Eje X caso práctico M2 sin decimales** ✅ Implementado — `tickFormatter={v => Math.round(v)}`

**M3.1 — Eje X simulador M3 sin decimales** ✅ Implementado — `tickFormatter={v => Math.round(v)}` en ambas XAxis (simulador y caso práctico)

### Sprint C — Navegación entre módulos (2026-03-15)

**Global.4 — Botones ← anterior / siguiente → en cada módulo** ✅ Implementado
- App.jsx: NavBar extendida con botones "← anterior" y "siguiente →" en el margen derecho
- El botón se deshabilita (opacidad 0.3) cuando no hay módulo anterior/siguiente
- Los módulos M4–M8 ahora reciben `onBack` como prop (antes no funcionaba el botón interno ← Hub)
- Tabs sticky ajustados a `top: 40px` para aparecer justo debajo de la NavBar sin superposición

### Sprint D — Unidades métricas GOR y Temperatura (2026-03-15)

**Global.5 — GOR expresado en m³/m³** ✅ Implementado en M3 y M8
- M3: estado `GOR` pasa de scf/STB a m³/m³. Rango slider: 0–89 m³/m³. Default: 27 m³/m³ (~150 scf/STB). Conversión en useMemo antes de llamar a física: `GOR_scf = GOR * 5.6146`
- M8: `DEFAULT.GOR: 250 → 45` m³/m³. Rango slider: 0–356 m³/m³. Conversión en useMemo: `GOR: p.GOR * 5.6146`
- Factor de conversión: 1 m³/m³ = 5.6146 scf/STB
- Métrica "GOR libre" en M3 también convertida a m³/m³

**Global.6 — Temperatura en grados Celsius** ✅ Implementado en M3 y M8
- M3: estado `T_F` pasa de °F a °C. Rango: 27–121°C. Default: 82°C (~180°F). Conversión en useMemo: `T_F_phys = T_F * 9/5 + 32`
- M8: `DEFAULT.T_F: 185 → 85` °C. Rango slider: 49–138°C. Conversión en useMemo: `T_F: p.T_F * 9/5 + 32`
- Motor de física no fue modificado; la conversión ocurre en la capa UI (useMemo)

### Sprint E — Mejoras teoría Módulo 1 + corrección caso práctico (2026-03-15)

**M1.1 — Ecuación VLP revisada y mejorada** ✅ Implementado
- Sección 3 de teoría reescrita: se explica físicamente cada término de `Pwf = Pwh + grad·prof − H_bomba + H_fricción`
- Añadida nota sobre forma de curva VLP (forma de U: cae con Q hasta que fricción domina)
- Tabla de términos con descripción operativa de cada componente

**M1.2 — BEP explicado** ✅ Implementado
- Añadido banner dedicado al BEP en sección 4 (Leyes de Afinidad): definición, importancia, consecuencias de operar fuera del BEP
- Explicación de por qué el BEP escala linealmente con frecuencia

**M1.3 — VLP concept mejorado** ✅ Implementado (como parte de M1.1)
- Reescrita la sección completa con foco en interpretación operativa

**M1.4 — Leyes de Afinidad con mayor detalle** ✅ Implementado
- Añadido ejemplo numérico completo: 60 Hz → 50 Hz con valores calculados de Q, H y potencia
- Reemplazado "Impacto operativo" genérico por tabla de zonas con rangos explícitos: <68% BEP (recirculación), 68-132% (óptima), >132% (surging)
- Ley cúbica de potencia explicada en contexto de ahorro energético

**M1.5 — Corrección caudal objetivo caso práctico** ✅ Implementado
- El pozo Colibrí-3 con IP=0.30 m³/d/psi opera a ~464 m³/d a 60 Hz. El objetivo de 45 m³/d era incorrecto (error de orden de magnitud)
- Cambiado "45 m³/d" → "450 m³/d" en Paso 1 y Paso 3
- Contexto Paso 1 actualizado: "alarmas de vibración frecuentes" (coherente con operar al ~139% del BEP → surging)
- Pregunta Paso 3 actualizada: "¿el riesgo de surging aumenta o disminuye respecto a 60 Hz?" (a 65 Hz: ~514 m³/d → 142% BEP → sí, aumenta)

### Sprint F — Gráfico de curvas H-Q por tipo de impulsor en M2 (2026-03-15)

**M2.1 — Gráfico comparativo de 3 geometrías de impulsor** ✅ Implementado
- Añadido chart Recharts en la sección "④ Velocidad Específica (Ns)" de la teoría de M2
- Curvas normalizadas H/H₀ vs Q/Qmax usando leyes de potencia:
  - Radial (n=1.0): curva empinada — a Q=50% conserva sólo el 50% de la altura
  - Flujo Mixto (n=1.85): curva moderada — a Q=50% conserva el 72%
  - Axial (n=3.5): curva plana — a Q=50% conserva el 91%
- Colores: Radial=#38BDF8, Flujo Mixto=#34D399, Axial=#FBBF24
- Cada tarjeta de tipo de impulsor ampliada con descripción operativa del comportamiento de la curva
- Anotación textual debajo del gráfico explicando la implicación práctica de cada curva

### Sprint G — Reemplazo global "cabeza" → "altura" (2026-03-15)

**Global.3 — "cabeza" → "altura" en toda la app** ✅ Implementado

Total encontrado: 46 menciones de "cabeza/cabezal" en el código fuente.
- **Reemplazadas: 38** instancias (cabeza hidráulica = head/altura)
- **Conservadas: 8** instancias (terminología de wellhead = cabezal de pozo, correctas)

Archivos modificados y cantidad de reemplazos:
- `physics/gas.js`: 2 (JSDoc CH, H_bep)
- `physics/hydraulics.js`: 7 (JSDoc y comentarios inline)
- `pedagogy/evaluations/m1.js`: 2 (opciones y explicaciones)
- `pedagogy/evaluations/m2.js`: 4 (opciones y explicaciones)
- `pedagogy/evaluations/m3.js`: 6 (opciones y explicaciones)
- `pedagogy/evaluations/m8.js`: 1 (opción de evaluación)
- `Module1_IPR/SIMBES_Modulo1.jsx`: 1 (glosario TDH)
- `Module2_Hydraulics/index.jsx`: 8 (teoría, glosario, sliders, eje Y del gráfico, tooltip)
- `Module3_Gas/index.jsx`: 4 (teoría, glosario f_H, alerta, tooltip slider)
- `Module8_Builder/index.jsx`: 2 (descripción M2 en teoría)

Conservadas (wellhead — nomenclatura de pozo correcta):
- "Presión de cabezal" / "Presión Cabezal" / "cabezal" = Pwh (wellhead pressure)
- "cabeza del pozo" / "cabeza de pozo" = wellhead (ubicación física)




