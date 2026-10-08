# Documentación de usuario de Futurum

La aplicación ofrece **Ayuda y FAQ** en `#faq`, un recorrido de cuatro pasos, respuestas desplegables y un PDF descargable de siete páginas.

## Archivos y mantenimiento

- `src/content/help.json`: versión, fecha, enlaces y FAQ compartidas entre la página y el PDF.
- `scripts/build-guide.py`: contenido detallado y composición del documento.
- `output/pdf/futurum-guia-flujo.pdf`: entrega documental.
- `public/docs/futurum-guia-flujo.pdf`: copia distribuida por Vite y el servidor estático de producción.
- `src/features/HelpPage.tsx`: vista de ayuda; disponible también en Storybook.

Al cambiar el funcionamiento, revisar tanto el texto detallado del script como las respuestas compartidas, actualizar versión/fecha en el JSON y regenerar:

```sh
python3 scripts/build-guide.py
npm run typecheck
npm run build
```

La generación necesita ReportLab. Usa Arial en macOS; en otros sistemas configura `FUTURUM_FONT_REGULAR` y `FUTURUM_FONT_BOLD` con rutas a fuentes TTF compatibles. El PDF ya generado se incluye en el repo: la compilación del producto no requiere Python ni ReportLab.

Renderizar el PDF con Poppler y revisar todas las páginas después de editar. El script comprueba el límite vertical de los párrafos; esto no reemplaza la inspección visual. Las FAQ se leen del mismo JSON para evitar divergencia entre la página y el documento. Storybook sirve `public` para que ambos enlaces al PDF funcionen en el catálogo.

## Validación de esta entrega

- Contenido contrastado con los contratos, rutas y pantallas implementadas al 8 de octubre de 2026.
- PDF de siete páginas, texto extraíble, marcadores y fuentes incrustadas; revisadas sus siete páginas renderizadas.
- Copias documental y pública idénticas.
- Descarga desde el botón de la aplicación comprobada en Chrome.
- Ayuda independiente de la API; no hace llamadas al proveedor de IA.

Esta entrega es local. No acredita que Railway ejecute la misma revisión.
