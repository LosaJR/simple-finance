# Estado del proyecto

Fecha: 2026-09-13

## Estado actual

`main` publica Simple Finance v1.14 / 1.14.0. Fases 1 a 4 están completadas; Fases 5 y 6 quedan pendientes de comprobación en dispositivos físicos. Android será la primera distribución nativa mediante Google Play; iOS queda como puente posterior dependiente de entorno Apple.

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Se publicó v1.14 / 1.14.0 el 2026-09-14. Restaura el orden previsto de Actividad: pestañas de tipo, filtros compactos, evolución por ciclos y, por último, movimientos. La causa fue un contenedor semántico añadido durante la auditoría de accesibilidad que anulaba los órdenes de composición móvil; se retiró sin afectar los datos ni los cálculos. `pnpm run validate`, CI y el despliegue de GitHub Pages terminaron correctamente. La URL pública con `?release=v1.14-activity-order` confirmó la nueva versión visible.

Se inicia la Fase 5 de calidad privada. El checklist de Safari en iPhone incorpora la comprobación de gastos situados al inicio y final de un ciclo que cruza mes, y confirma que Ajustes solo expone el día de cobro como delimitador automático.

La plantilla de incidencias privada ya solicita entorno, versión visible, modo de apertura, pasos, resultado esperado/observado y contexto del ciclo cuando corresponda. Obliga a confirmar que se usan datos ficticios, para poder reproducir errores de PWA sin exponer información financiera.

La auditoría de accesibilidad de Actividad completa la relación semántica entre sus pestañas y el contenido filtrado: lectores de pantalla reciben ahora el panel activo y se evita que pestañas inactivas entren en el orden de tabulación.

La validación automática local (lint, 18 pruebas unitarias y build) termina correctamente. El E2E queda preparado pero no se pudo ejecutar en este equipo porque la descarga de navegadores de Playwright agotó el tiempo de red; el procedimiento de instalación y la comprobación de teclado quedan documentados en el checklist.

El extracto de una categoría sitúa ahora la fecha compacta al inicio de la fila, antes del signo y el importe. Registrar aplica reglas específicas de WebKit para que el valor del selector nativo de fecha se alinee a la izquierda en iPhone.

La evolución de Actividad muestra los importes de cada barra siempre con céntimos exactos, sin redondeo. Al elegir un ciclo, un resumen persistente identifica el mes, su intervalo efectivo y los totales de ingresos y gastos; la barra activa también refuerza su contorno.

Se eliminó el cierre manual de ciclos de Ajustes y del modelo local. Los ciclos se delimitan exclusivamente entre fechas efectivas de cobro configuradas por cada persona; si existen cierres manuales de una versión anterior, se retiran al abrir la app y los movimientos asociados se devuelven automáticamente a su ciclo de nómina correspondiente.

Inicio alinea las tres métricas de disponibilidad por filas fijas de encabezado, importe y detalle, incluso cuando un texto ocupa más líneas. En Registrar, Fecha y Tarjeta utilizada se muestran como controles de ancho completo para evitar que el selector nativo de fecha sobresalga de la cuadrícula móvil.

Se normalizaron las alturas, el interlineado y los límites de ancho de los controles móviles. Registrar ya no muestra el aviso inicial de almacenamiento local, ajusta el selector de tipo a sus dos acciones y mantiene el campo de fecha dentro de la cuadrícula. La selección de ciclos no desplaza la gráfica fuera de su espacio y las acciones de Categorías se alinean con el selector.

La eliminación de categorías usa ahora una confirmación dentro de la hoja de Configuración, en lugar de depender de un diálogo del navegador que podía no aparecer en la PWA. Los errores se muestran en esa misma hoja. La operación retira la categoría de uso futuro y conserva el histórico de movimientos.

