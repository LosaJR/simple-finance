# Estado del proyecto

Fecha: 2026-09-11

## Estado actual

Fase 0 lista para revision en PR #12: https://github.com/LosaJR/simple-finance/pull/12

Seguimiento visible de fases y porcentajes: https://github.com/LosaJR/simple-finance/issues/13

Proyecto inicializado con React, Vite, TypeScript estricto, Dexie, Zod, PWA, Vitest, Playwright, Serena, GitHub Issues, milestones, GitHub Project y CI.

## Ultima tarea terminada

Base local creada en la rama `feature/fase-0-base` con una experiencia funcional en IndexedDB. La correccion de prueba iPhone elimina la dependencia de `crypto.randomUUID` en HTTP local. La interfaz tiene Resumen desplazable con gráfico circular de gastos, calendario anual que actualiza su propio contenido y detalle expandible por categoría, Registrar compacto, Actividad y Configuracion, registro rapido por pasos, tarjeta principal persistente, categorías con límite mensual individual configurable, filtro por tarjeta, calendario anual por ciclos de nomina etiquetados por su cobro de cierre, edicion y eliminacion por deslizamiento, configuracion de tema y nomina, cuenta atras y registro diferido de nomina en dia laborable. Tarjetas y categorias se eligen desde selectores directos con botones `+` para añadirlas. La capa visual se acota a un lienzo de iPhone para la revision en Codex, con grupos suaves, transiciones breves para superficies que se abren, controles sobrios, desglose de balance, marcadores de ingreso/gasto e iconos de dominio. La identidad visual usa el logo y fondo locales proporcionados, con superficies de cristal translúcidas en tarjetas, campos y navegación, y una paleta azul petróleo y menta adaptada a día y noche. Repositorio privado creado en GitHub como `LosaJR/simple-finance`.

## Siguiente tarea

Revisar desde iPhone fisico el gráfico circular, el selector de mes/año, el detalle por categoría, los límites individuales por categoría, el deslizamiento de movimientos y la barra inferior opaca. Despues completar el CRUD seguro de tarjetas y categorías y los avisos nativos de límites.

## Verificaciones

- `pnpm run validate`: correcto con Resumen por ciclo, detalle por categoría, edicion y eliminacion, nomina en dia laborable y calendario por ciclos.
- GitHub Actions `validate` en PR #12: correcto.
- Serena `project health-check`: correcto con salida UTF-8.
- Registro de movimiento, nomina en dia laborable, tarjeta principal, filtro por tarjeta, calendario por ciclos y configuracion con selectores directos: verificados contra un origen HTTP de red local a tamano iPhone; queda pendiente la confirmacion en iPhone fisico.
- `pnpm e2e`: configurado, pero no ejecutado localmente porque la descarga de navegadores de Playwright desde `cdn.playwright.dev` agoto timeout.

## Bloqueos

- Capacidades iOS nativas bloqueadas hasta disponer de macOS, firma Apple y dispositivo fisico.
- Despliegue privado se evaluara en Fase 6.
