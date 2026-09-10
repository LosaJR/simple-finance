# Arquitectura

## Stack

- React + Vite.
- TypeScript estricto.
- PWA con `vite-plugin-pwa` y service worker generado.
- IndexedDB mediante Dexie para datos locales.
- Zod para validar entradas e importaciones futuras.
- Vitest para logica financiera y Playwright para flujos principales.

## Interfaz movil

La interfaz de fase 0 usa navegacion local en el cliente con una barra inferior fija. Las vistas Resumen, Registrar, Actividad y Configuracion comparten el estado de IndexedDB, pero no se apilan en una pagina unica. Resumen puede abrir un registro rapido como hoja modal sin abandonar el contexto y permite editar o eliminar sus ultimos movimientos mediante deslizamiento. La superficie usa una textura local comprimida para no penalizar la precache de la PWA.

## Modelo local inicial

- `PaymentMethod`: tarjeta, nombre, color, ultimos cuatro digitos opcional, activa y bandera unica de tarjeta principal. No se modelan cuentas ni efectivo.
- `Category`: nombre, icono textual, color, tipos permitidos, límite mensual opcional y activo.
- `Transaction`: gasto o ingreso, importe en centimos, comercio, fecha local, metodo, categoria, estado, ciclo y origen manual o nomina.
- `AppSettings`: dia de cobro, cantidad de nomina y ciclos cuya nomina automatica fue eliminada localmente. Determinan el ciclo, la cuenta atras y el registro diferido de nomina.

Los importes se almacenan como enteros en centimos. Las fechas de movimientos usan formato `YYYY-MM-DD` y los calculos de ciclo se hacen con fecha local al mediodia para evitar desplazamientos por zona horaria. El resumen actual calcula el ciclo contra el dia de cobro vigente y desplaza un cobro de fin de semana al lunes. Agrupa los gastos por categoría para el gráfico circular y el consumo del límite. El calendario anual agrupa el historial por ciclos delimitados por esas fechas efectivas y etiqueta cada uno por su ultimo dia antes del siguiente cobro: el intervalo 25 de agosto a 25 de septiembre, y el de 1 de septiembre a 1 de octubre, se registran como septiembre. El borrado de una nomina automatica marca su ciclo para que no reaparezca en la siguiente carga.

## Privacidad

No hay backend, analitica ni SDKs externos. Los datos quedan en IndexedDB del navegador. No se deben versionar exportaciones reales ni fixtures con datos sensibles.

## Extension futura

Capacitor debe envolver la PWA sin romper la capa de dominio. App Intents, Atajos, notificaciones locales, Face ID/PIN, widgets y Apple Watch viven en la fase nativa y requieren macOS, cuenta Apple Developer y pruebas en dispositivo fisico. La app nativa expondra un App Intent de registro de movimiento parametrizado para que Atajos pueda invocarlo; los datos de una transaccion solo se aceptaran cuando una fuente autorizada los entregue.
