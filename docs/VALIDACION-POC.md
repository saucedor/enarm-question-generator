# Validación del POC — 2026-10-06

Registro histórico de la infraestructura inicial. Para el incremento clínico y el estado actual de su validación, consultar [GENERADOR.md](GENERADOR.md) y [REQUISITOS.md](REQUISITOS.md).

## Despliegue observado

Proyecto: `65633587-fd0a-4bcb-90e4-07950348cf9f`.
Entorno independiente: `enarm-poc`, `7583595c-b00c-4880-98e6-cbd23e99864b`.

| Recurso | Deployment | Estado |
|---|---|---|
| enarm-app | `2d27c075-ba34-4a13-b0bd-baca7a481f4c` | SUCCESS |
| enarm-worker | `ff9c8b6f-22b9-4964-9a34-9fe0506625df` | SUCCESS |
| Postgres 18 | `1c6ddc2f-8ec4-4418-9f47-9fc4bcf8d117` | SUCCESS |

`/health/ready` devolvió HTTP 200. El endpoint autenticado `/api/status` confirmó DB, worker y bucket conectados. Backups diarios configurados y consultados por API para el volumen PostgreSQL. Base sin proxy TCP público, worker sin dominio público.

El deployment de Vanta en `production` conservó su ID inicial `58e7aa2d-fecb-4d23-b2a8-d7e17cbe76cf`; no se alteró su servicio.

## Evidencia

- Typecheck, pruebas unitarias, build de aplicación y build de Storybook: pasan.
- Integración con PostgreSQL local 17: pasa. Prueba roles restringidos, migraciones repetibles, auth, protección de escrituras, upload/download, solicitudes concurrentes idempotentes, rollback ante fallo de cola, un reintento transitorio y persistencia al reiniciar el productor. Almacenamiento simulado solo en esta suite local.
- Smoke Playwright contra Railway: pasa con **bucket S3 y worker reales**, carga TXT, verificación SHA-256, resultado persistido, recarga, exportación JSON, vista móvil sin desbordamiento y story de botón visible. Cero errores JavaScript observados.
- Solicitud de prueba desplegada: `410f4c25-2f3e-43f6-88dd-a186936a7878`.
- Capturas locales: `artifacts/poc-desktop.png`, `artifacts/poc-mobile.png` (no versionadas).
- `npm audit --omit=dev`: cero vulnerabilidades reportadas. Avisos de desarrollo heredados de las versiones compatibles de la toolchain documentados en README.
- Gitleaks sobre el índice del repo nuevo: sin secretos.

## Pendientes explícitos

No se generó ni validó contenido médico. No hay credenciales LLM ni consumo de modelos. Falta extracción/OCR, verificación de fuentes y demás funcionalidad clínica.

No se ha ensayado restauración completa ni respaldos de los objetos S3. Autenticación compartida de POC; falta identidad individual para producción.

Los archivos están preparados en el repositorio local. El commit/push y la conexión GitHub siguen pendientes: el control PreToolUse del chat iniciado en College OS rechaza el commit por no encontrar Gitleaks en su PATH, aunque el ejecutable local existe y el escaneo manual pasó. No se desactivó el control ni se modificó College OS.

## Actualización: acceso público solicitado

Se desplegó `39b24ed8-a254-4eb7-9008-4fcbf0215b7c` en enarm-app con `POC_ACCESS_MODE=public`. La API devuelve HTTP 200 sin `WWW-Authenticate` y el navegador abre la app y Storybook sin credenciales.

Typecheck, cuatro pruebas unitarias y build pasan. Smoke completo sin contraseña aprobado: solicitud `e1303425-9c2e-4671-97e3-079d8bbe7ed2`, carga al bucket real, worker, integridad, persistencia, exportación, móvil y Storybook. El worker sigue en su despliegue anterior. El acceso por contraseña descrito en la validación inicial corresponde al estado anterior.

## Actualización: catálogo shadcn y tema de referencia

Deployment app: `fd7a2f56-38d5-40d0-9029-b10c4ce4ba98`, estado SUCCESS. Solo se actualizó enarm-app.

Se reemplazó el sistema visual inicial por componentes oficiales shadcn/ui independientes, con tokens compartidos entre la aplicación y Storybook. Catálogo: 63 componentes y una demo adicional de tema/botones (64 stories). Form y Toast se incluyen como componentes clásicos. Referencia clara: fondo `#F7F6F3`, texto `#0E101A`, secundario `#66697F`, borde `#DDDDE3`; acentos azules derivados visualmente del logotipo. Tema oscuro adicional para revisar componentes.

Verificación local:
- Typecheck, 4 pruebas unitarias, build de aplicación y build de Storybook: pasan.
- Playwright: 64 stories renderizadas, cero errores JavaScript; ninguna desborda horizontalmente a 390 px.
- Aplicación a 1440, 768, 390 y 320 px sin desbordamiento. Texto de acción principal centrado y sin superposición con el icono.
- Interacciones: Select en la app, Dialog abre/cierra, Combobox filtra/selecciona, Form muestra validación y Questionnaire avanza/envía con notificación.
- Tema claro/oscuro comprobado en navegador. Capturas en `artifacts/ui-*.png` y `artifacts/storybook-*.png`.
- Auditoría de dependencias de runtime sin vulnerabilidades; avisos de desarrollo documentados en README. Gitleaks sobre el índice: sin secretos.

La prueba visual local usa respuestas API simuladas para no crear documentos ni solicitudes. La validación funcional desplegada utiliza el backend y el bucket reales.

Durante el smoke se detectó y corrigió una regresión del Select controlado: al agregar un documento, su control nativo interno podía emitir un valor vacío y borrar la selección. Se ignoran esos eventos vacíos; la opción explícita «Continuar sin documento» sigue disponible. La prueba local ahora carga un archivo y verifica que `documentId` y la especialidad elegida lleguen al POST. El smoke espera el ID de la solicitud recién creada para no confundir su resultado con una ejecución anterior.

Despliegue final con la corrección: `f7a01f6f-302b-4885-9756-48486e927165`, SUCCESS. Smoke público aprobado con solicitud `55ac5b24-d66d-491c-926b-719979ec265e`: carga al bucket real, documento asociado, worker, SHA-256, persistencia tras recarga, exportación, layout móvil y Storybook. Se verificó además la paleta publicada y las 63 entradas shadcn del índice remoto. No se modificaron servicios de College OS ni Vanta.
