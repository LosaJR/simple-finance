# Simple Finance

PWA privada para registrar gastos e ingresos personales en español. La primera version se ejecuta localmente, guarda los datos en IndexedDB del dispositivo y esta preparada para evolucionar hacia Capacitor/iOS cuando exista entorno macOS y cuenta Apple Developer.

## Requisitos

- Node.js 24 LTS o compatible con Vite 8.
- pnpm 11.
- Git y GitHub CLI para trabajo remoto.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Validacion local:

```bash
pnpm lint
pnpm test
pnpm build
```

Todo junto:

```bash
pnpm run validate
```

Prueba e2e:

```bash
pnpm e2e
```

## Estado actual

Fase 0 en curso: base React + Vite, TypeScript estricto, PWA instalable, persistencia local con Dexie, validacion con Zod, pruebas unitarias, Playwright y CI. La experiencia movil ya incluye registro, edicion y eliminacion de movimientos, ciclos entre nominas y configuracion local de tarjetas y categorias.

## Limites actuales

- No hay cuentas, backend, analitica ni sincronizacion.
- La PWA no puede leer Apple Pay ni Wallet.
- Los avisos de sistema fiables y Face ID/PIN quedan para la fase nativa.
- Los datos son locales al dispositivo y se pueden borrar desde el navegador.
