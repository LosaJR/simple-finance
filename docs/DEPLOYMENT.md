# Despliegue remoto de prueba

## Objetivo

Permitir abrir Simple Finance desde Safari en iPhone con una URL HTTPS estable, sin depender de la red Wi-Fi ni de que el ordenador local permanezca encendido.

## Opcion elegida

GitHub Pages con integración GitHub.

- El repositorio `LosaJR/simple-finance` se mantiene público mientras se desarrolla la aplicación.
- El despliegue compila la PWA estática y la publica en `https://losajr.github.io/simple-finance/`.
- Cada `push` a la rama elegida actualiza la aplicación automáticamente.
- No se suben movimientos, copias JSON ni secretos: los datos continúan en IndexedDB del navegador de cada dispositivo.

Para la prueba actual, configurar como rama de producción `feature/flujo-financiero-diario`. De ese modo la URL remota muestra la versión experimental y la rama base no cambia. Cuando la revisión esté aprobada, se cambiará la producción a `main` o se fusionará la rama.

## Despliegue activo

- URL de prueba: `https://losajr.github.io/simple-finance/`
- Proyecto: GitHub Pages de `LosaJR/simple-finance`
- Rama de producción actual: `main`
- Fecha de primera publicación: 2026-09-12

GitHub Actions reconstruye y publica automáticamente esta URL tras cada `push` a `main`.

## Configuracion inicial

GitHub Pages queda configurado mediante el flujo `Publish mobile preview`. En el iPhone, abrir la URL de prueba en Safari y elegir `Compartir` > `Añadir a pantalla de inicio`.

## Datos y privacidad

El código de la PWA y la URL de prueba son públicos durante el desarrollo. No contienen secretos ni movimientos: la base de datos local se crea de cero en cada navegador/dispositivo.

Por tanto, los datos de demostración cargados en el navegador de desarrollo no aparecerán por sí solos en el iPhone. En el iPhone se pueden cargar desde `Configuración` > `Datos locales` > `Cargar datos`, o bien exportar una copia JSON de datos ficticios e importarla allí.

No introducir datos financieros reales mientras la URL de prueba sea pública. Cuando la revisión requiera acceso restringido, se añadirá un dominio propio y Cloudflare Access con una política de autenticación; no se considerará una medida de seguridad el hecho de que una URL sea difícil de adivinar.

## Verificacion

- Abrir la URL con Wi-Fi desconectado y datos móviles activos.
- Instalar la PWA desde Safari.
- Cargar datos de demostración y cerrar/reabrir la aplicación.
- Confirmar que una nueva compilación aparece tras un `push` a la rama de producción.
- Confirmar que no se ven datos de otros dispositivos, que es el comportamiento esperado hasta implantar sincronización explícita.
