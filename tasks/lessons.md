# SIMBES — Lecciones Aprendidas

## Regla general
Después de cada corrección del usuario: registrar el patrón aquí para no repetirlo.

---

## L01 — Leer archivos antes de editar
**Error**: Intenté usar Edit en App.jsx sin haberlo leído primero → "file not read" error.
**Regla**: SIEMPRE usar Read antes de Edit. Sin excepción. Si no sé si lo leí, leerlo de nuevo.

## L02 — Verificar unidades con el usuario antes de implementar
**Error**: Interpreté "litros/kg" como L/kg (volumen específico) cuando el usuario quería kg/L (densidad).
**Regla**: Cuando una unidad parece inusual o podría interpretarse de dos formas, confirmar con el usuario ANTES de implementar. Mostrar ejemplo: "¿0.876 kg/L para crudo liviano? ¿o 1.14 L/kg?"

## L03 — Seguir PARTE 1 de CLAUDE.md antes de implementar
**Error**: Empecé a crear archivos sin escribir primero el plan en tasks/todo.md.
**Regla**: Para cualquier tarea con 3+ pasos: escribir plan en tasks/todo.md → mostrar al usuario → esperar "si" → implementar.

## L04 — No confundir extensiones de importación en Vite
**Observación**: Vite resuelve .jsx automáticamente. Importar `from '../../ui/ComingSoon'` (sin extensión) funciona.
**Regla**: En proyectos Vite, las extensiones en imports son opcionales para .js y .jsx.

## L05 — El frontend es completamente independiente del backend
**Confirmado**: Frontend usa physics/\*.js para todos los cálculos. Backend FastAPI no es llamado por el frontend.
**Regla**: No modificar el backend pensando que afecta el frontend. Son capas independientes.

## L07 — Actualizar README y tasks/ al cierre de cada sprint
**Error**: Al completar la Fase 1 de mejoras, no se actualizaron README.md, tasks/todo.md (sección revisión) ni tasks/lessons.md sin que el usuario lo señalara explícitamente.
**Regla**: Al terminar cualquier sprint o conjunto de tareas: (1) actualizar README con cambios visibles al usuario, (2) agregar sección "Revisión" en todo.md, (3) registrar lecciones nuevas en lessons.md. Esto es parte de la definición de "tarea terminada" según CLAUDE.md §4 y §Gestión de tareas punto 5-6.

## L06 — Generar notebook al completar cada módulo (regla permanente)
**Instrucción del usuario**: Cada vez que se finalice un módulo completo, generar su notebook Jupyter en `notebooks/`.
**Regla**: Al marcar un módulo como ✅ completado, la siguiente tarea inmediata es crear `notebooks/0N_nombre.ipynb` con: fórmulas en markdown + motor Python + ejemplos numéricos + gráficas matplotlib. Esto aplica a M1 (pendiente), M2, M3, M4, M5, M6, M7, M8.
