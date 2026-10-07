# Generador: uso, fuentes y evaluación

## Recorrido del equipo académico

1. En **Crear preguntas**, indicar especialidad, tema, subtema, dificultad, tipo clínico e instrucciones. Hay 3, 4 o 5 opciones, siempre una mejor respuesta. Se elige diagnóstico, tratamiento, estudios, prevención o mixto.
2. Elegir preguntas independientes (un caso por pregunta) o seriadas (casos × preguntas por caso). Máximo 10 preguntas por solicitud, 2–5 por serie. La interfaz distingue ambas cantidades.
3. Elegir biblioteca, documento propio o ambos. Cargar PDF con texto seleccionable o TXT UTF-8 de hasta 5 MB; PDF hasta 150 páginas, texto hasta 800 000 caracteres. No hay OCR. Documentos vacíos, corruptos o sin suficiente texto muestran error y no se usan para fabricar respuestas.
4. Generar. El trabajo sigue en segundo plano. Los fallos quedan visibles en la solicitud. Cada resultado incluye caso ficticio, opciones, clave, explicación de cada distractor, justificación, clasificación y citas localizables.
5. Abrir el conjunto. **Editar preguntas** permite cambiar caso, enunciado, opciones, clave, explicaciones y referencias. Guardar incrementa la versión; un conflicto entre sesiones no sobrescribe cambios. Un borrador local sobrevive a la recarga, pero no sustituye Guardar.
6. **Regenerar conjunto** produce otro conjunto relacionado, preservando el original. Se regenera la serie completa para conservar su coherencia.
7. Recuperar en **Banco de preguntas** mediante búsqueda y páginas. Exportar JSON incluye la versión guardada completa, casos compartidos, referencias, modelo y notas de revisión.
8. **Contestar prueba** usa una copia fija de la versión. Todas las preguntas se responden antes de mostrar claves o explicaciones. No se envían soluciones al navegador durante el intento. El enlace del intento recupera sus resultados, incluso si el original cambia.
9. Registrar una revisión académica describiendo qué se comprobó. Editar vuelve a marcar el conjunto como pendiente. La revisión automática no equivale a validación médica humana.

## Sustento clínico

La biblioteca inicial usa capítulos oficiales de NICE (control glucémico en diabetes, atención prenatal y gastroenteritis pediátrica) y WSES (apendicitis, edición 2020). Se eligieron por recomendaciones explícitas, procedencia institucional y contenido recuperable. Son fuentes internacionales; las preguntas se redactan en español. La edición WSES 2020 y NICE CG84 no se presentan como las más recientes. El equipo debe comprobar vigencia y compatibilidad con el contexto mexicano. Se puede cargar una GPC mexicana actualizada como documento propio. Las descargas automatizadas del IMSS devolvieron HTTP 403 durante la implementación; no se simula su consulta.

La recuperación es léxica con equivalencias español/inglés acotadas. Selecciona hasta 12 páginas/secciones por fuente, hasta 8 000 caracteres por fragmento y 60 000 caracteres de contexto total. No promete cobertura exhaustiva, búsqueda web abierta ni acceso a documentos enlazados pero no recuperados. Una fuente sin fragmentos relacionados detiene la solicitud. Las tablas HTML mantienen filas/columnas y las referencias conservan anclas de sección; PDF mantiene número de página. El resultado guarda la edición, fecha, hash y fragmentos realmente usados, evitando depender de cambios posteriores en la web. Caché de biblioteca: siete días.

## Modelo y controles

