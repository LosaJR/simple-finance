# Simple Finance Agent Notes

Antes de cualquier bloque de trabajo lee estos archivos: `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` y `docs/PROJECT_STATUS.md`. Revisa tambien los issues abiertos de GitHub cuando `gh` este autenticado.

## Principios

- Trabaja en ramas pequeñas `feature/...` o `fix/...` y abre pull request a `main` cuando sea posible.
- No guardes secretos, tokens, exportaciones reales ni datos financieros en Git.
- La app inicial es una PWA privada para iPhone. No prometas capacidades nativas hasta probarlas en dispositivo real.
- Usa TypeScript estricto, importes en centimos enteros, IndexedDB con Dexie y validacion con Zod.
- Mantén la interfaz como herramienta financiera densa y clara. La primera pantalla debe ser la app funcional.
- Al cerrar un bloque, actualiza `docs/PROJECT_STATUS.md` y la documentacion afectada.

## Comandos utiles

- `pnpm dev`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `pnpm e2e`
- `pnpm run validate`

## Bloqueos conocidos

- Capacitor/iOS nativo, App Intents, Face ID, notificaciones locales fiables y TestFlight requieren macOS, cuenta Apple Developer y pruebas en iPhone fisico.
- La PWA no puede leer Apple Pay ni Wallet.
- La PWA no garantiza avisos locales con la app cerrada sin un servicio adicional.
