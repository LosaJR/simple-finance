# Estado del proyecto

Fecha: 2026-09-10

## Estado actual

Fase 0 lista para revision en PR #12: https://github.com/LosaJR/simple-finance/pull/12

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, Serena, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Base local creada en la rama `feature/fase-0-base` con primera experiencia funcional para registrar movimientos en IndexedDB. La correccion de prueba iPhone elimina la dependencia de `crypto.randomUUID` en HTTP local, incorpora tarjetas, comercio manual opcional y filtros de actividad. La interfaz se ha separado en Resumen, Registrar, Actividad y Tarjetas, con navegacion inferior y una textura local comprimida coherente con los modos claro y oscuro. Repositorio privado creado en GitHub como `LosaJR/simple-finance`.

## Siguiente tarea

Revisar desde iPhone fisico la navegacion, el guardado y los dos temas del PR #12. Despues abordar Fase 1 con CRUD completo de tarjetas y categorias.

## Verificaciones

- `pnpm run validate`: correcto tras la reorganizacion de navegacion y material visual.
- GitHub Actions `validate` en PR #12: correcto.
- Serena `project health-check`: correcto con salida UTF-8.
- Registro de movimiento: verificado contra un origen HTTP de red local sin `crypto.randomUUID`; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.

## Bloqueos

- Capacidades iOS nativas bloqueadas hasta disponer de macOS, firma Apple y dispositivo fisico.
- Despliegue privado se evaluara en Fase 6.
