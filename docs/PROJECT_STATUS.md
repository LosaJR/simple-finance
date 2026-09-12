# Estado del proyecto

Fecha: 2026-09-12

## Estado actual

La rama `feature/flujo-financiero-diario` se ha consolidado como la base aprobada de Simple Finance y se promueve a `main`. Fase 1 queda completada y Fase 2 continúa con límites, ciclos y comprobación privada en iPhone.

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, Serena, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Se consolidó el flujo financiero diario y se mejoró el Resumen con disponible diario, estados explícitos por límite individual (75%, 90% y exceso) y próximos pagos recurrentes. Los pagos futuros se pueden consultar desde el ciclo actual, pero solo se registran al llegar su vencimiento. Las pruebas unitarias cubren la aritmética de disponible diario y los umbrales de límite.

La autenticación con Apple o Google queda registrada para la futura Fase 8. Depende de sincronización remota cifrada, cuentas, recuperación y migración desde IndexedDB; hasta entonces la aplicación conserva el modelo privado por dispositivo.

La rama también incorpora una carga opcional de datos ficticios, identificados como `Demostración`, desde enero hasta el día actual. Genera una nómina de prueba y gastos realistas rotatorios por las categorías activas para revisar gráficos, ciclos y filtros; se puede eliminar sin tocar otros movimientos locales. Los marcadores de cualquier movimiento usan `+` para ingresos y `−` para gastos, en lugar de flechas direccionales. La PWA comprueba y aplica actualizaciones al abrirse, al volver a primer plano y cada hora para evitar que una instalación conserve recursos antiguos.

## Siguiente tarea

Revisar desde Safari en iPhone, con datos móviles, la versión publicada en `https://simple-finance-379.pages.dev`: primer inicio, carga de demostración, disponible diario, estados de límite, pagos recurrentes, registro rápido con regla, aviso de duplicado, pendientes, filtros, exportación/restauración y contraste reforzado.

## Verificaciones

- `pnpm test`, `pnpm lint` y `pnpm build`: correctos el 2026-09-12, incluidos los cálculos de disponible diario y umbrales de límite.
- GitHub Actions `validate` en PR #12: correcto.
- Serena `project health-check`: correcto con salida UTF-8.
- Registro de movimiento, nomina en dia laborable, tarjeta principal, filtro por tarjeta, calendario por ciclos y configuracion con selectores directos: verificados contra un origen HTTP de red local a tamano iPhone; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.
- Cloudflare Pages: desplegado correctamente en `https://simple-finance-379.pages.dev`; queda configurarlo para tomar `main` como rama de producción tras la promoción.

## Bloqueos

- Capacidades iOS nativas bloqueadas hasta disponer de macOS, firma Apple y dispositivo fisico.
- La URL de Pages es pública durante la prueba. No introducir datos financieros reales hasta aplicar un dominio propio y Cloudflare Access.
