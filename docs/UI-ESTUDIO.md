# UI Estudio — propuesta A

Dirección aprobada por el usuario e implementada sólo en local (7 de octubre de 2026).

- Navegación lateral blanca que permanece visible en escritorio; menú desplegable en móvil.
- Formulario en tres bloques: contenido clínico, estructura y fuentes. Controles shadcn, opciones visibles para formato/dificultad/origen y campos opcionales agrupados.
- Resumen lateral de parámetros y diálogo previo a generar. El envío conserva su clave de idempotencia, validaciones y seguimiento del trabajo.
- Documentos, selección de bibliografía, descarga y errores de extracción se conservan.
- Borrador persistente: el total seriado se normaliza al guardar, evitando perder el borrador al recargar.
- Banco como tabla con búsqueda, paginación y vista previa. Los contadores corresponden a la página y filtro actuales; no se presentan como totales globales.
- Componentes compartidos en `src/components/studio.tsx`; historias en `ENARM/Estudio`. Paleta compartida con Storybook.

## Validación

`npm run verify`: TypeScript, 12 pruebas (12 aprobadas), compilación de app y Storybook. Se actualizaron los selectores del recorrido existente `scripts/clinical-ui.mjs`; el recorrido de este cambio se verificó manualmente mediante automatización del navegador.

En el navegador local se comprobaron: carga de TXT sintético, extracción, revisión de parámetros, envío, finalización de generación sintética y apertura del conjunto; cambio a seriadas y persistencia de 2 × 3 tras recargar; búsqueda vacía del banco, vista previa del conjunto guardado, navegación móvil, ancho de 390 px sin desbordamiento del documento y sidebar visible al desplazar el formulario de escritorio.

La revisión del banco detectó y corrigió una suposición incorrecta: `/api/sets` devuelve metadatos, no fuentes completas. El tipo de la respuesta se acotó y la vista previa usa únicamente campos disponibles.

Capturas locales: `artifacts/studio-implemented.png`, `artifacts/studio-bank.png`, `artifacts/studio-mobile.png`. El backend local es el harness sintético aislado: no se consumió IA. No se desplegó a Railway ni se modificó College OS.

## Revisar

- App: http://127.0.0.1:5174/#new
- Banco: http://127.0.0.1:5174/#bank
- Storybook: http://127.0.0.1:6006/?path=/story/enarm-estudio--composicion

La compilación de Storybook conserva el aviso no bloqueante de bundles mayores de 500 kB.
