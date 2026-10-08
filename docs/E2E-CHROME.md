# Recorrido E2E en Chrome — 7 de octubre de 2026

Se probó la UI real en Chrome contra el backend local y PostgreSQL dedicados a pruebas. El generador y almacenamiento de objetos del harness son sintéticos: no se hicieron llamadas a OpenRouter ni se evaluó la precisión médica. No se modificó College OS.

## Hallazgos corregidos y comprobados

| Problema | Cambio | Evidencia del recorrido |
| --- | --- | --- |
| Al recargar se perdía un formulario incompleto, porque se validaba como una solicitud terminada. | Restauración de borradores incompletos; el envío conserva la validación estricta. | Tema y origen «Ambos» sobreviven a recargar sin documento seleccionado. |
| Un tema con espacios devolvía un error técnico; superar diez preguntas deshabilitaba la acción sin explicar el problema. | Mensajes en español y foco en el campo correspondiente. | Tema vacío, documento requerido y total de 25 preguntas reciben mensajes accionables. |
| Cargar un archivo cambiaba «Ambos» a «Mi documento». | La carga respeta el origen combinado. | Tras cargar TXT, «Ambos» permanece seleccionado. |
| Un conflicto entre pestañas podía perder el borrador fallido; descartar restauraba una versión antigua en memoria. | Se conserva el borrador al fallar el guardado; descartar consulta la última versión del servidor. | Dos pestañas: B guarda, A recibe 409, A conserva sus cambios al volver y después recupera la versión de B al descartar. |
| Una petición sin respuesta podía dejar la pantalla esperando indefinidamente. | Límite de 30 segundos, errores comprensibles y botón de reintento en las vistas de consulta. | Backend local suspendido temporalmente: aparece el error; al reanudarlo, «Volver a intentar» recupera el banco. |
| Un título de 200 caracteres sin espacios desbordaba la pantalla móvil. | Ajuste de palabras largas en el contenido principal. | A 390 px de ancho, el documento pasó de 3985 px a 390 px de ancho total. |

También se añadieron guardas para archivos vacíos/extensión incorrecta, límite de búsqueda de 200 caracteres, aviso si falla el almacenamiento del formulario, cancelación de consultas al abandonar la vista, prevención de consultas periódicas solapadas y bloqueo de respuestas mientras se envía una prueba.

## Matriz del recorrido ejecutado

Todos los siguientes escenarios se verificaron desde Chrome, con datos ficticios:

| Escenario | Resultado observado |
| --- | --- |
| Cargar TXT válido | Texto extraído y documento seleccionable. |
| Cargar archivo vacío | Rechazo con explicación. |
| Cargar archivo mayor de 5 MB | Rechazo por tamaño. |
| Cargar PDF corrupto | Error de extracción; generación bloqueada. |
| Cargar TXT con contenido insuficiente | Error de contenido; generación bloqueada. |
| Generar serie de un caso y dos preguntas | Solicitud completada y conjunto disponible. |
| Generar una pregunta independiente con cinco opciones | Un caso, una pregunta y opciones A–E. |
| Editar título, guardar y recargar | Versión guardada recuperada. |
| Exportar JSON después de editar | Archivo descargado e inspeccionado: título, revisión 2, un caso, dos preguntas y una fuente. |
| Abrir prueba sin contestar | Clave oculta y finalización deshabilitada. |
| Contestar parcialmente y recargar | Se conserva una respuesta de dos. |
| Finalizar con una respuesta correcta y una incorrecta | Calificación de 1/2, persistente al recargar. |
| Registrar nota de revisión demasiado corta | Acción deshabilitada. |
| Registrar nota de revisión suficiente | Revisión registrada. |
| Regenerar conjunto | Nuevo conjunto y enlace a la versión anterior; original conservado. |
| Borrador incompleto, validación y origen combinado | Ver comprobaciones de los hallazgos corregidos. |
| Guardar desde dos pestañas | Conflicto explícito, recuperación del borrador y carga de la versión actual. |
| Caída temporal del backend | Tiempo de espera acotado y recuperación mediante reintento. |
| Título largo en móvil | Sin desbordamiento horizontal a 390 px. |
| Navegación móvil y búsqueda sin coincidencias | Menú funcional, estado vacío y paginación deshabilitada. |

## Verificación automatizada

- `npm run verify`: typecheck, 16 pruebas y compilaciones de aplicación/Storybook correctas.
- Cuatro pruebas nuevas cubren restauración de borradores, validaciones, respuestas de red/HTTP y timeout.
- Las respuestas 429, JSON malformado y fallo de conexión inmediato se probaron con mocks unitarios; no se provocaron todos esos estados en Chrome.
- `scripts/clinical-ui.mjs` incorpora regresiones de borrador y validación. Ese script no se ejecutó en esta sesión: el recorrido de navegador se realizó con las herramientas de Chrome.
- Advertencias de tamaño de algunos bundles de Storybook; no impiden el build.

## Evidencia local

- [Conjunto validado en Chrome](../artifacts/e2e/chrome-final.png)
- [Error de timeout recuperable](../artifacts/e2e/timeout-retry.png)
- [Título largo en móvil](../artifacts/e2e/mobile-long-title.png)

Las capturas y archivos sintéticos están en `artifacts/e2e/`, excluido de Git. La aplicación local sigue disponible en http://127.0.0.1:5174/ mientras sus procesos permanezcan activos.

## Alcance pendiente

Este recorrido no sustituye una prueba de generación real con OpenRouter, validación clínica por especialistas, carga concurrente, auditoría de seguridad ni verificación del almacenamiento de Railway. La recuperación de conflictos requiere descartar o copiar manualmente el borrador; no hay fusión automática de ediciones. Los cambios de esta sesión están en local y no se desplegaron en Railway.
