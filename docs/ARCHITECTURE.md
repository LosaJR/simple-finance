# Arquitectura

## Stack

- React + Vite.
- TypeScript estricto.
- PWA con `vite-plugin-pwa` y service worker generado.
- IndexedDB mediante Dexie para datos locales.
- Zod para validar entradas e importaciones futuras.
- Vitest para logica financiera y Playwright para flujos principales.

## Interfaz movil

La interfaz de fase 0 usa navegacion local en el cliente con una barra inferior fija. Las vistas Resumen, Registrar, Actividad y Tarjetas comparten el estado de IndexedDB, pero no se apilan en una pagina unica. Resumen puede abrir un registro rapido como hoja modal sin abandonar el contexto. La superficie usa una textura local comprimida para no penalizar la precache de la PWA.

## Modelo local inicial

- `PaymentMethod`: tarjeta, nombre, color, ultimos cuatro digitos opcional, activa y bandera unica de tarjeta principal. No se modelan cuentas ni efectivo.
- `Category`: nombre, icono textual, color, tipos permitidos, limite opcional y activo.
- `Transaction`: tipo, importe en centimos, comercio, fecha local, metodo, categoria, nota, estado y ciclo.
- `AppSettings`: dia de cobro configurado localmente para el ciclo, la cuenta atras y la futura notificacion nativa.

Los importes se almacenan como enteros en centimos. Las fechas de movimientos usan formato `YYYY-MM-DD` y los calculos de ciclo se hacen con fecha local al mediodia para evitar desplazamientos por zona horaria. El resumen actual calcula el ciclo contra el dia de cobro vigente, mientras que el historial de meses se agrupa por mes natural para una lectura estable.

## Privacidad

No hay backend, analitica ni SDKs externos. Los datos quedan en IndexedDB del navegador. No se deben versionar exportaciones reales ni fixtures con datos sensibles.

## Extension futura

Capacitor debe envolver la PWA sin romper la capa de dominio. App Intents, Atajos, notificaciones locales, Face ID/PIN, widgets y Apple Watch viven en la fase nativa y requieren macOS, cuenta Apple Developer y pruebas en dispositivo fisico. La app nativa expondra un App Intent de registro de movimiento parametrizado para que Atajos pueda invocarlo; los datos de una transaccion solo se aceptaran cuando una fuente autorizada los entregue.
