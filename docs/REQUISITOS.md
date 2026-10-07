# Criterios de cierre del generador ENARM

Fuente: reto-generador-enarm.pdf, páginas 2–4. Las marcas indican implementación verificada localmente salvo que se indique despliegue. La campaña real v3 cubrió los cinco escenarios técnicos; la inspección adicional encontró defectos y motivó reforzar revisión y corrección. La pregunta independiente v6 pasó el recorrido completo desplegado; una serie v9 pasó generación/corrección/revisión real local y desplegada, más inspección adicional del asistente. La campaña final v9 pasó cuatro de cinco escenarios técnicos; el mixto se rechazó por calidad y el independiente requirió corregir una explicación después de la aceptación automática. También se probaron dificultad avanzada, cinco opciones y rasgos del paciente. No se declara validación médica humana ni una tasa representativa de exactitud.

- [x] Configuración: especialidad, tema, subtema, dificultad explicada, tipo clínico, instrucciones, 3–5 opciones con respuesta única.
- [x] Preguntas independientes y seriadas: cantidad de casos y preguntas por caso, coherencia del caso compartido.
- [x] PDF/TXT: extracción con páginas/secciones, límites visibles, documento vacío/escaneado/insuficiente manejado explícitamente.
- [x] Fuentes clínicas seleccionadas y justificadas; contenido extraído, enlace localizable y procedencia documento/fuente/ambos.
- [x] Generación real: casos ficticios, opciones, clave, explicación de cada opción, citas y clasificación.
- [x] Verificación: citas textuales localizables, respuesta única, conteos, duplicados, revisión de coherencia clínica y dificultad; límites académicos visibles.
- [x] Editar casos, preguntas, opciones, respuestas y explicaciones; guardar con control de conflictos.
- [x] Regenerar conservando el trabajo anterior y la coherencia de cada serie.
- [x] Recuperar y exportar preguntas completas con modificaciones, referencias y relaciones de series.
- [x] Vista de prueba sin claves/explicaciones antes de contestar; soporta series sin revelar respuestas de preguntas pendientes.
- [x] Selección de modelo/version y justificación calidad/costo/latencia; medición de uso, límites y errores.
- [x] Demo técnica con solicitudes nuevas, documento propio, series, edición, recuperación, exportación, examen y fallos.
- [x] Pruebas de integración y navegador; evaluación automatizada de contenido con fuentes y fallos documentados en EVALUACION-MODELO.md. No sustituye una evaluación académica humana.
- [x] Despliegue real en Railway: app y worker v9 en SUCCESS; DB, worker y almacenamiento conectados; generación configurada.
- [ ] Código disponible en el repositorio GitHub independiente: el remoto sigue sin ramas y el primer commit continúa bloqueado por el control externo del chat.
- [ ] CI ejecutado en GitHub y despliegues conectados a `main`: el workflow y la configuración están preparados; requieren publicar primero el repositorio.

No se exige integrar Futurum/College OS, login individual, OCR de escaneos, buscador web abierto o una tecnología concreta de recuperación. El documento exige declarar los formatos/límites aceptados y no fabricar contenido cuando la evidencia sea insuficiente.


Auditoría de cierre del 2026-10-07: la iteración anterior produjo progreso verificable (despliegue v9, campaña real y documentación de defectos). La comprobación actual confirma los despliegues `d8d903df-ac96-4d04-8ba7-8455275cdad7` y `85b224e4-3ba2-4971-913a-2a706d6e0db9` en SUCCESS, sin solicitudes activas. El remoto no tiene ramas. Gitleaks 8.30.1 está disponible y el escaneo de aproximadamente 1.06 MB del contenido preparado pasó, pero el control PreToolUse volvió a impedir crear el primer commit porque no localiza Gitleaks. Este bloqueo externo se repite en tres turnos consecutivos; no se modificó el control ni College OS. La entrega completa no puede declararse terminada mientras el código y CI remoto sigan pendientes.

Las marcas de generación/verificación se refieren a funciones implementadas y recorridos comprobados, no a garantizar que toda solicitud produzca contenido correcto: la campaña v9 rechazó el caso mixto y dejó pasar una explicación que después corrigió el asistente. La revisión académica y la ampliación de la evaluación quedan explícitas como límites del POC.
