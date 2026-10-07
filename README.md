# ENARM Question Generator

Acceso público sin contraseña. Usa solo documentos ficticios o públicos: las solicitudes y archivos del POC son compartidos.

POC: https://enarm-app-enarm-poc.up.railway.app · Storybook: https://enarm-app-enarm-poc.up.railway.app/storybook/

Generador independiente con configuración de preguntas, extracción PDF/TXT, fuentes clínicas, cola durable, editor, banco, exportación y vista de prueba. **La integración clínica está implementada; el worker ya tiene una clave propia de OpenRouter; la campaña técnica inicial pasó cinco escenarios. La evaluación de contenido motivó reforzar la revisión y las correcciones dirigidas. Preguntas independientes y una serie pasaron las comprobaciones reforzadas; también se registraron rechazos y falsos negativos, documentados en la evaluación. La versión v9 está desplegada: cuatro de cinco escenarios finales pasaron; el caso mixto se rechazó por calidad. La inspección adicional corrigió una explicación del caso independiente que el revisor había aceptado.** Los tests sintéticos no equivalen a validación clínica.

Guía de uso, modelo, límites y evidencia: [GENERADOR.md](docs/GENERADOR.md). Evaluación real y fallos observados: [EVALUACION-MODELO.md](docs/EVALUACION-MODELO.md). Criterios de cierre: [REQUISITOS.md](docs/REQUISITOS.md). La validación histórica de infraestructura se conserva en [VALIDACION-POC.md](docs/VALIDACION-POC.md).

## Arquitectura

- `enarm-app`: React/Vite y API Fastify en el mismo contenedor. Storybook estático en `/storybook/`.
- `enarm-worker`: consumidor pg-boss, extracción/recuperación de evidencia, generación y revisión mediante OpenRouter (o OpenAI directo), resultado durable.
- PostgreSQL: datos y cola. Inserción de solicitud y enqueue en una sola transacción.
- Bucket S3 privado: documentos originales, máximo 5 MB, PDF o TXT. Las descargas pasan por la API del POC.
- Migraciones: antes del despliegue de la app, con candado y checksum. El worker espera el esquema.
- Roles separados `enarm_app` y `enarm_worker`: sin superusuario, sin permisos de crear tablas o roles. Administración únicamente para el paso de migración.

Railway: proyecto `65633587-fd0a-4bcb-90e4-07950348cf9f`, entorno **`enarm-poc`** (`7583595c-b00c-4880-98e6-cbd23e99864b`). El proyecto ya contenía Vanta en `production`: no se reutiliza ni modifica ese servicio. No hay conexión a College OS.

## Ejecutar localmente

Node según `.nvmrc`, npm y PostgreSQL 17 o posterior (la plantilla desplegada de Railway usa PostgreSQL 18). Usar una base local propia, no una base operativa.

```sh
nvm use
npm ci
cp .env.example .env
# Configurar URLs locales y un bucket propio compatible con S3 en .env.
npm run build
node --env-file=.env dist/server/migrate.js
node --env-file=.env dist/server/main.js
# Otra terminal: DATABASE_URL debe usar el rol enarm_worker.
DATABASE_URL=postgresql://enarm_worker:local-development-only@127.0.0.1:55439/enarm_test PORT=3001 node --env-file=.env dist/server/worker.js
```

Abrir `http://localhost:3000`. Usuario `enarm`, contraseña `POC_PASSWORD`. Para frontend con recarga: `npm run dev:web` (Vite reenvía `/api` al puerto 3000). Para componentes: `npm run storybook`.

## Verificación

```sh
npm run verify
TEST_DATABASE_URL=postgresql://enarm_local@127.0.0.1:55439/enarm_test npm run test:integration
npm audit --omit=dev --audit-level=high
```

La integración exige una URL local y base terminada en `_test`. Usa PostgreSQL real y un almacén de objetos en memoria para comprobar: permisos, auth, documentos, idempotencia, rollback, reinicio, generación sintética, series, edición/versiones, exportación y práctica sin soluciones anticipadas. El smoke desplegado comprueba el bucket real, extracción PDF/TXT, recuperación, estado del worker, UI, móvil y Storybook:

```sh
POC_BASE_URL=https://your-enarm-host.test POC_ACCESS_MODE=public node scripts/smoke.mjs
```

El smoke escribe dos documentos sintéticos no clínicos; solo debe apuntar al POC. Capturas en `artifacts/` (ignoradas por Git).

## Despliegue

La primera entrega se desplegó directamente con Railway CLI. **Pendiente: primer commit/push y conexión de ambos servicios a `main` de este repositorio.** El hook del chat original bloqueó el commit; no se modificó ese hook ni el repositorio College OS. Dockerfile multietapa con runtime sin root y dependencias de producción. `SERVICE_ROLE` elige aplicación o worker. La API tiene dominio HTTPS; PostgreSQL y worker usan red privada, sin dominio público ni proxy TCP.