El extracto desplegable de una categoría en Inicio muestra ahora la fecha compacta junto al importe (`−12,50 € · 01/09`) y deja el texto secundario reservado a categoría y tarjeta. La evolución de Actividad etiqueta cada ciclo con sus importes de ingresos y gastos, y elimina el control redundante de extracto: pulsar de nuevo el ciclo activo restaura todos los movimientos.

Actividad prioriza ahora el filtro de tipo, los filtros compactos en orden tarjeta, categoría y búsqueda, la evolución y, finalmente, los movimientos. Los campos táctiles usan 16 px en móvil para evitar el zoom automático de Safari. Inicio sustituye el nombre Resumen, elimina mensajes redundantes del gráfico y traslada Deshacer movimiento a Registrar. Configuración reduce Tarjetas a selector y alta modal, concentra crear, editar o eliminar categorías en hojas modales y deja Automatización centrada en pagos recurrentes.

Los filtros compactos de Actividad (tarjeta, búsqueda y categoría) eliminan su relleno interior para integrarse visualmente con la vista sin perder borde ni foco accesible.

La publicación móvil usa GitHub Pages en `https://losajr.github.io/simple-finance/`. El repositorio permanece público durante el desarrollo para permitir esta modalidad; la PWA adapta su ruta base, manifiesto y service worker para funcionar desde `/simple-finance/`.

Inicio muestra la versión visible `v1.13` junto a la marca. Se corresponde con la versión técnica `1.13.0`; el despliegue de GitHub Pages del 2026-09-13 se completó correctamente y la URL pública con `?release=v1.13` confirmó la versión visible y la retirada de `Reiniciar ciclo hoy` de Ajustes.

Se corrigió el bloqueo de actualización heredado en PWA: el service worker entrante usa ahora activación y toma de control inmediatas. Esto permite sustituir una instalación anterior que detectaba actualizaciones pero las dejaba esperando.

Se reforzó la actualización de la PWA instalada. Al descargar una versión nueva, el navegador recibe ahora una orden explícita para activar el service worker en espera y recargar la interfaz, en vez de depender de que iOS cierre todas las instancias antiguas por su cuenta.

Se corrigió la composición móvil de Registrar y Actividad. Registrar reserva espacio real tras el formulario para que Guardar movimiento quede siempre por encima de la navegación inferior. Actividad reúne el calendario dentro del encabezado de Evolución reciente, hace mucho más evidente el ciclo seleccionado, reduce los filtros de tarjeta, búsqueda y categoría a una única fila compacta y elimina el control visible de Solo pendientes.

Se inició la Fase 4 con una evolución visual en Actividad. Resume hasta seis ciclos recientes con barras de ingresos y gastos, comunica la variación del gasto frente al ciclo anterior y permite abrir el extracto del ciclo al tocar su barra. La agregación por ciclos y los casos de nómina se cubren con pruebas unitarias.

Se reordenó la estrategia nativa: Android será la primera plataforma publicada y de pruebas, usando Capacitor sobre la misma interfaz React y la misma lógica financiera local. La capa iOS conserva sus capacidades exclusivas como trabajo posterior. La publicación Android requerirá Android Studio, firma, cuenta de Google Play, una política de privacidad y pruebas físicas antes de habilitar funcionalidades nativas o automatizaciones.

Se simplificó la composición visual de las cuatro vistas. Actividad y Configuración financiera ya no usan un recuadro exterior; sus grupos se delimitan por espaciado y separadores. Las secciones de categorías del Resumen también pasan a ser un bloque abierto, mientras que nómina, gráfico y formulario de registro conservan una superficie por ser herramientas focales. Se establecieron márgenes móviles compartidos, una escala tipográfica estable y una separación vertical consistente entre secciones.

Se aclaró la separación entre Ajustes y Configuración financiera. El botón superior usa ahora un engranaje y abre Ajustes: tema, contraste, nómina y datos locales (exportación, restauración y demostración). La pestaña inferior conserva solo tarjetas, categorías, reglas por comercio y pagos recurrentes.

