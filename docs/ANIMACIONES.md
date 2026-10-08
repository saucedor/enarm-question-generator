# Movimiento de ENARM

Implementación local con una dependencia de ejecución compartida: `motion`. Se mantiene shadcn/ui como base de los controles y sus interacciones de teclado/foco.

| Origen | Incorporación | Adaptaciones |
| --- | --- | --- |
| [Magic UI — Number Ticker](https://magicui.design/docs/components/number-ticker) | Indicadores del inicio y del banco; cantidad de preguntas en el resumen. | Formato es-MX, valor final accesible, preferencia de movimiento reducido y actualización a partir del dato real. Código adaptado del registro público. |
| [Motion Primitives — Animated Group](https://motion-primitives.com/docs/animated-group) | Entrada escalonada de indicadores. | Claves estables, desplazamiento corto y sin espera con movimiento reducido. Código adaptado del registro público. |
| [Aceternity — Stateful Button](https://ui.aceternity.com/components/stateful-button) | Patrón de transición entre acción, espera y confirmación. | Implementación local sobre Button de shadcn; estado controlado por la operación. Un handler resuelto no se interpreta automáticamente como éxito. |
| [Aceternity — File Upload](https://ui.aceternity.com/components/file-upload) | Patrón de superficie de carga con respuesta visual y arrastre. | Implementación local; un archivo, controles existentes de tipo/tamaño, botón accesible y bloqueo durante la carga. |
| Motion + CSS existente | Indicador de navegación, selección de formato, transiciones de página, panel del banco, explicaciones de práctica, barras y anillo del dashboard. | Duraciones cortas, sin desmontar páginas a mitad de una petición, sin efectos que oculten respuestas o alteren datos. |

Las licencias MIT de los componentes adaptados están en `docs/licenses/`. Aceternity se usa como referencia de interacción, sin copiar sus componentes Pro. No se incorporaron colecciones enteras ni motores de animación duplicados.

## Comportamiento

- Se respeta `prefers-reduced-motion`; el usuario también puede activar «Reducir movimiento» en la cabecera. La preferencia manual se conserva en este navegador.
- La preferencia alcanza los overlays renderizados en portales, además del contenido principal.
- Las actualizaciones periódicas no reinician las entradas de las tarjetas.
- Los contadores son decorativos: tecnologías de asistencia reciben el valor real, no valores intermedios.
- La carga permite seleccionar o arrastrar un único PDF/TXT y conserva la validación del servidor.
- Las animaciones de entrada no agregan tiempos de espera a las operaciones del servidor.
- El Storybook `ENARM/Movimiento/Interacciones` permite repetir la entrada, cambiar indicadores, probar guardado y movimiento reducido sin llamadas a la API.

## Alcance

No se añaden fondos en bucle, cursores personalizados, confeti ni efectos sobre el texto clínico. Las animaciones acompañan navegación, controles y cambios de estado. Estos cambios se preparan en local; no implican despliegue a Railway.

## Verificación local (8 de octubre de 2026)

Recorrido en Chrome sobre datos sintéticos: contadores con valores intermedios y final correcto, preferencia reducida inmediata y persistente, cambios de formato, archivo vacío rechazado, TXT válido extraído, solicitud completada, edición guardada y recuperada al recargar, práctica calificada y explicaciones posteriores al envío. El diálogo devuelve el foco al botón de revisión tras Escape. El laboratorio confirma el botón deshabilitado durante la espera y habilitado al finalizar. Dashboard sin desbordamiento a 320 px. La selección de archivos se verificó en navegador; el gesto de arrastrar un archivo desde el sistema no formó parte del recorrido automatizado.

`npm run verify`: typecheck, 16 pruebas y builds de aplicación/Storybook. La auditoría de dependencias de producción no reportó vulnerabilidades. Se mantienen advertencias de tamaño de bundles de Storybook.
