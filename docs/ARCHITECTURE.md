# Arquitectura

## Stack

- React + Vite.
- TypeScript estricto.
- PWA con `vite-plugin-pwa` y service worker generado.
- IndexedDB mediante Dexie para datos locales.
- Zod para validar entradas e importaciones futuras.
- Vitest para logica financiera y Playwright para flujos principales.

## Modelo local inicial

- `PaymentMethod`: nombre, tipo, color, ultimos cuatro digitos opcional y activo.
- `Category`: nombre, icono textual, color, tipos permitidos, limite opcional y activo.
- `Transaction`: tipo, importe en centimos, comercio, fecha local, metodo, categoria, nota, estado y ciclo.

Los importes se almacenan como enteros en centimos. Las fechas de movimientos usan formato `YYYY-MM-DD` y los calculos de ciclo se hacen con fecha local al mediodia para evitar desplazamientos por zona horaria.

## Privacidad

No hay backend, analitica ni SDKs externos. Los datos quedan en IndexedDB del navegador. No se deben versionar exportaciones reales ni fixtures con datos sensibles.

## Extension futura

Capacitor debe envolver la PWA sin romper la capa de dominio. App Intents, Atajos, notificaciones locales, Face ID/PIN, widgets y Apple Watch viven en la fase nativa y requieren macOS, cuenta Apple Developer y pruebas en dispositivo fisico.
