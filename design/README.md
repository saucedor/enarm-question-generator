# Propuestas de UI ENARM — revisión local

Mockups para aprobación, creados el 7 de octubre de 2026. Están aislados en `design/` y no sustituyen la aplicación ni forman parte de la entrada de producción. Usan datos ilustrativos y no llaman a una API ni consumen crédito de IA.

## Abrir y comparar

- A, Estudio: http://127.0.0.1:5174/design/mockups.html?v=a
- B, Guiado: http://127.0.0.1:5174/design/mockups.html?v=b
- Banco: http://127.0.0.1:5174/design/mockups.html?view=bank
- Interfaz actual local: http://127.0.0.1:5174/

El selector superior cambia entre A y B conservando los parámetros. Los enlaces con parámetros abren una sesión nueva del mockup.

## Dirección visual

Las tres referencias comparten navegación lateral, superficies claras, tarjetas redondeadas, azul para la jerarquía y separación entre contenido principal e información contextual.

| Referencia | Aplicación al mockup |
| --- | --- |
| MediKit | Sidebar claro, bloques blancos sobre fondo suave, jerarquía de títulos y pequeños acentos pastel. |
| Drive | Sidebar azul de B; banco organizado como tabla con búsqueda y estados, en lugar de apilar resultados extensos. |
| Medcare | Panel contextual derecho, módulos redondeados y cabecera azul tenue de B. |

Se conserva la dirección azul, tinta oscura y fondos claros de la referencia previa de Futurum. Los gráficos y perfiles de las referencias no se trasladan al generador porque no ayudan a configurar una solicitud.

**A — Estudio, recomendada:** una columna principal dividida en Contenido, Estructura y Fuentes; resumen lateral sticky; sidebar sticky en escritorio. Facilita revisar y modificar parámetros sin cambiar de pantalla. Ocupa más altura.

**B — Guiado:** los mismos campos en tres pasos con progreso visible y resumen lateral. Reduce las decisiones simultáneas y ayuda al primer uso, a cambio de más navegación.

**Banco compartido:** lista de conjuntos, búsqueda, estado textual y vista previa lateral. Las cifras son ejemplos, no métricas reales. La edición y la práctica quedan pendientes de una dirección visual aprobada.

## Prácticas consultadas

- [NN/g: Website Forms Usability](https://www.nngroup.com/articles/web-form-design/): una columna de lectura, etiquetas visibles, agrupación lógica y opciones visibles para elecciones cortas. Sólo cantidad/opciones, estrechamente relacionadas, comparten fila.
- [W3C: Grouping Controls](https://www.w3.org/WAI/tutorials/forms/grouping/): grupos relacionados con `fieldset` y `legend`; etiquetas asociadas a controles.
- [GOV.UK: Check answers](https://design-system.service.gov.uk/patterns/check-answers/): resumen editable antes de enviar. El mockup permite revisar los parámetros y volver a editarlos.
- [W3C: User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/): mensajes explícitos de error y confirmación, sin depender sólo del color.

## Componentes y comportamiento

Se reutilizan los componentes shadcn existentes: Button, Input, Textarea, Label, RadioGroup y Dialog. Los selectores de estas propuestas son HTML nativos; su integración final con el catálogo shadcn se decidirá al implementar la propuesta aprobada.

Funcionan los cambios de formato, el cálculo de preguntas seriadas, el resumen, la navegación por pasos, la búsqueda del banco, la selección de filas y la revisión previa. El selector de archivos sólo muestra el nombre local: no lee ni envía el contenido. El envío final es una simulación. Las referencias bibliográficas mostradas son contenido ilustrativo de UI, no una recomendación clínica verificada.

## Verificación realizada

- Escritorio a 1440 × 1050: ambas variantes y vista del banco.
- Móvil a 390 × 844: formulario guiado y banco; corregido desbordamiento de la cabecera accesible de la tabla. El documento queda en 390 px y la tabla tiene su propio scroll.
- Recorrido de tres pasos y revisión: dos casos por tres preguntas se resumen como seis; confirmación simulada visible.
- Tema vacío: error explícito y foco devuelto al campo.
- Sin errores nuevos de consola después de separar la entrada React del componente para evitar recrear la raíz durante HMR.

Capturas en `previews/`: `a-estudio.png`, `b-guiado.png`, `banco.png` y `movil.png`. Es una comprobación del prototipo, no una auditoría completa de accesibilidad.

## Ejecutar el mockup

Desde la raíz del repo, con Node 24:

```sh
npm run dev:web -- --port 5174 --strictPort
```

Los mockups funcionan sin backend. Para esta revisión también quedó levantada la interfaz actual con el servidor de demostración `test/support/ui-server.ts`, una base de datos local exclusiva `enarm_design_20261007_ui_test`, almacenamiento en memoria y generador sintético. No usa la infraestructura ni las credenciales de producción. Ese servidor de pruebas reinicia sus fixtures; debe apuntar siempre a una base de pruebas exclusiva.

## Decisión aprobada

El usuario aprobó A, Estudio. Aplicada a la interfaz local: navegación, formulario con resumen y revisión previa, banco con tabla y vista lateral. Los bloques compartidos se documentan en Storybook, ENARM/Estudio. Se mantienen los mockups como referencia de diseño. No se realizó despliegue ni se modificó College OS.
