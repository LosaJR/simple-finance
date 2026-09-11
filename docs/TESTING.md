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
- En Resumen, abrir el selector de año y mes, elegir septiembre y comprobar que el gráfico y las categorías se actualizan sin abrir Actividad.
- Pulsar una categoría de Resumen y comprobar que solo se despliegan sus gastos del ciclo seleccionado justo debajo de esa categoría, con apertura suave y cierre al pulsarla de nuevo.
- Configurar un límite mensual de prueba en una categoría y comprobar que solo cambia el importe, porcentaje y barra de consumo de esa categoría en Resumen.
- Activar tema oscuro y revisar que no hay texto cortado.
- Recargar la aplicación y confirmar que inicia directamente en modo noche; cambiar a claro desde Configuración y comprobar que sigue disponible.
- Revisar el logo compacto, la ilustración integrada en superficies translúcidas y el fondo en modo claro y noche; confirmar que campos, cifras y botones conservan contraste.
- Registrar un comercio ficticio con `Recordar esta categoría` activado y comprobar que el siguiente registro sugiere esa categoría sin guardar nada automáticamente.
- Guardar dos movimientos idénticos de prueba y comprobar que el segundo solicita confirmación.
- Añadir un pago recurrente, comprobar que aparece como previsto y registrarlo manualmente; confirmar que adelanta la siguiente fecha una sola vez.
- Buscar actividad por comercio, filtrar por categoría y activar `Solo pendientes`; limpiar filtros al terminar.
- Exportar un CSV y una copia JSON de datos ficticios; probar restauración solo en un perfil de prueba, pues reemplaza los datos locales.
- Activar `Contraste reforzado` desde Configuración y comprobar que límites, pendientes y acciones conservan texto explicativo.
- Desde `Datos locales`, cargar datos de demostración y comprobar que hay actividad entre enero y la fecha actual, con importes y comercios claramente marcados como `Demostración`; después usar `Quitar datos` y confirmar que solo se eliminan esos movimientos.

No capturar ni adjuntar datos financieros reales en incidencias.
