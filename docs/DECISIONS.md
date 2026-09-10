# Decisiones

## 2026-09-10 - PWA local primero

Se inicia como PWA React + Vite instalable para validar el producto en iPhone sin depender de App Store, backend ni cuentas.

## 2026-09-10 - Datos en centimos

Los importes se almacenan como enteros en centimos para evitar errores de coma flotante en calculos financieros.

## 2026-09-10 - Dexie + Zod

Dexie cubre IndexedDB con una API mantenible y Zod permite validar formularios e importaciones futuras antes de escribir datos.

## 2026-09-10 - Tema profesional de herramienta

La interfaz prioriza densidad, claridad y lectura rapida sobre una landing page o elementos decorativos.

## 2026-09-10 - Tarjetas como unico metodo de pago

El producto inicial representa solo tarjetas: una tarjeta principal y tarjetas adicionales. No se incorporan cuentas ni efectivo a este flujo.

## 2026-09-10 - Captura automatica mediante Atajos nativos

El registro manual conserva un comercio opcional como respaldo. La futura app iOS expondra un App Intent para que Atajos pueda registrar un movimiento con parametros. El disparador de Wallet puede iniciar una automatizacion al usar una tarjeta, pero no se asumira que aporta importe o comercio hasta probarlo en iPhone.
