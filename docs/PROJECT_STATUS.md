# Estado del proyecto

Fecha: 2026-09-12

## Estado actual

Fase 0 lista para revision en PR #12: https://github.com/LosaJR/simple-finance/pull/12. Las mejoras de flujo diario estan disponibles para comparacion en la rama `feature/flujo-financiero-diario` (commit `8ae5641`) y todavia no modifican la rama base.

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, Serena, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Rama experimental `feature/flujo-financiero-diario` creada desde la base de Fase 0. Añade reglas locales por comercio, comprobacion de posibles duplicados, estado pendiente revisable, pagos recurrentes que requieren confirmacion explicita, disponible estimado del ciclo, filtro por texto/categoria/pendiente, edicion y archivado seguro de tarjetas y categorias, copia JSON validada y CSV. El tema noche y el contraste reforzado se guardan en el dispositivo. La aplicacion sigue siendo una PWA local: no recibe notificaciones, Apple Pay, Wallet ni datos de Atajos automaticamente.

La rama también incorpora una carga opcional de datos ficticios, identificados como `Demostración`, desde enero hasta el día actual. Genera una nómina de prueba y gastos realistas rotatorios por las categorías activas para revisar gráficos, ciclos y filtros; se puede eliminar sin tocar otros movimientos locales. Los marcadores de cualquier movimiento usan `+` para ingresos y `−` para gastos, en lugar de flechas direccionales. La PWA comprueba y aplica actualizaciones al abrirse, al volver a primer plano y cada hora para evitar que una instalación conserve recursos antiguos.

## Siguiente tarea

Revisar desde Safari en iPhone, con datos móviles, la rama experimental publicada en `https://simple-finance-379.pages.dev`: primer inicio, carga de demostración, registro rápido con regla, aviso de duplicado, pendientes, recurrentes, filtros, exportación/restauración y contraste reforzado.

## Verificaciones

- `pnpm run validate`: correcto con Resumen por ciclo, detalle por categoría, edicion y eliminacion, nomina en dia laborable y calendario por ciclos.
- GitHub Actions `validate` en PR #12: correcto.
- Serena `project health-check`: correcto con salida UTF-8.
- Registro de movimiento, nomina en dia laborable, tarjeta principal, filtro por tarjeta, calendario por ciclos y configuracion con selectores directos: verificados contra un origen HTTP de red local a tamano iPhone; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.
- Cloudflare Pages: desplegado correctamente desde `feature/flujo-financiero-diario` en `https://simple-finance-379.pages.dev`; la respuesta HTTPS, la carga de la PWA y la ausencia de errores de consola se comprobaron el 2026-09-12.

## Bloqueos

- Capacidades iOS nativas bloqueadas hasta disponer de macOS, firma Apple y dispositivo fisico.
- La URL de Pages es pública durante la prueba. No introducir datos financieros reales hasta aplicar un dominio propio y Cloudflare Access.