Configuración versionada en `infra/services.json`. `python3 scripts/configure-railway.py` aplica exclusivamente los ajustes de los dos servicios ENARM mediante la API autenticada de Railway. No se usa `railway.json` porque Railway anunció su retirada para diciembre de 2026. Las variables están configuradas en Railway. El workflow CI está preparado localmente y todavía no ha corrido en GitHub. Al conectar el repo, CI verificará y Railway desplegará sin un segundo workflow de publicación.

Variables comunes: `DATABASE_URL`, `SERVICE_ROLE`, `PORT`, `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`.

Solo app/migración: `DATABASE_ADMIN_URL`, `APP_DB_PASSWORD`, `WORKER_DB_PASSWORD`, `POC_ACCESS_MODE`, `POC_PASSWORD`. En Railway se configuró `POC_ACCESS_MODE=public`: aplicación, API y Storybook abren sin contraseña. `private` conserva el acceso opcional por HTTP Basic y exige `POC_PASSWORD`. Solo worker: `OPENROUTER_API_KEY` y opcionales `OPENROUTER_MODEL` (independientes: `openai/gpt-5.4-mini`), `OPENROUTER_SERIES_MODEL` (series: `openai/gpt-5.4`) y `OPENROUTER_REVIEW_MODEL` (revisión y correcciones: `openai/gpt-5.4`). OpenRouter tiene prioridad si existe esa clave. Alternativa directa: `OPENAI_API_KEY` y `OPENAI_MODEL` (predeterminado `gpt-5.4-mini-2026-03-17`). Solo app: `GENERATION_DAILY_LIMIT` (30 por defecto). La clave de OpenRouter está configurada únicamente en el worker; no se incluye en el repositorio. `DATABASE_ADMIN_URL` referencia la base de **este** entorno. Nunca copiar credenciales de College OS.

`/health/ready` verifica conexión a DB para el despliegue. `/api/status` comprueba heartbeat del worker y acceso al bucket. Los logs registran IDs, estados y errores sin contraseñas ni contenido de documentos. Los fallos transitorios tienen un reintento, hay límites de carga y de solicitudes por IP.

## Límites de esta entrega

- Acceso público compartido solicitado para el POC; todavía no hay usuarios individuales. Los documentos y resultados son visibles a quien tenga el enlace.
- La evaluación clínica real está en curso. No se promete validez médica basada en pruebas de software.
- PDF con texto y TXT sí se extraen; no hay OCR ni recuperación por embeddings. Biblioteca internacional acotada; requiere verificar vigencia y contexto mexicano.
- La vista de prueba oculta soluciones, pero es una herramienta interna compartida, no una plataforma de exámenes con controles antifraude.
- El bucket no sustituye una copia de seguridad de documentos. Definir retención y respaldo antes de almacenar material valioso.
- PostgreSQL tiene backup diario de volumen configurado. No se ha ensayado una restauración completa; rollback de contenedores no revierte datos.
- El límite por IP se aplica por instancia; el límite diario y la capacidad de cola se controlan en PostgreSQL. El despliegue mantiene una réplica por servicio.

## Sistema visual y Storybook

UI independiente basada en componentes oficiales **shadcn/ui**, estilo Radix Nova, React 19 y Tailwind CSS 4. Se incluyen los **63 componentes del registro oficial** consultado el 2026-10-06: 61 actuales más Form y Toast clásicos. Storybook contiene 64 demos: una por componente y una página ENARM de paleta/botones. Los ejemplos oficiales se adaptaron para Vite; no hay dependencia de Next.js ni de College OS.

- Componentes editables: `src/components/ui/`; configuración CLI: `components.json`.
- Colores de la imagen de referencia: fondo `#F7F6F3`, texto `#0E101A`, secundario `#66697F`, borde `#DDDDE3`; azul `#18368E` y foco `#5383EC` inspirados en el logotipo.
- Tokens compartidos por app y Storybook: `src/index.css`. Storybook permite alternar claro/oscuro.
- Acción principal de referencia: `src/components/action-button.tsx`, contorno redondo, etiqueta centrada e icono independiente a la derecha.
- Formulario del POC: controles de 44 px, acciones separadas del selector de documento, columnas adaptables y botones a todo el ancho en móvil.
- El catálogo es demostrativo; sus formularios y notificaciones no llaman a la API. Los componentes de conversación no implican integración con IA.

```sh
npm run build
npx vite preview --host 127.0.0.1 --port 5175
# Otra terminal: todas las stories, interacciones y layout.
node scripts/check-ui.mjs
```

Fuentes: [registro oficial](https://ui.shadcn.com/r/index.json), [instalación Vite](https://ui.shadcn.com/docs/installation/vite), [componentes](https://ui.shadcn.com/docs/components).

## Dependencias de desarrollo

`npm audit --omit=dev` no reporta vulnerabilidades. La auditoría completa reporta avisos transitivos de desarrollo en la CLI de shadcn (braces/fast-glob/ts-morph) y Storybook 8 (uuid). No se aplican las degradaciones mayores propuestas por `npm audit fix --force`. Los paquetes de desarrollo se eliminan de la imagen final.