Proveedor elegido por el usuario: **OpenRouter**. El primer borrador independiente usa **`openai/gpt-5.4-mini`** y las series usan **`openai/gpt-5.4`**; la revisión y hasta dos correcciones dirigidas usan **`openai/gpt-5.4`**, ambos con razonamiento medio. El catálogo consultado resuelve los alias a `openai/gpt-5.4-mini-20260317` y `openai/gpt-5.4-20260305`; los alias pueden cambiar y se registra el identificador efectivamente devuelto. La elección conserva el costo del modelo pequeño para preguntas independientes y dedica el modelo mayor a series y a defectos concretos encontrados durante la evaluación. No garantiza superioridad clínica ni detección completa de errores. `OPENROUTER_MODEL`, `OPENROUTER_SERIES_MODEL` y `OPENROUTER_REVIEW_MODEL` permiten configuración explícita. OpenAI directo permanece como alternativa de código, sin evaluación clínica real en esta entrega.

Hay generación y revisión crítica de sustento, distractores, dificultad, coherencia de unidades/tiempos y filtración de respuestas entre preguntas de una serie. Además, reglas deterministas comprueban conteos, IDs, duplicados, clasificación y citas literales en la página/sección suministrada. Si falla una comprobación, no se publican preguntas como verificadas. Esta estrategia puede rechazar borradores que una persona considere corregibles; la evaluación real debe medir ese comportamiento.

Se registran proveedor, modelo, tokens, duración y costo de las llamadas de conjuntos completados, incluyendo la corrección automática si fue necesaria. OpenRouter devuelve costo por llamada, que se prefiere a la estimación por tarifa. Referencia de tarifa: US$0.75 por millón de tokens de entrada y US$4.50 por millón de salida; no incluye descuentos de caché. Para otros modelos el costo figura no estimado. El consumo de solicitudes fallidas puede existir aunque no haya conjunto guardado: consultar la facturación del proveedor para el gasto total. En OpenAI directo, `store:false` desactiva el almacenamiento opcional de respuestas; no equivale a prometer retención cero del proveedor.

Límites: 30 solicitudes compartidas en 24 horas por defecto, tres pendientes simultáneas, tres envíos por minuto/IP, 150 segundos por llamada, trabajo de cola de hasta 20 minutos y hasta 10 preguntas. Un borrador con errores de estructura, citas o revisión tiene como máximo dos correcciones dirigidas a los campos señalados y vuelve a pasar todos los controles (hasta seis llamadas). La falta de evidencia, acceso o saldo no activa esa corrección. Un fallo de infraestructura puede reintentarse una vez y podría repetir consumo si ocurrió después de una llamada; el guardado del conjunto es idempotente. Una clave ausente, falta de saldo, rechazo del modelo o evidencia insuficiente aparecen como errores explícitos.

