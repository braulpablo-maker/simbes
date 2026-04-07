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

----------------------------------------------------------

# SIMBES — Plan de Mejoras y Correcciones

> **Propósito:** Documento de trabajo para iterar sobre la plataforma SIMBES.  
> **Origen:** Evaluación funcional completa realizada el 04/04/2026 con prueba de todos los módulos (M01–M09) y el Modo Desafíos.  
> **Audiencia objetivo:** Ingeniero junior de petróleo en proceso de autocapacitación.

---

## ÍNDICE

1. [Bugs Críticos (Bloquean uso)](#1-bugs-críticos)
2. [Bugs de Inconsistencia de Diseño](#2-bugs-de-inconsistencia-de-diseño)
3. [Bugs de Contenido / Datos Incorrectos](#3-bugs-de-contenido--datos-incorrectos)
4. [Problemas de UX / Experiencia de Usuario](#4-problemas-de-ux--experiencia-de-usuario)
5. [Deficiencias Pedagógicas](#5-deficiencias-pedagógicas)
6. [Gaps de Contenido](#6-gaps-de-contenido)
7. [Mejoras Funcionales Deseables](#7-mejoras-funcionales-deseables)
8. [Plan de Trabajo Priorizado](#8-plan-de-trabajo-priorizado)

---

## 1. BUGS CRÍTICOS

Estos errores bloquean o degradan gravemente la experiencia. Deben corregirse antes de compartir la plataforma con usuarios.

---

### BUG-001 — Pantalla negra al hacer scroll (todos los módulos) 🔍 Investigado — No reproducible en entorno local (desktop). Posible issue de producción/mobile.

**Severidad:** 🔴 Crítica  
**Módulos afectados:** Todos (Hub, M01–M09, Modo Desafíos)  
**Reproducción:** Usar la rueda del mouse o trackpad para hacer scroll hacia abajo en cualquier página de la app.  
**Síntoma:** La mitad superior (o totalidad) de la pantalla queda completamente negra. El navbar con `← anterior / siguiente →` se desplaza al fondo del viewport en lugar de permanecer fijo.  
**Causa probable:** Conflicto en `position: sticky` o `overflow: hidden` aplicado al contenedor principal. Posiblemente el wrapper del módulo tiene `overflow: hidden` que corta el contenido al hacer scroll. Puede ser un problema con `transform` CSS que rompe el stacking context del `position: fixed`.  
**Workaround actual:** Presionar la tecla `Home` o ejecutar `window.scrollTo(0, 0)` devuelve la vista. No es aceptable para usuarios finales.  
**Impacto:** Un usuario casual que haga scroll asumirá que la página está rota y abandonará.  
**Fix sugerido:** Revisar el CSS del contenedor raíz de cada módulo. Eliminar cualquier `overflow: hidden` de elementos ancestros del navbar. Verificar que el navbar use `position: fixed` con `z-index` adecuado sin un ancestro con `transform` activo.

---

### BUG-002 — Botón "Entrar →" del Hub no responde al click directo 🔍 Investigado — Funciona correctamente en entorno local.

**Severidad:** 🔴 Crítica  
**Módulos afectados:** Hub (página principal)  
**Reproducción:** Hacer scroll en el Hub hasta ver M02, M03, etc. y hacer click en "Entrar →".  
**Síntoma:** El click no navega al módulo. El botón parece registrar el click (feedback visual) pero no ejecuta la acción.  
**Causa probable:** El mismo problema de scroll/overflow. El elemento clickeable queda "detrás" de una capa invisible que captura los eventos de pointer.  
**Fix sugerido:** Corregir BUG-001. Una vez que el layout de scroll esté correcto, los clicks deberían funcionar. Verificar que no haya un overlay transparente con `pointer-events: auto` cubriendo los botones al scrollear.

---

### BUG-003 — Validación en M09 PASO 0 sin feedback visual ✅ Implementado (Sprint 1 — 04/04/2026)

**Severidad:** 🔴 Crítica  
**Módulos afectados:** M09 (Flujo de Diseño BES), PASO 0  
**Reproducción:** Hacer click en "VALIDAR DATOS" en el PASO 0.  
**Síntoma:** El sistema valida internamente pero no muestra ningún indicador de éxito, error, ni campos con problemas en el área visible. El usuario no sabe si pasó la validación. El botón "CONTINUAR" aparece al final del scroll (que activa BUG-001).  
**Fix sugerido:** Mostrar un toast/alert no intrusivo en la parte superior de la pantalla indicando "✅ Datos válidos — Continuá al Paso 1" o listando los campos con error. No depender del scroll para ver el feedback.

---

### BUG-004 — El M09 no permite saltar pasos desde el stepper ✅ Implementado (Sprint 1 — 04/04/2026)

**Severidad:** 🟠 Alta  
**Módulos afectados:** M09  
**Reproducción:** Estando en PASO 1, hacer click en "PASO 2 IPR" en la barra del stepper.  
**Síntoma:** El stepper no navega al paso clickeado. Los pasos futuros no son accesibles directamente.  
**Nota:** El diseño intencional puede ser secuencial, pero si es así, los botones futuros deberían estar visualmente deshabilitados (con `cursor: not-allowed` y opacidad reducida) para comunicar que no son clickeables. Actualmente parecen interactivos pero no hacen nada.  
**Fix sugerido:** O bien habilitar la navegación libre entre pasos ya completados, o bien deshabilitar visualmente los pasos no alcanzados con un estado claro.

---

## 2. BUGS DE INCONSISTENCIA DE DISEÑO

Estos problemas no bloquean el uso pero generan confusión y transmiten falta de calidad.

---

### BUG-005 — Diseño visual inconsistente entre módulos 🔄 Parcial — M03 unificado con patrón M1/M4 (tabs underline, colores legibles). Falta ModuleLayout global.

**Severidad:** 🟠 Alta  
**Detalle:** Cada módulo fue desarrollado con un estilo diferente. Las diferencias observadas son:

| Elemento | M01 | M02–M03 | M04–M07 | M08 | M09 |
|---|---|---|---|---|---|
| Pestañas | `A · Teoría` (con `·`) | `A. Teoría` (con `.`) | `A — Teoría` (con `—`) | `A — Diseño Integrado` | Sin pestañas A–D |
| Botón volver al Hub | En navbar fijo global | En navbar fijo global | Botón separado `← Hub` en el módulo | Botón separado `← Hub` | En navbar fijo global |
| Indicador módulo | Badge pequeño `SIMBES · M1` | Badge `M2` prominente | Badge `M04` + `✅ Disponible` | Igual que M04 | Estilo propio |
| Estilo color tema | Cyan/azul | Verde | Magenta / Naranja / Rojo / Violeta | Cyan | Multicolor |

**Impacto:** Un junior que pase de M01 a M02 puede pensar que llegó a otro sitio. Rompe la cohesión de la plataforma.  
**Fix sugerido:** Crear un componente de layout de módulo unificado (`ModuleLayout`) con las pestañas, el header y la navegación estandarizados. Aplicar a todos los módulos. Mantener los colores de acento por módulo (cada uno tiene su color de tema) pero unificar la estructura.

---

### BUG-006 — Inconsistencia de unidades entre módulos y pestañas 🔄 Parcial — GOR y Temperatura ya convertidos a SI en M3/M8 (Sprint D previo). Falta auditoría completa M08 Comparación.

**Severidad:** 🟠 Alta  
**Detalle:**
- M01 Simulador: IP en `m³/d/psi`, Q en `m³/d` (sistema SI-campo).
- M03 Teoría: bloque de código usa `scf/STB` y `ft³/STB` para el GOR (sistema inglés).
- M08 C·Comparación: IP muestra `STB/D/PSI`, GOR en `SCF/STB` (inglés).
- M08 B·Constructor: IP en `m³/d/psi` (SI-campo).
- Footer del Hub dice: *"Unidades UI: m³/d · m · psi · Hz · °C"* — pero esto no se respeta en todos lados.

**Impacto:** Un junior puede introducir valores incorrectos al mezclar sistemas. Puede calcular mal el GOR si cree que está en m³/m³ cuando el bloque de código usa scf/STB.  
**Fix sugerido:** Estandarizar todas las unidades de entrada/salida a SI-campo (m³/d, psi, m, °C, m³/m³). Si se quiere ofrecer sistema inglés, agregar un toggle global de unidades que convierta todo de forma consistente.

---

### BUG-007 — Nomenclatura de pestañas inconsistente en M08 ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** M08 tiene 5 pestañas (A–E), mientras que todos los demás módulos tienen 4 (A–D: Teoría, Simulador, Caso Práctico, Evaluación). La pestaña E "Modo Plan · Arps" no tiene equivalente en los otros módulos y no está documentada en el Hub.  
**Fix sugerido:** Documentar en la tarjeta del Hub que M08 incluye análisis de decline (Arps). Considerar si "Modo Plan · Arps" debería ser un módulo separado (M08b) o si queda bien dentro de M08.

---

### BUG-008 — Contador de desafíos incorrecto en el Hub ✅ Implementado (Sprint 1 — 04/04/2026)

**Severidad:** 🟡 Media  
**Detalle:** La tarjeta del Modo Desafíos en el Hub dice "4 escenarios". Al ingresar, hay 10 desafíos disponibles.  
**Fix sugerido:** Actualizar el texto de la tarjeta a "10 escenarios · Aprendizaje Basado en Problemas".

---

## 3. BUGS DE CONTENIDO / DATOS INCORRECTOS

---

### BUG-009 — Fórmula mal presentada en M03 (Q_líquido) ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Módulo:** M03 — A. Teoría, sección GVF  
**Detalle:** El bloque de código muestra:
```
Q_líquido = 5.615 ft³/STB
```
Esto es incorrecto semánticamente. `5.615 ft³/STB` es el factor de conversión de volumen, no el caudal de líquido. La línea debería ser:
1 STB = 5.615 ft³   [factor de conversión]

o bien eliminarla y expresar el cálculo en m³ directamente.  
**Fix sugerido:** Corregir la fórmula o eliminar la línea ambigua. Expresar todo en m³/d para mantener coherencia con el resto de la UI.

---

### BUG-010 — M08 C·Comparación no alerta sobre V_DROP crítico ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Módulo:** M08 — B. Constructor  
**Detalle:** Con los parámetros por defecto del Constructor, la caída de voltaje `V_DROP CABLE` muestra **39.55%**, que es casi 8 veces el límite recomendado (< 5%) y cuatro veces el límite máximo aceptable (< 10%). El dato aparece en un chip de color gris neutral, sin ninguna alerta visual (rojo, ⚠️) que indique que es un valor crítico fuera de norma.  
**Fix sugerido:** Aplicar lógica de semáforo a los KPI cards: verde si OK, amarillo si advertencia, rojo si crítico. El V_DROP > 10% debe mostrar estado CRÍTICO con fondo rojo.

---

### BUG-011 — Caso Práctico M01 no lleva a conclusión de rediseño ⏳ Pendiente

**Severidad:** 🟡 Media  
**Módulo:** M01 — C. Caso Práctico  
**Detalle:** Los 3 pasos del caso (60 Hz, 55 Hz, 65 Hz) muestran al pozo Colibrí-3 operando siempre en surging (141%, 137%, 144% del BEP). El caso no guía al usuario a la conclusión natural: la bomba está sobredimensionada y debe reemplazarse. No hay un "Paso 4" ni una conclusión que cierre el ciclo de diagnóstico → acción correctiva.  
**Fix sugerido:** Agregar un Paso 4 de conclusión con texto: "El pozo requiere una bomba con BEP más alto (≥420 m³/d). Acceder a M02 para calcular el nuevo TDH e ir al M09 para seleccionar una bomba diferente."

---

## 4. PROBLEMAS DE UX / EXPERIENCIA DE USUARIO

---

### UX-001 — Respuestas del Caso Práctico expuestas de forma prematura ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Módulos afectados:** M01 (y posiblemente M02–M07)  
**Detalle:** En la pestaña C·Caso Práctico, el diagnóstico automático ("Operando al 141% del BEP → surging. Reduce frecuencia o abre choke.") es visible inmediatamente al cargar el paso, antes de que el usuario haya tenido oportunidad de razonarlo. La "Pregunta Guiada" y la "Pista" están presentes pero la respuesta las supera visualmente.  
**Fix sugerido:** Colocar el diagnóstico detrás de un botón `[Ver diagnóstico]` o `[Revelar análisis]` que el usuario active explícitamente. Esto preserva el proceso de pensamiento crítico que es el objetivo del Aprendizaje Basado en Problemas.

---

### UX-002 — No hay indicador de progreso global del usuario ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Detalle:** El Hub muestra la barra de evaluación solo para M01 (porque fue el único evaluado). No hay un indicador de progreso global que muestre cuántos módulos ha completado el usuario, cuántos desafíos ha resuelto, ni una vista de "mi camino de aprendizaje".  
**Fix sugerido:** Agregar en el Hub un panel de progreso global: "X/9 módulos completados · Y/10 desafíos resueltos". Mostrar barra de evaluación en todas las tarjetas (no solo en los módulos completados).

---

### UX-003 — No hay instrucciones de uso al entrar por primera vez ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Detalle:** Un usuario que llega por primera vez a SIMBES ve directamente el Mapa de Módulos sin ninguna orientación sobre cómo usar la plataforma, en qué orden hacer los módulos, o qué nivel previo de conocimiento se asume.  
**Fix sugerido:** Agregar una pantalla o sección de bienvenida (puede ser colapsable/ocultable) con: (1) descripción del sistema de 4 pestañas A–D, (2) ruta sugerida de aprendizaje (M01→M09 o por área temática), (3) prerrequisitos mínimos de conocimiento, (4) cómo usar el Modo Desafíos.

---

### UX-004 — El signo de pregunta `?` en los sliders no tiene tooltip visible ⏳ Pendiente

**Severidad:** 🟡 Media  
**Módulos afectados:** M01 Simulador (y probablemente todos)  
**Detalle:** Los sliders del simulador tienen un ícono `?` junto al nombre del parámetro. Al hacer click o hover no se ve ningún tooltip con la descripción. Puede ser un bug de implementación o que el tooltip no es visible en el viewport actual.  
**Fix sugerido:** Verificar que el tooltip esté correctamente implementado y sea visible. El tooltip debería mostrar: definición del parámetro, unidad, rango típico de campo, y efecto en el sistema.

---

### UX-005 — Los sliders del Simulador no tienen campo de entrada numérica directa ⏳ Pendiente

**Severidad:** 🟡 Media  
**Módulos afectados:** M01, M02 Simuladores  
**Detalle:** Los parámetros solo se pueden cambiar arrastrando el slider. No hay una caja de texto donde escribir el valor exacto. Para un ingeniero que quiere simular un valor específico (ej: Pr = 3247 psi), el slider es impreciso.  
**Fix sugerido:** Agregar un campo numérico editable junto al valor del slider (que ya muestra el número en color). Al editar el número directamente, el slider debe moverse al valor correspondiente.

---

### UX-006 — No hay botón de "Resetear a valores por defecto" en los simuladores ⏳ Pendiente

**Severidad:** 🟡 Media  
**Módulos afectados:** M01, M02, M03 (probablemente todos)  
**Detalle:** Una vez que el usuario modifica los sliders, no hay forma fácil de volver a los valores originales sin recargar la página.  
**Fix sugerido:** Agregar un botón `↺ Restablecer` o `↺ Valores por defecto` en la sección de parámetros del simulador.

---

### UX-007 — La navegación anterior/siguiente en el header no deja claro el módulo destino ✅ Implementado (Sprint 1 — 04/04/2026)

**Severidad:** 🟡 Media  
**Detalle:** Los botones `← anterior` y `siguiente →` en el header permiten navegar entre módulos. Sin embargo, no indican a dónde llevan (no dicen "← M01 · Análisis Nodal" sino solo "← anterior"). Un usuario desorientado no sabe qué módulo viene.  
**Fix sugerido:** Mostrar el nombre del módulo adyacente: `← M01 · Análisis Nodal` | `M03 · Gas y Multifásico →`.

---

### UX-008 — El Modo Desafíos muestra 0/10 resueltos aunque se resuelvan ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Al entrar al Modo Desafíos, el contador siempre muestra "0/10 resueltos" y "Progreso general 0%", incluso si el usuario ya marcó desafíos como resueltos en sesiones anteriores. El estado de los desafíos no persiste.  
**Fix sugerido:** Guardar el estado de cada desafío en `localStorage` (igual que el progreso de evaluaciones de módulos). Leer el estado al cargar el Modo Desafíos y mostrarlo correctamente.

---

### UX-009 — El "Marcar como resuelto" en los desafíos no da feedback ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Al hacer click en "✓ Marcar como resuelto" en un desafío, no hay ninguna confirmación visual de que la acción se registró (sin toast, sin cambio de color, sin contador actualizado).  
**Fix sugerido:** Al marcar como resuelto: cambiar el estado del botón a "✓ Resuelto" con estilo deshabilitado, mostrar un mensaje "¡Desafío completado! +1 en tu progreso", y actualizar el contador del Modo Desafíos.

---

### UX-010 — Falta enlace directo al módulo relevante desde cada desafío ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Los desafíos dicen "Abre el M2 · Diseño Hidráulico en el Hub para resolver este desafío" pero no hay un hipervínculo. El usuario debe volver manualmente al Hub y encontrar el módulo.  
**Fix sugerido:** Reemplazar el texto por un botón `→ Ir al M02 · Diseño Hidráulico` que navegue directamente al módulo correcto (y de preferencia a la pestaña B·Simulador).

---

### UX-011 — La pestaña C·Caso Práctico no recuerda el paso seleccionado ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Al cambiar de pestaña (ej: ir a B·Simulador y volver a C·Caso Práctico), el caso vuelve siempre al Paso 1, perdiendo el progreso del usuario dentro del caso.  
**Fix sugerido:** Guardar el paso activo del Caso Práctico en el estado del componente o en `sessionStorage` para que no se reinicie al cambiar de pestaña.

---

### UX-012 — No hay modo oscuro/claro ni ajuste de contraste 🟢 Diferido (V2+)

**Severidad:** 🟢 Baja  
**Detalle:** La plataforma solo tiene tema oscuro. En ambientes bien iluminados (oficinas con luz natural intensa) el fondo muy oscuro puede ser difícil de leer en pantallas con poco brillo.  
**Fix sugerido:** No es urgente dado que el tema oscuro es apropiado para ingeniería. Considerar para versiones futuras.

---

### UX-013 — No hay versión mobile-friendly 🟢 Diferido (V2+)

**Severidad:** 🟠 Alta  
**Detalle:** El layout de columna dual (parámetros a la izquierda, gráfica a la derecha) no es responsive. En pantallas menores a 768px (tablets, móviles) el contenido se superpone o queda cortado.  
**Fix sugerido:** Implementar un breakpoint responsivo. En mobile, apilar los paneles verticalmente: primero los controles, luego la gráfica. Los sliders son usables en touch. Las gráficas deben ser redimensionables.

---

## 5. DEFICIENCIAS PEDAGÓGICAS

---

### PED-001 — La teoría no tiene ejercicios resueltos paso a paso ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Módulos afectados:** Todos (M01–M07)  
**Detalle:** Los acordeones de la pestaña A·Teoría muestran la fórmula y una tabla de símbolos, pero no hay un ejemplo numérico resuelto con valores de campo reales. Un junior sin base previa no tiene cómo verificar si entendió la fórmula antes de ir al simulador.  
**Fix sugerido:** Agregar en cada acordeón teórico un bloque colapsable "📐 Ejemplo resuelto" con valores numéricos concretos y el procedimiento paso a paso. Por ejemplo en M01: "Con Pr=3500 psi, Pb=1800 psi, IP=0.24 m³/d/psi, calcular Q a Pwf=1500 psi".

---

### PED-002 — No hay referencias bibliográficas específicas ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Los textos teóricos mencionan autores ("Joe Mach 1979", "Vogel", "Colebrook-White") pero no hay citas formales con libro, edición y página. Un junior que quiera profundizar no sabe a dónde ir.  
**Fix sugerido:** Agregar al final de cada módulo una sección "📚 Referencias" con la bibliografía mínima: autor, título, año, capítulo relevante. Ejemplos: Economides et al. "Petroleum Production Systems"; Lea et al. "ESP Handbook"; API RP 11S1.

---

### PED-003 — El glosario está disponible pero no está interconectado ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Cada módulo tiene un acordeón "⑥ Glosario del Módulo" (observado en M01). Los términos técnicos en los textos no están linkeados al glosario. Si un junior no conoce "GVF" o "BEP", debe saber que existe el glosario y buscarlo manualmente.  
**Fix sugerido:** Subrayar o resaltar los términos técnicos en los textos y hacer que al hacer hover o click muestren el tooltip con la definición del glosario. Alternativamente, agregar un glosario global accesible desde el Hub.

---

### PED-004 — No hay indicación del nivel de dificultad o prerrequisitos por módulo ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Las tarjetas del Hub no indican si M07 (Confiabilidad/MTBF con distribución exponencial y Chi²) requiere conocimientos previos de estadística, o si M04 (THD, IEEE 519) requiere base de electrotecnia. Un junior puede frustrarse al entrar a un módulo fuera de su nivel.  
**Fix sugerido:** Agregar en cada tarjeta del Hub: nivel de dificultad (⭐/⭐⭐/⭐⭐⭐) y prerrequisitos sugeridos (ej: "Requiere M01 y M02"). Opcional: bloquear módulos avanzados hasta completar los prerrequisitos.

---

### PED-005 — Las evaluaciones no se pueden reintentar con preguntas diferentes ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** El botón "↺ Reintentar" en la evaluación repite exactamente las mismas 5 preguntas en el mismo orden. Un usuario que memorice las respuestas puede obtener 100/100 sin aprender.  
**Fix sugerido:** Implementar un banco de preguntas con al menos 10–15 por módulo y selección aleatoria de 5 en cada intento. Aleatorizar también el orden de las opciones de respuesta.

---

### PED-006 — No hay feedback sobre por qué una respuesta incorrecta es incorrecta (solo explica la correcta) ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** En la evaluación M01, al responder incorrectamente, el sistema muestra la explicación de la respuesta correcta pero no dice por qué la opción elegida por el usuario es incorrecta. Para una opción que parece plausible (ej: "Fetkovich siempre se usa en pozos BES"), un junior puede quedarse con la duda de por qué no aplica.  
**Fix sugerido:** Para cada opción incorrecta, agregar una breve explicación del error conceptual. Formato: "❌ Incorrecto: Fetkovich describe el comportamiento turbulento en la región de flujo radial del yacimiento, pero no es el modelo estándar para BES..."

---

### PED-007 — El Modo Desafíos no guía al usuario sobre cómo resolver el problema ✅ Implementado (Sprint O, 2026-04-07)

**Severidad:** 🟡 Media  
**Detalle:** Los desafíos tienen la narrativa y el objetivo, pero el usuario queda solo frente al simulador sin una guía de qué parámetros ajustar primero. Un junior puede no saber por dónde empezar.  
**Fix sugerido:** Agregar en cada desafío una sección expandible "🗺️ Guía de resolución" con los pasos sugeridos (sin dar la respuesta). Ejemplo: "1. Ve al M2 · Simulador. 2. Ingresa Q=180 m³/d y profundidad=3200m. 3. Observa el TDH calculado. 4. Divide por H_etapa para obtener el número de etapas."

---

## 6. GAPS DE CONTENIDO

---

### GAP-001 — Modo Desafíos sin cobertura de M05, M06 y M07 ⏳ Pendiente

**Severidad:** 🟠 Alta  
**Detalle:** Los 10 desafíos actuales cubren M1 (4 desafíos), M2 (2), M3 (2) y M4 (2). Los módulos M05 (Sensores y Monitoreo), M06 (Diagnóstico DIFA) y M07 (Confiabilidad/MTBF) no tienen ningún desafío asociado. Son áreas críticas para un ingeniero de campo.  
**Desafíos sugeridos para M05:**
- "Carta Amperiométrica — Pozo Tucán-4": corriente oscilante ±20% → identificar surging vs. gas lock.
- "Vibración Anormal — Pozo Ibis-7": vibración 5.8 mm/s RMS → determinar causa y set point de alarma.

**Desafíos sugeridos para M06:**
- "DIFA Código 4900 — Pozo Garza-2": rodamientos fundidos por sobrecalentamiento → árbol de causas.
- "Reincidencia de Falla — Campo Norte": mismo código de falla 3 veces en 6 meses → plan de prevención.

**Desafíos sugeridos para M07:**
- "MTBF insuficiente — Pozo Colibrí-8": datos de 12 bombas con diferentes tiempos de falla → calcular MTBF y R(1 año).
- "Sesgo de Sobrevivencia — Campo Sur": equipo en operación sin fallas → ajustar estimación con datos censurados.

---

### GAP-002 — No hay módulo de seguridad y procedimientos operativos 🟢 Diferido (V2+)

**Severidad:** 🟡 Media  
**Detalle:** Los módulos cubren bien la física del sistema, pero no hay contenido sobre procedimientos de arranque/parada de un BES, permisos de trabajo, bloqueo LOTO, ni protocolos de emergencia (falla de comunicación downhole, pérdida de producción súbita). Estos procedimientos son esenciales para un junior que va a operar en campo.  
**Fix sugerido:** Agregar un módulo M10 "Operación Segura" (opcional, básico) con los procedimientos estándar de arranque/parada y los procedimientos de respuesta ante alarmas críticas.

---

### GAP-003 — No hay contenido sobre selección de proveedor / catálogo real 🟢 Diferido (V2+)

**Severidad:** 🟡 Media  
**Detalle:** El M09 calcula el número de etapas y el TDH requerido, pero no hay ninguna guía sobre cómo eso se traduce a la selección de un modelo real de bomba (Baker Hughes Centrilift, SLB REDA, ESP Inc., etc.). Un junior termina el wizard sabiendo que necesita "196 etapas" pero no sabe cómo buscar en un catálogo.  
**Fix sugerido:** Agregar en M09 PASO 4 (TDH/Bomba) una nota sobre cómo usar catálogos de proveedores. No es necesario incluir catálogos reales (copyright), pero sí explicar los parámetros a buscar: rango de caudal de la curva H-Q, tamaño de casing requerido, diámetro de bomba.

---

### GAP-004 — No hay contenido sobre análisis de decline (Arps) integrado con el diseño ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** M08 tiene una pestaña "E — Modo Plan · Arps" que no está documentada en el Hub ni mencionada en los otros módulos. El decline de producción es fundamental para dimensionar correctamente un BES a lo largo de la vida útil del pozo, no solo al momento del diseño.  
**Fix sugerido:** Documentar esta funcionalidad en la tarjeta del Hub. Agregar en M09 PASO 10 (Económico) una conexión explícita con el análisis de decline de M08.

---

### GAP-005 — No hay guía de interpretación de la curva H-Q ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Los módulos muestran curvas H-Q pero no hay contenido que explique cómo leer un datasheet de bomba real: cómo identificar el BEP en la curva, el rango operativo permitido (68%–132%), la curva de potencia, la curva de eficiencia, y cómo degradar la curva por gas/viscosidad.  
**Fix sugerido:** Agregar en M02 una sección en A·Teoría sobre "Lectura de curvas H-Q de bomba BES" con un ejemplo de curva de datasheet real (puede ser ficticia) y sus puntos de referencia.

---

### GAP-006 — No hay conexión entre el diagnóstico DIFA (M06) y el diseño mejorado (M09) ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** El flujo natural después de un DIFA es rediseñar el sistema para eliminar la causa de falla. Sin embargo, M06 no tiene ningún enlace ni mención a M09 como paso siguiente. Los módulos están desconectados temáticamente.  
**Fix sugerido:** Al final del Caso Práctico de M06, agregar una llamada a la acción: "Si la falla requiere rediseño del sistema, continúa con M09 · Flujo de Diseño BES para seleccionar el equipo correcto."

---

## 7. MEJORAS FUNCIONALES DESEABLES

Funciones nuevas que agregarían valor significativo sin cambiar la arquitectura.

---

### MEJ-001 — Exportación de resultados a PDF (M08 lo menciona pero no implementa claramente) ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** La descripción del M08 en el Hub dice "Exportación de resultados a PDF". No fue posible verificar si funciona en todos los módulos. Debería exportar: parámetros de entrada, KPIs calculados, gráficas, y el Caso Práctico activo.  
**Fix sugerido:** Verificar implementación en M08. Extender a M09 (la Hoja de Selección BES del PASO 11 debería ser exportable a PDF como documento formal).

---

### MEJ-002 — Unidades duales (SI-campo y sistema inglés) 🟢 Diferido (V2+)

**Severidad:** 🟡 Media  
**Detalle:** Ver BUG-006. Agregar un toggle global en el header "m³/d · STB/d" que convierta todos los valores en tiempo real.

---

### MEJ-003 — Historial de simulaciones del usuario 🟢 Diferido (V2+)

**Severidad:** 🟡 Media  
**Detalle:** No hay forma de guardar escenarios intermedios mientras el usuario experimenta con el simulador de un módulo. El botón "Guardar/Cargar" solo existe en M08 y M09.  
**Fix sugerido:** Agregar "Guardar escenario" en M01–M07 también, guardando en `localStorage`. Permitir nombrar los escenarios (ej: "Caso alto GOR", "Caso temperatura extrema").

---

### MEJ-004 — Tooltips en las gráficas (hover interactivo) ⏳ Pendiente

**Severidad:** 🟡 Media  
**Detalle:** Las gráficas muestran el punto de operación con coordenadas, pero no permiten al usuario explorar otros puntos de la curva haciendo hover. En M01, el usuario no puede ver cuál sería el Pwf si el Q fuera 400 m³/d.  
**Fix sugerido:** Implementar tooltips interactivos en todas las gráficas que muestren los valores de los ejes al hacer hover sobre la curva.

---

### MEJ-005 — Animación del punto de operación al cambiar parámetros 🟢 Diferido (V2+)

**Severidad:** 🟢 Baja  
**Detalle:** El punto de operación (círculo rosado en la gráfica de M01) salta instantáneamente cuando se mueve un slider. Una transición suave de 200–300ms haría más fácil entender la dirección del cambio.  
**Fix sugerido:** Agregar `transition: all 0.2s ease` en el elemento SVG/canvas del punto de operación.

---

### MEJ-006 — Modo de práctica con valores aleatorios en los desafíos 🟢 Diferido (V2+)

**Severidad:** 🟢 Baja  
**Detalle:** Cada desafío tiene parámetros fijos. Un usuario que lo resuelva una vez puede memorizarlo.  
**Fix sugerido:** Agregar una opción "Modo aleatorio" que varíe los parámetros del pozo dentro de rangos realistas, generando instancias infinitas del mismo tipo de problema.

---

## 8. PLAN DE TRABAJO PRIORIZADO

### Criterio de prioridad
- 🔴 **P0 — Bloqueante:** Corregir antes de cualquier uso real de la plataforma.
- 🟠 **P1 — Alto impacto:** Afecta significativamente la experiencia de aprendizaje.
- 🟡 **P2 — Mejora:** Suma valor pero la plataforma funciona sin ellas.
- 🟢 **P3 — Nice to have:** Para versiones futuras.

---

### SPRINT 1 — Estabilización (correcciones críticas)
> Objetivo: Que la plataforma funcione sin bugs que la rompan.

| ID | Tarea | Esfuerzo estimado | Prioridad | Estado |
|---|---|---|---|---|
| BUG-001 | Corregir bug de pantalla negra al hacer scroll | Alto | 🔴 P0 | 🔍 No reproducible en dev |
| BUG-002 | Corregir botones "Entrar →" del Hub que no responden | Bajo (depende de BUG-001) | 🔴 P0 | 🔍 Funciona en dev |
| BUG-003 | Agregar feedback visual en validación M09 PASO 0 | Bajo | 🔴 P0 | ✅ Implementado |
| BUG-004 | Deshabilitar visualmente pasos futuros en el stepper de M09 | Bajo | 🟠 P1 | ✅ Implementado |
| BUG-008 | Corregir contador "4 escenarios" → "10 escenarios" en Hub | Muy bajo | 🟠 P1 | ✅ Implementado |
| BUG-010 | Agregar semáforo de colores a KPI cards de M08 (V_DROP crítico) | Bajo | 🟠 P1 | ✅ Implementado |

---

### Sprint H — Fixes de Sprint 1 + M03 visual (04/04/2026)

**BUG-003 — Feedback validación M09 PASO 0** ✅ Implementado
- Banner de feedback (verde ✅ / rojo ❌) visible al top de la página tras click en "VALIDAR DATOS"
- Scroll automático al inicio para garantizar visibilidad del banner
- Archivo: `Module9_BESDesign/steps/Step0_DataEntry.jsx`

**BUG-004 — Stepper M09 pasos futuros** ✅ Implementado
- Pasos no alcanzados: opacidad 0.4, borde dashed, icono 🔒, tooltip "Completá los pasos anteriores"
- Archivo: `Module9_BESDesign/index.jsx`

**BUG-008 — Contador desafíos Hub** ✅ Implementado
- "4 escenarios" → "10 escenarios" en tarjeta del Modo Desafíos
- Archivo: `Hub.jsx`

**UX-007 — Navegación con nombres de módulo** ✅ Implementado
- Botones "← anterior / siguiente →" ahora muestran nombre del módulo destino
- Ejemplo: `← M2 · Diseño Hidráulico` | `M4 · Eléctrico · VSD →`
- Archivo: `App.jsx`

**BUG-005 (parcial) — M03 tabs y colores unificados** ✅ Implementado
- Reemplazados todos los `color: '#000'` por texto legible (purple sobre fondo semitransparente)
- Header y tabs unificados al patrón underline de M1/M4 (antes usaba botones sólidos)
- Afecta: separadores de gas, botones caso práctico, botón "Calificar", badge M3
- Archivo: `Module3_Gas/index.jsx`

**BUG-010 — Semáforo de colores en KPI cards M08** ✅ Implementado (Sprint H finalizado — 05/04/2026)
- `KPI` component: background semi-transparente (`color + "15"`) y border más visible (`color + "55"`) cuando `color === C.danger` o `color === C.warn`
- Texto sub en color de alerta (no muted) en estados crítico/advertencia
- V_drop KPI: añadido sub con texto contextual: "⚠️ CRÍTICO — límite: 10%" / "▲ ADVERTENCIA — límite: 5%" / "✓ dentro del límite"
- La mejora aplica automáticamente a todos los KPI del dashboard (GVF, f_H, Q efectivo, Vida aislamiento, R(1 año), R(2 años))
- Archivo: `Module8_Builder/index.jsx`

### Sprint I — Bugs de contenido + Pedagogía M01 (05/04/2026)

**BUG-009 — Fórmula Q_líquido M03 corregida** ✅ Implementado
- Eliminada la línea `Q_líquido = 5.615 ft³/STB` que era semánticamente incorrecta (eso es un factor de conversión, no un caudal)
- Reemplazada por `1 STB = 0.158987 m³` con aclaración explícita de que es factor de conversión
- Actualizada la fórmula `Q_gas` para mostrar `Q_gas = Q_líquido × GOR_libre × Bg` (forma más clara)
- Unidades de GOR y Bg corregidas a SI (m³/m³) en tabla de variables
- Archivo: `Module3_Gas/teoria-data.js`

**BUG-006 — Unidades inglesas en M08 C·Comparación** ✅ Implementado
- `SCENARIOS` migrado a unidades SI: IP en m³/d/psi (0.318, 0.238), GOR en m³/m³ (14, 142), T_F en °C (71, 99)
- `TabComparacion`: agregada función `toPhysics()` que convierte SI → motor antes de llamar a `computeSystem`
- `ScenarioEditor`: labels actualizados (`IP (m³/d/psi)`, `GOR (m³/m³)`), rangos ajustados (IP: 0.05–1.59, GOR: 0–356)
- Archivo: `Module8_Builder/index.jsx`

**UX-001 — Diagnóstico del Caso Práctico detrás de botón** ✅ Implementado
- Pasos 1–3: el panel de alertas/diagnóstico queda oculto por defecto; aparece solo al clickear "▶ Revelar análisis"
- El estado `showDiagnosis` se resetea al cambiar de paso (cada paso requiere que el usuario razone primero)
- Archivo: `Module1_IPR/SIMBES_Modulo1.jsx`

**BUG-011 — Paso 4 de conclusión en M01 Caso Práctico** ✅ Implementado
- Nuevo `CASO_STEPS[3]` con flag `isConclusionStep: true`
- Diagnóstico: la bomba tiene BEP ~420 m³/d, el pozo entrega ~514 m³/d → siempre en surging. Cambiar frecuencia no resuelve la causa raíz.
- Acción correctiva: reemplazar bomba + referencia a M02 (TDH) y M09 (selección BES)
- Conclusión también oculta detrás de "▶ Revelar conclusión" (consistente con UX-001)
- Layout especial para Paso 4: sin gráfica nodal, dos cards (diagnóstico rojo + acción verde)
- Archivo: `Module1_IPR/SIMBES_Modulo1.jsx`

---

### Sprint J — UX Modo Desafíos + Persistencia tab C·Caso (05/04/2026)

**UX-008 — Persistencia localStorage del Modo Desafíos** ✅ Verificado (ya implementado)
- El estado `completed` se inicializa desde `localStorage.getItem('simbes_challenges')` al montar el componente
- `markSolved()` persiste en `localStorage.setItem('simbes_challenges', ...)` en cada marca
- Bug ya estaba corregido en el código base actual — no requirió cambios

**UX-009 — Feedback visual al marcar desafío como resuelto** ✅ Implementado
- Agregado estado `justSolved` en `DirectedChallengeView`
- Al clickear "✓ Marcar como resuelto": aparece banner verde con "🎉 ¡Desafío completado! +1 en tu progreso" y aviso de guardado
- El botón queda reemplazado por "Ver explicación" una vez marcado
- Archivo: `components/challenges/ModuleChallenges.jsx`

**UX-010 — Botón de navegación directa al módulo desde desafío** ✅ Implementado
- Agregado map `MODULE_ID_MAP` ({ M2→'m2', M3→'m3', M4→'m4', M5→'m5', M6→'m6', M7→'m7' })
- `DirectedChallengeView` ahora recibe prop `onNavigate` y muestra botón "→ Ir al M2 · Diseño Hidráulico"
- `ModuleChallenges` recibe `onNavigate` y la pasa hacia abajo; `App.jsx` pasa `setActiveModule`
- Archivos: `components/challenges/ModuleChallenges.jsx`, `App.jsx`

**UX-011 — Tab C·Caso Práctico mantiene el paso activo al cambiar de pestaña** ✅ Implementado
- Levantado el estado `casoStep`/`casoShowDiag` desde `TabCaso` al componente padre `SIMBES_M1`
- `TabCaso` recibe `{ step, showDiagnosis, goToStep, setShowDiagnosis }` como props
- Al cambiar de pestaña y volver, paso activo y estado de diagnóstico se conservan
- Archivo: `Module1_IPR/SIMBES_Modulo1.jsx`

---

### Sprint K — Controles de Simulador: input numérico + reset (05/04/2026)

**UX-004 — Tooltip `?` en sliders** ✅ Verificado (ya funciona)
- El componente `Slider` en `ui/index.jsx` ya implementa `onMouseEnter/onMouseLeave` con estado `showTip`
- Tooltip visible correctamente al hacer hover — no requirió cambios

**UX-005 — Campo numérico editable en sliders** ✅ Implementado
- `Slider` en `ui/index.jsx`: el valor se muestra como `<input type="text" inputMode="decimal">`
- Borde transparente cuando inactivo; borde de acento al enfocar
- Blur o Enter: clampea a [min, max] y llama `onChange`. Escape cancela sin aplicar
- Cuando se usa prop `format`, mantiene display de texto (no hay input editable)
- Aplica a todos los módulos que usan el `Slider` compartido (M01–M07)
- Archivo: `components/ui/index.jsx`

**UX-006 — Botón ↺ Restablecer en simuladores** ✅ Implementado
- **M01**: `SIM_DEFAULTS` + `resetSim()` en `SIMBES_M1`; botón en panel de controles
- **M02**: `M2_DEFAULTS` + `resetSim()` local en `TabSimulador`; botón en header de controles
- **M03**: `M3_DEFAULTS` + `resetSim()` local en `TabSimulador`; botón en header de controles
- Archivos: `Module1_IPR/SIMBES_Modulo1.jsx`, `Module2_Hydraulics/index.jsx`, `Module3_Gas/index.jsx`

---

### Sprint L — Pantalla de bienvenida en Hub (05/04/2026)

**UX-003 — Panel de bienvenida con guía de inicio rápido** ✅ Implementado
- Componente `WelcomePanel` añadido en `Hub.jsx`, renderizado entre el header y la grilla de módulos
- Se muestra por defecto en la primera visita; se oculta permanentemente con "× No mostrar de nuevo" (guarda en `localStorage.setItem('simbes_welcome_dismissed', 'true')`)
- Estado inicializado desde localStorage — la preferencia persiste entre sesiones
- Contenido en 2 columnas:
  - **Izquierda**: estructura de 4 pestañas por módulo (A·Teoría, B·Simulador, C·Caso Práctico, D·Evaluación) + descripción del Modo Desafíos
  - **Derecha**: 4 rutas de aprendizaje sugeridas (Completa, Diseño BES, Gas y Fluidos, Diagnóstico) + 3 prerrequisitos mínimos de conocimiento
- Diseño en tonos `#0D1E33` / `#1E3A5F` para diferenciarse visualmente de las tarjetas de módulo
- Archivo: `components/Hub.jsx`

---

### Sprint M — Progreso global + dificultad + M08 doc (05/04/2026)

**UX-002 — Indicador de progreso global en Hub** ✅ Implementado
- Componente `ProgressGlobal` añadido entre el panel de bienvenida y la grilla de módulos
- Tres métricas en cards horizontales: "Módulos evaluados (X/9)", "Desafíos resueltos (Y/10)", "Progreso general (Z%)"
- Cada card tiene barra de progreso animada (transition 0.5s)
- Lee `simbes_eval_m{id}` (passed=true) de localStorage para módulos; `simbes_challenges` para desafíos
- Colores: módulos=verde, desafíos=cyan, global=violeta
- Archivo: `components/Hub.jsx`

**PED-004 — Dificultad y prerrequisitos en tarjetas de módulo** ✅ Implementado
- Agregados campos `difficulty` (1/2/3) y `prereqs` (array) a cada entrada en `MODULES`
- `ModuleCard` muestra badge de dificultad (⭐ Básico / ⭐⭐ Intermedio / ⭐⭐⭐ Avanzado) + texto "Requiere: M01, M02..."
- Colores por nivel: verde (básico), naranja (intermedio), rojo (avanzado)
- M07 indica "Requiere: Estadística básica" (prerequisito no-modular)
- Archivo: `components/Hub.jsx`

**BUG-007 — Pestaña E de M08 documentada en Hub** ✅ Implementado
- Subtitle de M08 actualizado: "Integración completa · Modo libre · Decline Arps"
- Topics de M08: agregado "E · Modo Plan · Arps — análisis de decline de producción"
- Badge de M08 actualizado: "✅ Disponible · 5 pestañas (A–E)"
- Archivo: `components/Hub.jsx`

---

### Sprint N — Banco de preguntas ampliado + sampling aleatorio (05/04/2026)

**PED-005 — Banco de preguntas aleatorio en evaluaciones M01–M08** ✅ Implementado

- Banco expandido de 5 → 10 preguntas en cada módulo (M01–M08): 40 preguntas nuevas en total
- Cada evaluación muestra 5 preguntas seleccionadas aleatoriamente del banco de 10 (Fisher-Yates shuffle)
- El sampleo ocurre al montar el componente (`useState(() => sampleQuestions(5))`): las preguntas no cambian durante una sesión, pero cada nuevo intento puede mostrar una combinación diferente
- Función `sampleQuestions(n=5)` exportada desde cada archivo de evaluación (`m1.js`–`m8.js`)
- M1: `sampleQuestions()` recibe el pool desde `M1_EVALUATION.questions`; `gradeM1(answers, questions)` acepta subconjunto opcional
- M2–M8: `gradeM{n}(answers)` usa `answers.length` como total (no más `M{n}_QUESTIONS.length` hardcodeado)
- Todos los componentes de módulo actualizados: import de `sampleQuestions`, `useState` lazy init, referencias al array local `questions` en lugar de la constante global
- Nuevas preguntas cubren temas adicionales no representados en las originales:
  - M01: modelo Vogel completo, modelo compuesto, leyes de afinidad Q/H, zona BEP, skin/estimulación
  - M02: velocidad en tubing, gradiente de presión, efecto rugosidad, potencia hidráulica, dimensionamiento etapas
  - M03: gas libre Ps<Pb, cálculo GVF con separador, viscosidad HI, diferencia AGS/GHS, temperatura vs viscosidad
  - M04: potencia aparente/FP, Arrhenius invertido (T<límite), filtro pasivo vs IEEE 519, escala AWG, NACE sin umbral mínimo
  - M05: overload sostenido, tendencia T-motor, zonas de vibración A/B/C, tendencia Ps vs Pb, diagnóstico multi-parámetro
  - M06: tendencia de IR descendente, falla por fatiga de rodamiento código 5430, patea/overload, Pareto de fallas, árbol DIFA gas lock
  - M07: R(t) para disponibilidad objetivo, mediana vs MTBF, MLE con censurados, sesgo de sobrevivencia, percentil B10
  - M08: decline exponencial Arps, comparación económica MTBF vs Q, acción preventiva KPI, decline hiperbólico, parámetros de decisión
- Archivos: `pedagogy/evaluations/m{1-8}.js`, módulos `Module{1-8}_*/index.jsx` (y `SIMBES_Modulo1.jsx`)

### Sprint O — Guías de resolución PBL + fix evaluaciones (07/04/2026)

**PED-007 — Guías de resolución en Modo Desafíos** ✅ Implementado

- Agregado campo `resolution_guide` (array de 3 strings) a los 16 desafíos en `challenges.json`
- Cada guía tiene 3 pasos: (1) configuración de parámetros, (2) observación/análisis, (3) acción correctiva
- UI expandible "🗺️ Guía de resolución (sin spoilers)" en `DirectedChallengeView` y `ChallengeSimulator`
- Botón toggle con estilo consistente (color del desafío), pasos numerados con badge circular
- Archivos: `data/challenges.json`, `components/challenges/ModuleChallenges.jsx`

**Fix — `res.explanation` bug en 6 módulos de evaluación** ✅ Corregido

- M2, M3, M4, M5, M6, M8 tenían `.explanation` y `.incorrect_feedback` sin prefijo `res.` → error de build
- Corregido a `res.explanation` y `res.incorrect_feedback` en los 6 módulos
- Archivos: `Module{2,3,4,5,6,8}_*/index.jsx`
