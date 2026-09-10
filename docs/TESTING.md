# Testing

## Automatizado

- `pnpm lint`: reglas estaticas con Oxlint.
- `pnpm test`: Vitest para dinero, ciclos y resumen financiero.
- `pnpm build`: TypeScript y build de Vite/PWA.
- `pnpm e2e`: Playwright con perfil iPhone y escritorio.
- `pnpm run validate`: lint, unit tests y build en un solo paso.

## Manual iPhone Safari

Pendiente de prueba fisica.

Checklist inicial:
- Abrir URL local o privada en Safari.
- Añadir a pantalla de inicio.
- Abrir en modo standalone.
- Crear gasto e ingreso con datos ficticios.
- Deslizar un movimiento de Resumen a la izquierda, editarlo y eliminar un movimiento de prueba.
- Confirmar que la actividad aparece tras cerrar y reabrir.
- Abrir el calendario de Actividad y comprobar que al elegir septiembre se muestra el periodo entre el cobro anterior y el siguiente, incluso cuando el siguiente cobro es el día 1 de octubre.
- Abrir Configuracion, elegir una tarjeta y una categoria directamente, y comprobar que los botones `+` abren su alta.
- Activar tema oscuro y revisar que no hay texto cortado.

No capturar ni adjuntar datos financieros reales en incidencias.
