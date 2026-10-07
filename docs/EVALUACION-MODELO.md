# Evaluación real de OpenRouter

Fecha: 7 de octubre de 2026, Asia/Seoul. Esta evaluación combina comprobaciones de software, revisión automatizada y una inspección adicional del asistente contra los fragmentos recuperados. **No es validación médica humana ni una estimación representativa de exactitud clínica.**

## Configuración desplegada

- Generación independiente: `openai/gpt-5.4-mini`; series: `openai/gpt-5.4`. Ambos con razonamiento medio. Las series imponen restricciones simultáneas de coherencia, distractores y ausencia de pistas. Esta elección se evalúa por separado; no implica que el modelo mayor garantice calidad.
- Revisión y, si hace falta, hasta dos correcciones dirigidas: `openai/gpt-5.4`, razonamiento medio.
- Prompt: `enarm-evidence-v9`, desplegado en Railway. Los IDs de evidencia se resuelven en el servidor a texto y página originales. La cita literal no sustituye la comprobación de sustento.
- Todo borrador corregido vuelve a pasar estructura, conteos, referencias y revisión clínica. Si falla otra vez, la solicitud termina con el motivo y no publica un conjunto nuevo.
- Cada conjunto completado conserva modelos, tokens, tiempos y costos reportados. El proveedor puede cobrar también solicitudes fallidas; consultar su facturación para el total.

## Resultados que motivaron los cambios

| Prueba real | Resultado técnico | Hallazgo y alcance |
|---|---|---|
| Independiente NICE NG28, v9, Railway | Pasó software tras corrección; 125.9 s; US$0.165369 | La inspección adicional detectó una generalización en la explicación de 53 mmol/mol que el revisor no bloqueó. Se conservaron original y consumo; el asistente corrigió explicaciones B/C vía editor API, versión 3, aún pendiente de revisión académica. No se cuenta como éxito clínico automático. |
| Independiente NICE NG28, v6, Railway | Pasó con corrección; 110.7 s; US$0.128874 | Generación, guardado, edición, exportación, práctica y recuperación comprobados. El revisor advierte un distractor débil; sigue como borrador. |
| Independiente NICE NG28, v6, local | Pasó tras corrección; 114.4 s de llamadas; US$0.14838825 | El caso explicita régimen inicial y condiciones de aplicabilidad; las explicaciones distinguen los distintos contextos de cada umbral. |
| Independiente NICE NG28, v3 | Pasó en Railway; 20.6 s; US$0.017013 | Meta y alternativas contrastadas con los fragmentos. No demuestra cobertura de otros temas. |
| Serie pediátrica NICE CG84, v3 | Pasó software; 33.1 s; US$0.0296205 | La inspección adicional detectó mezcla de fases de tratamiento y una indicación incompleta. El conjunto se marcó «requiere corrección». |
| PDF propio WSES 2020, v9, Railway | Pasó tras corrección; 154.9 s; US$0.3190025 | Recuperación del PDF cargado y citas por página; explicación y clave contrastadas con recomendación 1.10. Persisten observaciones sobre experiencia del operador y homogeneidad de un distractor. |
| PDF propio WSES 2020, v3 | Pasó; 30.2 s; US$0.04829625 | Probó documento real, referencias por página, edición, exportación y práctica. Se declara límite de vigencia/contexto. |
| Documento + biblioteca WSES, v9, Railway | Rechazada tras correcciones | La explicación de un distractor confundía evitar TC con omitir toda imagen. La API confirmó que no se publicó ningún conjunto. Este rechazo no cuenta como generación completada. |
| Documento no clínico, v9, Railway | Rechazado correctamente | Sin fragmentos pertinentes; no se fabricaron preguntas. |
| Documento + biblioteca WSES, v3 | Pasó con corrección; 52.2 s; US$0.0699183 | Son dos copias de la misma edición: no constituyen corroboración independiente. |
| Documento no clínico, v3 | Rechazado correctamente | No se encontraron fragmentos pertinentes; no se fabricaron preguntas. |
| Regresión del borrador pediátrico con revisor GPT-5.4 | Rechazado; 73.2 s; US$0.080445 | Detectó mezcla de fases y omisión de mantenimiento. La prueba con razonamiento alto agotó 150 s; se descartó esa configuración. |
| Serie pediátrica con revisor reforzado | Rechazada | Distractores solapados/poco plausibles. No se aceptó para cumplir un conteo de pruebas. |
| GPT-5.4 también como generador | Rechazado tras corrección | Persistió una contradicción en la explicación de un distractor. No justificó adoptarlo para todos los primeros borradores. |
| Serie de diabetes, v4, en Railway | Rechazada | El intervalo preguntado ya aparecía en la narrativa. |
| Serie de diabetes, v5, en Railway | Rechazada en 171.4 s | Fase terapéutica implícita y explicaciones que generalizaban reglas o asignaban al distractor un valor sin sustento. |
| Serie de diabetes, v5, local | Rechazada | Discordancia entre narrativa sin fármacos y explicación que invocaba tratamiento farmacológico estable. |
| Serie pediátrica, v7, local | Pasó la revisión automática tras dos correcciones; rechazada en inspección adicional | Dos opciones eran descripciones verdaderas, una más específica que la otra. Se añadió una regresión para impedir que «categoría principal» encubra el solapamiento. |
| Apendicitis avanzada, v7, local | Pasó; 75.1 s; US$0.13248875 | Cinco opciones; decisión ante imagen negativa y dolor persistente, contrastada con WSES 2020. No demuestra cobertura de toda dificultad avanzada. |
| Personalización prenatal, v7, local | Pasó software; incumplió un rasgo pedido | El caso pedido como multípara sólo describía un parto previo. Se reforzó la comprobación de rasgos y concordancia de antecedentes. |
| Personalización prenatal, v8, local | Pasó; 67.3 s; US$0.0854705 | Dos casos independientes, tres opciones, primera gestación y dos partos previos respectivamente. La inspección adicional verificó los rasgos y las recomendaciones citadas. |
| Regresiones de revisión, v8, local | Ambos defectos conocidos rechazados | Detectó la mezcla de fases del borrador v3 y las opciones verdaderas solapadas del v7 como errores bloqueantes. |
| Serie pediátrica, v8, local | Rechazada tras dos correcciones | Una explicación generalizó indebidamente indicaciones de antibióticos. v9 acota las explicaciones al paciente y elimina listas accesorias en lugar de reemplazarlas por nuevas generalizaciones. |
| Serie pediátrica, v9, Railway | Pasó tras una corrección; 253.5 s; US$0.330515 | Un caso, dos preguntas, cuatro opciones; edición, exportación, práctica y recuperación verificadas. Inspección adicional sin los defectos previos de opciones verdaderas solapadas ni fases mezcladas. Una cita sobre líquidos habituales requiere distinguirla del sustento específico de lactancia; la nota se conserva en el artefacto original de evaluación. |
| Serie pediátrica, v9, local | Pasó tras una corrección; 223.8 s de llamadas; US$0.3003775 | Caso compartido, cuatro opciones y dos preguntas. La inspección adicional contrastó valoración y tratamiento con los fragmentos; no encontró los defectos anteriores de fases ni dos opciones verdaderas. Algunos distractores pueden discriminar poco y los signos vitales numéricos añaden ruido: requiere calibración académica. |

