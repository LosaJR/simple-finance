# Despliegue remoto de prueba

## Objetivo

Permitir abrir Simple Finance desde Safari en iPhone con una URL HTTPS estable, sin depender de la red Wi-Fi ni de que el ordenador local permanezca encendido.

## Opcion elegida

Cloudflare Pages con integración GitHub.

- El repositorio `LosaJR/simple-finance` puede continuar privado.
- El despliegue compila la PWA estática y la publica en una URL `*.pages.dev`.
- Cada `push` a la rama elegida actualiza la aplicación automáticamente.
- No se suben movimientos, copias JSON ni secretos: los datos continúan en IndexedDB del navegador de cada dispositivo.

Para la prueba actual, configurar como rama de producción `feature/flujo-financiero-diario`. De ese modo la URL remota muestra la versión experimental y la rama base no cambia. Cuando la revisión esté aprobada, se cambiará la producción a `main` o se fusionará la rama.

## Configuracion inicial

La persona propietaria debe crear o abrir una cuenta de Cloudflare y autorizar la aplicación `Cloudflare Workers and Pages` en GitHub limitada solo a este repositorio. No guardar tokens de Cloudflare ni credenciales en el repositorio.

En Cloudflare:

1. Abrir `Workers & Pages` y elegir `Create application` > `Pages` > `Connect to Git`.
2. Elegir el repositorio privado `LosaJR/simple-finance`.
3. Definir un nombre como `simple-finance-preview`.
4. Elegir `feature/flujo-financiero-diario` como rama de producción.
5. Usar Node.js `24` y estos valores de compilación:

```text
Build command: corepack enable && pnpm install --frozen-lockfile && pnpm run build
Build output directory: dist
```

6. Desplegar y abrir la URL `https://simple-finance-preview.pages.dev` que entregue Cloudflare.
7. En el iPhone, abrir esa URL en Safari y elegir `Compartir` > `Añadir a pantalla de inicio`.

## Datos y privacidad

El código de la PWA estará disponible en la URL de prueba por defecto, aunque el repositorio permanezca privado. No contiene secretos ni movimientos: la base de datos local se crea de cero en cada navegador/dispositivo.

Por tanto, los datos de demostración cargados en el navegador de desarrollo no aparecerán por sí solos en el iPhone. En el iPhone se pueden cargar desde `Configuración` > `Datos locales` > `Cargar datos`, o bien exportar una copia JSON de datos ficticios e importarla allí.

No introducir datos financieros reales mientras la URL de prueba sea pública. Cuando la revisión requiera acceso restringido, se añadirá un dominio propio y Cloudflare Access con una política de autenticación; no se considerará una medida de seguridad el hecho de que una URL sea difícil de adivinar.

## Verificacion

- Abrir la URL con Wi-Fi desconectado y datos móviles activos.
- Instalar la PWA desde Safari.
- Cargar datos de demostración y cerrar/reabrir la aplicación.
- Confirmar que una nueva compilación aparece tras un `push` a la rama de producción.
- Confirmar que no se ven datos de otros dispositivos, que es el comportamiento esperado hasta implantar sincronización explícita.
