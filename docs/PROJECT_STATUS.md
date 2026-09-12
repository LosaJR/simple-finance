# Estado del proyecto

Fecha: 2026-09-12

## Estado actual

La rama `feature/flujo-financiero-diario` se ha consolidado como la base aprobada de Simple Finance y se promueve a `main`. Fase 1 queda completada y Fase 2 continúa con límites, ciclos y comprobación privada en móvil. Android será la primera distribución nativa mediante Google Play; iOS queda como puente posterior dependiente de entorno Apple.

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, Serena, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Se prepara un segundo canal de publicación mediante GitHub Pages, independiente de Cloudflare Pages. La PWA adapta su ruta base, manifiesto y service worker para poder instalarse y actualizarse correctamente desde `/simple-finance/`.

Resumen muestra la versión visible `v1.5` junto a la marca. Se corresponde con la versión técnica `1.5.0` del paquete y sirve para confirmar en móvil que la PWA instalada ha recibido la compilación publicada.

Se corrigió el bloqueo de actualización heredado en PWA: el service worker entrante usa ahora activación y toma de control inmediatas. Esto permite sustituir una instalación anterior que detectaba actualizaciones pero las dejaba esperando.

Se reforzó la actualización de la PWA instalada. Al descargar una versión nueva, el navegador recibe ahora una orden explícita para activar el service worker en espera y recargar la interfaz, en vez de depender de que iOS cierre todas las instancias antiguas por su cuenta.

Se corrigió la composición móvil de Registrar y Actividad. Registrar reserva espacio real tras el formulario para que Guardar movimiento quede siempre por encima de la navegación inferior. Actividad reúne el calendario dentro del encabezado de Evolución reciente, hace mucho más evidente el ciclo seleccionado, reduce los filtros de tarjeta, búsqueda y categoría a una única fila compacta y elimina el control visible de Solo pendientes.

Se inició la Fase 4 con una evolución visual en Actividad. Resume hasta seis ciclos recientes con barras de ingresos y gastos, comunica la variación del gasto frente al ciclo anterior y permite abrir el extracto del ciclo al tocar su barra. La agregación por ciclos y los casos de nómina se cubren con pruebas unitarias.

Se reordenó la estrategia nativa: Android será la primera plataforma publicada y de pruebas, usando Capacitor sobre la misma interfaz React y la misma lógica financiera local. La capa iOS conserva sus capacidades exclusivas como trabajo posterior. La publicación Android requerirá Android Studio, firma, cuenta de Google Play, una política de privacidad y pruebas físicas antes de habilitar funcionalidades nativas o automatizaciones.

Se incorporó el cierre manual de ciclo desde Ajustes. Cierra el extracto con los movimientos del día anterior, inicia uno nuevo en la fecha actual y mantiene el historial disponible. Los cálculos y las copias JSON almacenan estos límites manuales, incluyendo varios cierres dentro del mismo periodo programado. Las pruebas cubren reinicios, mes de febrero, nóminas el día 31 y desplazamientos por fin de semana.

Se simplificó la composición visual de las cuatro vistas. Actividad y Configuración financiera ya no usan un recuadro exterior; sus grupos se delimitan por espaciado y separadores. Las secciones de categorías del Resumen también pasan a ser un bloque abierto, mientras que nómina, gráfico y formulario de registro conservan una superficie por ser herramientas focales. Se establecieron márgenes móviles compartidos, una escala tipográfica estable y una separación vertical consistente entre secciones.

Se aclaró la separación entre Ajustes y Configuración financiera. El botón superior usa ahora un engranaje y abre Ajustes: tema, contraste, nómina y datos locales (exportación, restauración y demostración). La pestaña inferior conserva solo tarjetas, categorías, reglas por comercio y pagos recurrentes.

Se aplicó el primer pase de calidad UX/UI derivado de la auditoría. Los controles de interacción principal cumplen un objetivo táctil mínimo de 44 px, el modo claro refuerza el contraste de texto secundario, acciones y errores sobre superficies translúcidas, y Configuración se organiza en Base financiera y Automatización. Los paneles de registro rápido, edición y ajustes retienen el foco, admiten `Escape` y lo devuelven al control de origen al cerrarse.

Los guardados de movimientos, nómina y pagos recurrentes comunican `Guardando...` y bloquean dobles pulsaciones. Borrar reglas por comercio y pagos recurrentes exige confirmar la acción y aclara qué información histórica permanece. El Resumen muestra el intervalo efectivo de cada ciclo entre fechas de cobro, además de su etiqueta mensual.

Se consolidó el flujo financiero diario y se mejoró el Resumen con disponible diario, estados explícitos por límite individual (75%, 90% y exceso) y próximos pagos recurrentes. Los pagos futuros se pueden consultar desde el ciclo actual, pero solo se registran al llegar su vencimiento. Las pruebas unitarias cubren la aritmética de disponible diario y los umbrales de límite.

La autenticación con Apple o Google queda registrada para la futura Fase 8. Depende de sincronización remota cifrada, cuentas, recuperación y migración desde IndexedDB; hasta entonces la aplicación conserva el modelo privado por dispositivo.

La rama también incorpora una carga opcional de datos ficticios, identificados como `Demostración`, desde enero hasta el día actual. Genera una nómina de prueba y gastos realistas rotatorios por las categorías activas para revisar gráficos, ciclos y filtros; se puede eliminar sin tocar otros movimientos locales. Los marcadores de cualquier movimiento usan `+` para ingresos y `−` para gastos, en lugar de flechas direccionales. La PWA comprueba y aplica actualizaciones al abrirse, al volver a primer plano y cada hora para evitar que una instalación conserve recursos antiguos.

## Siguiente tarea

Confirmar desde Safari en iPhone y desde un dispositivo Android la versión publicada en `https://simple-finance-379.pages.dev`: instalación de la PWA, navegación inferior, apertura/cierre de hojas, registro rápido, edición, cierre manual de ciclo, controles táctiles y actualización automática. Tras esa comprobación, preparar el checklist privado de la Fase 5 y decidir el siguiente bloque de estadísticas detalladas.

## Verificaciones

- `pnpm test`, `pnpm lint` y `pnpm build`: correctos el 2026-09-12, incluidos los cálculos de disponible diario y umbrales de límite.
- GitHub Actions `validate` en PR #12: correcto.
- Serena `project health-check`: correcto con salida UTF-8.
- Registro de movimiento, nomina en dia laborable, tarjeta principal, filtro por tarjeta, calendario por ciclos y configuracion con selectores directos: verificados contra un origen HTTP de red local a tamano iPhone; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.
- Cloudflare Pages: desplegado correctamente en `https://simple-finance-379.pages.dev` desde `main`; los despliegues automáticos de producción están activados.
- Auditoría UX/UI: completada el 2026-09-12 contra heurísticas de Nielsen, Leyes de UX, guías de Apple y WCAG 2.2. El pase prioritario de contraste, objetivos táctiles, seguridad de acciones, feedback de guardado, foco modal e intervalos de ciclo está incorporado y verificado localmente.

## Bloqueos

- El puente Android requiere Android Studio, cuenta de Google Play, firma y un dispositivo Android físico. Las capacidades iOS nativas siguen bloqueadas hasta disponer de macOS, firma Apple y dispositivo físico.
- La URL de Pages es pública durante la prueba. No introducir datos financieros reales hasta aplicar un dominio propio y Cloudflare Access.