Los tiempos incluyen recorrido API cuando la prueba fue desplegada; los importes son la suma de llamadas registradas en el conjunto, no incluyen otras solicitudes fallidas. Son muestras seleccionadas durante desarrollo, no benchmarks ni garantías de rendimiento. Las fuentes NICE/WSES son internacionales y requieren revisión de aplicabilidad mexicana.

## Reproducción y evidencia

`scripts/evaluate-clinical.mjs` ejecuta solicitudes reales y prueba recuperación, edición, exportación, ocultamiento de soluciones, calificación y recuperación del intento. `EVALUATION_SCENARIOS` permite seleccionar un escenario por nombre. `scripts/probe-review.ts` genera una serie con el escenario original y conserva cada borrador/revisión; sin `--generation-only` comprueba antes el defecto histórico. `scripts/check-review-regressions.ts` exige rechazo de dos defectos conocidos. `scripts/evaluate-capabilities.ts` prueba dificultad avanzada, cinco opciones, subtema y rasgos del paciente con evidencia real. No se ejecutan llamadas pagadas desde CI.

Los artefactos completos se conservan localmente en `artifacts/clinical-evaluation/`, excluidos de Git: reportes v1/v2/v3, conjuntos con fuentes y consumo, regresión del revisor y evaluaciones posteriores. Los conjuntos de prueba guardados en Railway siguen como borradores; el asistente no los marcó revisados por una persona.

Pendiente: evaluación por el equipo académico, una muestra más amplia de especialidades y dificultades, calibración de falsos rechazos y medición repetida de calidad/costo/latencia. La publicación del código y la ejecución de CI en GitHub permanecen bloqueadas por el control local de commit.

La solicitud desplegada v6 es `e3484ef0-96ae-4c63-8a91-a6f536164353`. La inspección adicional del asistente contrastó la condición de manejo con estilo de vida y los umbrales con los fragmentos NICE conservados. No se registró revisión humana. Reporte: `report-v6-deployed.json`.


Campaña final v9 desplegada: **4 de 5 escenarios técnicos pasaron**, contando el rechazo esperado por evidencia insuficiente. La solicitud mixta fue rechazada por calidad. Los tres conjuntos completados pasaron edición/exportación/práctica/recuperación; la inspección adicional encontró un falso negativo clínico en el independiente y el asistente lo corrigió sin marcarlo revisado por una persona. Reporte: `report-v9-deployed.json`; originales e inspecciones separados conservan la trazabilidad. No se deduce una tasa general de exactitud de esta muestra.