Fuentes de la elección técnica: [modelo](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [salidas estructuradas](https://developers.openai.com/api/docs/guides/structured-outputs).

## Evidencia y límites de validación

Verificación local realizada el 2026-10-07 (Asia/Seoul):

- Doce pruebas unitarias: contratos, control de acceso, citas inventadas, opciones duplicadas, clasificación, extracción TXT/PDF real, anclas HTML/tablas y redacción de payloads de prueba. Una prueba usa el SDK real contra un servidor local sintético para comprobar las dos llamadas, esquema JSON, revisión rechazada/incompleta y fallos de evidencia, saldo y acceso. Detectó y permitió corregir una incompatibilidad real del esquema con el SDK; no se usaron transformaciones Zod no representables en JSON Schema.
- Integración PostgreSQL 17: migraciones repetibles, roles sin DDL, cola durable, idempotencia concurrente, reintento transitorio, rollback, series, edición/versiones, exportación, examen y conservación de la copia evaluada tras editar el original.
- Navegador Chrome: carga, series, edición, guardar, recuperar, exportar, contestar/calificar, registrar revisión y regenerar conservando el original. Sin desbordamientos a 1440, 768, 390 y 320 px. Usa exclusivamente generador sintético y bucket en memoria para esta suite; sus resultados están etiquetados como no clínicos.
- Recuperación real de fuentes: NICE NG28 5 secciones; NG201 25; CG84 14; WSES 42 páginas de PDF. Se extrajo texto y se seleccionaron fragmentos relevantes. Esto prueba acceso/extracción, no pertinencia de preguntas aún no generadas.
- Build de app/servidor/Storybook y typecheck completados.

La campaña real posterior cubrió solicitudes independientes/seriadas/documento/biblioteca/mixtas y evidencia insuficiente. Los resultados y defectos que motivaron nuevas revisiones se detallan abajo y en EVALUACION-MODELO.md. No se declara cumplimiento clínico a partir de los fixtures sintéticos. La revisión académica humana permanece diferenciada de comprobaciones automáticas.

### Ejecutar las pruebas de navegador locales

Usar una base separada llamada `enarm_ui_test` (la herramienta borra exclusivamente sus fixtures). Tras `npm ci`, en terminales separadas:

```sh
TEST_DATABASE_URL=postgresql://enarm_local@127.0.0.1:55439/enarm_ui_test node --import tsx test/support/ui-server.ts
npm run dev:web -- --port 5174
node scripts/clinical-ui.mjs
```

Para el catálogo Storybook, ejecutar `npm run build`, `npx vite preview --host 127.0.0.1 --port 5175` y `node scripts/check-ui.mjs`.

El harness sintético nunca se importa desde los entrypoints de producción. El smoke de Railway (`scripts/smoke.mjs`) usa DB y bucket reales, sube documentos claramente no clínicos y comprueba extracción/descarga, navegación, sidebar y catálogo; informa por separado si falta el proveedor. No genera respuestas médicas ficticias para aparentar una integración real.

### Campaña con proveedor real

Con el proveedor configurado, ejecutar `POC_BASE_URL=https://enarm-app-enarm-poc.up.railway.app POC_ACCESS_MODE=public node scripts/evaluate-clinical.mjs`. Consume llamadas reales y conserva en `artifacts/clinical-evaluation/` los resultados, tiempos y consumo. Incluye biblioteca, serie, PDF propio, mezcla y evidencia insuficiente; prueba edición, exportación y ocultamiento de claves. Se niega a ejecutar si el worker no está configurado. Que la campaña pase técnicamente no basta: revisar cada pregunta contra sus fragmentos y registrar problemas de coherencia, distractores, dificultad y vigencia antes de marcar el reto completo.

## Validación en Railway — incremento clínico

La aplicación `ac2098e7-356c-48e3-9d07-fc22c9dece7e` alcanzó SUCCESS en `enarm-poc`. El smoke verificó conexión real de DB/worker/bucket, carga y extracción de TXT y PDF, descarga byte a byte, navegación, sidebar fijo y catálogo de 63 componentes más demo de tema. La generación permanecía `not_configured`; el botón estaba deshabilitado.

El worker `d8323af8-e7b9-4b85-a1f0-a73eabc6197a` también alcanzó SUCCESS, con las migraciones clínicas y el esquema corregido del SDK. La activación del proveedor y su evaluación continúan pendientes.

La recuperación de las cuatro fuentes se ejecutó desde el contenedor de `enarm-worker` con su rol restringido y caché PostgreSQL real:

| Fuente | Páginas/secciones | SHA-256 del recurso recuperado |
|---|---:|---|
| NICE NG28 | 5 | `11e2ffac4c479eb260dd4a2a34a7bfa55bb71d14b4d803b2f7904445b4966c3a` |
| NICE NG201 | 25 | `b456065a124913b506256765b85d89afd72bc2e3b2bff6c148a1b1f25ac14489` |
| NICE CG84 | 14 | `fe50d47fe1a4e410a71ce0078e366d2a9138e360b68fed66dd1c317c53b2aa8b` |
| WSES 2020 | 42 | `609c0b9669fff6af67e485f52ba96855afbc6a324bfb2e06a62d0daed6025379` |

El hash de un recurso web puede cambiar por modificaciones de contenido o presentación; identifica la copia extraída, no certifica su validez clínica. El bloqueo de `git commit` persiste en el control automático del chat: no localiza Gitleaks, aunque `/opt/homebrew/bin/gitleaks` existe y el escaneo manual pasó. No se modificaron ni el control ni College OS. GitHub y CI remoto permanecen pendientes.

## OpenRouter — primera verificación real

La clave del usuario fue validada y guardada exclusivamente en las variables de `enarm-worker`. La primera generación de una pregunta independiente pasó la comprobación de citas/estructura y la revisión del modelo: 21.3 s de generación + 7.0 s de revisión; US$0.0272235 reportados por OpenRouter. Es una muestra, no una estimación garantizada de latencia o calidad. Artefacto local: `artifacts/clinical-evaluation/provider-probe.json`.

Durante la integración se encontraron dos fallos reales: el esquema completo enviado al proveedor producía respuestas vacías con fin por límite de tokens, y los valores de serie enviados junto con el formato independiente inducían cantidades incorrectas. Ahora se envía un esquema estructural portable, manteniendo patrones, límites y validación Zod completos en el servidor, y se normaliza la cantidad efectiva de casos/preguntas del mensaje. La clasificación se asigna a partir de la solicitud y el revisor sigue comprobando que el contenido corresponda a ella. La suite del SDK comprueba también que una respuesta inválida siga siendo rechazada tras simplificar el esquema de transporte.

Se utiliza Chat Completions de OpenRouter con JSON Schema y `require_parameters: true`. No se activa un modelo alternativo automáticamente. Referencias: [salidas estructuradas](https://openrouter.ai/docs/guides/features/structured-outputs), [modelo y tarifas](https://openrouter.ai/openai/gpt-5.4-mini).

La primera campaña desplegada rechazó cuatro borradores por citas, estructura, omisión del documento propio o cuestiones de revisión; el caso de evidencia insuficiente se rechazó correctamente. El reporte se conserva como evidencia de fallos. El prompt v2 incorporó una corrección automática guiada, distingue errores clínicos bloqueantes de observaciones opcionales y permite corregir un número de página sólo cuando la cita sin modificar aparece en una única página de la fuente indicada. Las citas inventadas o parafraseadas siguen rechazándose.


### Trazabilidad de referencias — prompt v3

La segunda campaña (v2) pasó PDF propio, fuentes combinadas y rechazo de evidencia insuficiente; falló la pregunta de biblioteca por transcripción de citas y la serie por estructura. Ambos reportes se conservan en los artefactos locales. Estos fallos motivaron un cambio de representación, no la eliminación de controles.

Desde v3, el servidor construye fragmentos literales de hasta 560 caracteres, con solapamiento, procedencia y página. El modelo selecciona identificadores de un catálogo cerrado y describe qué afirmación respalda cada uno. El servidor resuelve esos IDs a las citas originales. Ni las páginas ni las citas dependen de una transcripción del modelo. La revisión semántica sigue siendo necesaria: elegir un fragmento existente no garantiza que respalde una afirmación.

La prueba local real v3 completó una pregunta y su revisión en 19.2 segundos, con US$0.0178245 reportados. Las doce pruebas unitarias verifican también fragmentos literales, páginas, IDs únicos y rechazo de referencias ajenas al catálogo. La integración PostgreSQL y el build completo pasaron. La vista de práctica usa título neutro y omite títulos de casos que pudieran adelantar diagnósticos.


### Evaluación de contenido — prompt v4

La campaña v3 pasó los cinco escenarios técnicos en Railway, incluidos edición, recuperación, exportación y práctica con calificación real. Sin embargo, una inspección adicional de la serie de gastroenteritis encontró que una explicación mezclaba alimentación posterior a rehidratación con la fase inicial, y omitía mantenimiento al describir la pauta como completa. El pase de software no equivalió a validez clínica. El conjunto `07f2ba6c-1eec-4f02-835e-c19b6fac4cdd` fue marcado «requiere corrección» y permanece como borrador. La copia original se conserva en `library-series-v3.json`.

Por ese hallazgo, v4 mantiene `openai/gpt-5.4-mini` para redactar y emplea `openai/gpt-5.4` para revisar cada afirmación, población, fase, dosis, excepciones y contradicciones con todas las páginas suministradas. `OPENROUTER_REVIEW_MODEL` permite configurar este segundo modelo explícitamente. La revisión usa razonamiento medio: la prueba con razonamiento alto agotó el límite de 150 segundos. Con razonamiento medio detectó el defecto conocido en 73.2 segundos y US$0.080445. Artefacto: `review-regression.json`. El mayor costo se justifica por un fallo observado del revisor anterior, no por una promesa general de superioridad. Tarifa de referencia: US$2.50/M entrada y US$15/M salida; prevalece el costo reportado. [Ficha del revisor](https://openrouter.ai/openai/gpt-5.4).

La prueba de regresión real está en `scripts/probe-review.ts`; requiere el artefacto v3 y una clave propia. No ejecuta pagos automáticamente desde CI. El resultado sigue requiriendo revisión académica humana: detectar este defecto conocido no demuestra que detecte todos los errores posibles.


Una prueba posterior de la misma serie con GPT-5.4 también como generador fue rechazada después de la corrección permitida: el revisor encontró una explicación de distractor que confundía pacientes sin deshidratación con y sin riesgo aumentado. No se adoptó ese modelo para redactar por falta de mejora suficiente en esa muestra y mayor espera. Se conserva mini para generación y GPT-5.4 para revisión. Las solicitudes que no superan la revisión fallan explícitamente; no se rebajaron esos controles para obtener un pase.


### Corrección dirigida — prompt v5

La serie de seguimiento de diabetes en v4 (`e4b9b527-9c2e-4110-839e-7c5191d04093`) fue rechazada por una pista textual: el intervalo preguntado ya aparecía en la narrativa. En v5, el primer borrador sigue usando mini, pero la única corrección permitida utiliza el modelo de revisión GPT-5.4 y recibe instrucciones de resolver cada defecto concreto sin reintroducirlo. Después se repiten esquema, citas, conteos y revisión completa. No se añade un ciclo ilimitado. La suite del SDK comprueba la selección de modelo en la corrección.

Se precisó la definición intermedia como integración de dos o más datos de antecedentes, exploración **o** estudios; no impone pruebas complementarias cuando la guía indica que no son necesarias. No cambia las exigencias de sustento ni unicidad de respuesta.


La prueba local v5 de la serie de diabetes también fue rechazada: la narrativa no incluía farmacoterapia y la explicación invocaba tratamiento hipoglucemiante estable. Queda registrada como una discrepancia de aplicabilidad detectada, no como un éxito. La evaluación adicional especifica un adulto en monoterapia estable con metformina para evitar esa ambigüedad. No se declara una tasa general de éxito a partir de esta selección de casos.


### Condiciones de aplicabilidad — prompt v6

Se pide al generador explicitar en el caso las condiciones de la recomendación y explicar distractores para ese caso, sin inventar reglas universales ni atribuir usos a valores que la fuente no establece. La prueba real independiente v6 pasó tras una corrección: 114.4 segundos de llamadas, US$0.14838825 reportados. La inspección adicional comprobó que el caso indicaba régimen inicial sin riesgo de hipoglucemia y que la explicación distinguía los dos supuestos NICE para 53 mmol/mol. Esto mejora la trazabilidad de esa muestra, no demuestra validez general ni resuelve por sí solo la tasa de rechazo de series.


Despliegues al cierre de la iteración v6: app `edb68fd8-9c1a-4be6-aacb-6f32bc6e5538` y worker v6 `d8e28e41-9443-4efd-a894-29681050eedb`, ambos SUCCESS en `enarm-poc`. Estado comprobado: DB, worker y almacenamiento conectados; generación configurada. La clave está únicamente en el worker. El escaneo de secretos pasó de nuevo; el control automático de commit continuó bloqueando la publicación en GitHub por no localizar Gitleaks.

La solicitud nueva v6 `e3484ef0-96ae-4c63-8a91-a6f536164353` también pasó en Railway: generación, guardado, edición, exportación, práctica sin claves anticipadas, calificación y recuperación. Duración del recorrido 110.7 s; costo reportado US$0.128874. La revisión señaló un distractor débil y el conjunto permanece como borrador pendiente de evaluación académica.


### Correcciones dirigidas y evaluación ampliada — v7 a v9

Las correcciones clínicas ahora se expresan como cambios a campos concretos, con IDs cerrados de casos, preguntas y opciones. Conservan las relaciones, rechazan operaciones repetidas o índices inválidos y vuelven a pasar la revisión completa. Hay un máximo de dos correcciones por solicitud; un error final sigue impidiendo publicar el conjunto. Los errores estructurales que no permiten construir un borrador se regeneran con el informe de validación.

Una inspección adicional detectó un falso negativo del revisor v7: un distractor era una descripción verdadera más específica que la clave. v8 añadió esa comprobación explícita y una regresión contra el ejemplo original. También se reforzó el cumplimiento de rasgos pedidos después de detectar un caso denominado multípara con sólo un parto previo. La nueva prueba prenatal sí describió dos partos previos; la prueba avanzada de apendicitis incluyó cinco opciones y resultados discordantes.

v8 rechazó otra serie por una explicación de antibióticos que generalizaba indicaciones de otros pacientes. v9 solicita explicaciones breves centradas en el caso, elimina afirmaciones accesorias innecesarias y emplea el modelo mayor para el primer borrador de series. No rebaja el revisor ni convierte los rechazos en resultados aceptados. La cola admite 20 minutos para las hasta seis llamadas acotadas a 150 segundos cada una.

La serie pediátrica v9 pasó después de una corrección dirigida: 223.8 segundos de llamadas y US$0.3003775. La inspección adicional del asistente contrastó la valoración y el tratamiento con los fragmentos originales, sin encontrar los errores previos de mezcla de fases ni opciones verdaderas solapadas. El distractor de datos insuficientes puede discriminar poco y las cifras de signos vitales pueden añadir ruido. El resultado sigue como borrador, no como contenido aprobado por un médico. Artefactos: `series-enarm-evidence-v9.json` y `series-attempts-enarm-evidence-v9.json`.


Despliegue v9 confirmado: app `d8d903df-ac96-4d04-8ba7-8455275cdad7` y worker `85b224e4-3ba2-4971-913a-2a706d6e0db9`, ambos SUCCESS en `enarm-poc`. App desplegada primero para actualizar el límite de la cola antes del worker. Se verificaron DB, almacenamiento y heartbeat conectados, generación configurada y clave ausente de la app/presente sólo en el worker. El escaneo manual de Gitleaks volvió a pasar; el control externo de commit mantiene el bloqueo por no encontrar su ejecutable.


La campaña final v9 en Railway pasó cuatro de cinco escenarios: independiente, serie, PDF propio y rechazo esperado de evidencia insuficiente. La solicitud mixta fue rechazada por una explicación que confundía evitar TC con omitir toda imagen; no se publicó conjunto (404 verificado). Los resultados completados pasaron edición/exportación/práctica/recuperación. Una inspección adicional detectó una generalización errónea en el independiente que el revisor dejó pasar; se conservó el original y se corrigieron B/C en una nueva versión todavía pendiente de revisión académica. Este falso negativo impide presentar la revisión automática como garantía clínica. Detalles y costos en EVALUACION-MODELO.md; reporte completo en `report-v9-deployed.json`.