Se aplicó el primer pase de calidad UX/UI derivado de la auditoría. Los controles de interacción principal cumplen un objetivo táctil mínimo de 44 px, el modo claro refuerza el contraste de texto secundario, acciones y errores sobre superficies translúcidas, y Configuración se organiza en Base financiera y Automatización. Los paneles de registro rápido, edición y ajustes retienen el foco, admiten `Escape` y lo devuelven al control de origen al cerrarse.

Los guardados de movimientos, nómina y pagos recurrentes comunican `Guardando...` y bloquean dobles pulsaciones. Borrar reglas por comercio y pagos recurrentes exige confirmar la acción y aclara qué información histórica permanece. El Resumen muestra el intervalo efectivo de cada ciclo entre fechas de cobro, además de su etiqueta mensual.

Se consolidó el flujo financiero diario y se mejoró el Resumen con disponible diario, estados explícitos por límite individual (75%, 90% y exceso) y próximos pagos recurrentes. Los pagos futuros se pueden consultar desde el ciclo actual, pero solo se registran al llegar su vencimiento. Las pruebas unitarias cubren la aritmética de disponible diario y los umbrales de límite.

La autenticación con Apple o Google queda registrada para la futura Fase 8. Depende de sincronización remota cifrada, cuentas, recuperación y migración desde IndexedDB; hasta entonces la aplicación conserva el modelo privado por dispositivo.

La rama también incorpora una carga opcional de datos ficticios, identificados como `Demostración`, desde enero hasta el día actual. Genera una nómina de prueba y gastos realistas rotatorios por las categorías activas para revisar gráficos, ciclos y filtros; se puede eliminar sin tocar otros movimientos locales. Los marcadores de cualquier movimiento usan `+` para ingresos y `−` para gastos, en lugar de flechas direccionales. La PWA comprueba y aplica actualizaciones al abrirse, al volver a primer plano y cada hora para evitar que una instalación conserve recursos antiguos.

## Siguiente tarea

Confirmar desde Safari en iPhone y desde un dispositivo Android la versión publicada en `https://losajr.github.io/simple-finance/`: instalación de la PWA, navegación inferior, apertura/cierre de hojas, registro rápido, edición, ciclos por día de cobro, controles táctiles y actualización automática. Tras esa comprobación, preparar el checklist privado de la Fase 5 y decidir el siguiente bloque de estadísticas detalladas.

## Verificaciones

- `pnpm run validate`: correcto antes de publicar v1.14 (lint, 18 pruebas y build).
- `pnpm run validate`: correcto antes de publicar v1.13 (lint, 18 pruebas y build).
- `pnpm run validate`: correcto antes de publicar v1.12 (lint, 19 pruebas y build).
- `pnpm test`, `pnpm lint` y `pnpm build`: correctos el 2026-09-12, incluidos los cálculos de disponible diario y umbrales de límite.
- GitHub Actions `validate` en PR #12: correcto.
- Registro de movimiento, nomina en dia laborable, tarjeta principal, filtro por tarjeta, calendario por ciclos y configuracion con selectores directos: verificados contra un origen HTTP de red local a tamano iPhone; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.
- GitHub Pages: desplegado correctamente en `https://losajr.github.io/simple-finance/` desde `main`; los despliegues automáticos de producción están activados.
- Auditoría UX/UI: completada el 2026-09-12 contra heurísticas de Nielsen, Leyes de UX, guías de Apple y WCAG 2.2. El pase prioritario de contraste, objetivos táctiles, seguridad de acciones, feedback de guardado, foco modal e intervalos de ciclo está incorporado y verificado localmente.

## Bloqueos

- El puente Android requiere Android Studio, cuenta de Google Play, firma y un dispositivo Android físico. Las capacidades iOS nativas siguen bloqueadas hasta disponer de macOS, firma Apple y dispositivo físico.
- La URL de GitHub Pages y el repositorio son públicos temporalmente durante el desarrollo. No introducir datos financieros reales en la instancia publicada.
