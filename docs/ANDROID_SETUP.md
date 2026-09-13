# Preparación de Android

Esta guía prepara el entorno para la Fase 7. No publica una aplicación, no crea una cuenta de Google Play ni concede acceso a datos financieros.

## Requisitos del equipo

1. Instalar la versión estable de Android Studio desde la web oficial de Android Developers.
2. Durante la instalación, incluir Android SDK, Android SDK Platform-Tools y Android Emulator. Android Studio instala una versión compatible de Java; no se debe depender de Java 8 del sistema.
3. Abrir Android Studio una vez y aceptar sus licencias para completar la descarga del SDK.
4. Definir `ANDROID_HOME` o `ANDROID_SDK_ROOT` apuntando al SDK y abrir un terminal nuevo.
5. Comprobar que `adb version` responde desde el terminal.

## Dispositivo físico

- Activar Opciones de desarrollador y Depuración USB en un Android de pruebas.
- Conectar el dispositivo por USB y aceptar únicamente la huella RSA de este equipo.
- Ejecutar `adb devices`; debe mostrar un dispositivo con estado `device`.
- Usar exclusivamente datos ficticios en las pruebas; la aplicación conservará los datos locales del navegador o instalación de prueba.

## Siguiente bloque técnico

Con el entorno preparado, el proyecto podrá añadir Capacitor y el módulo Android en una rama aislada. Antes de generar una compilación distribuible se confirmarán el identificador del paquete, la firma local protegida y el modo de distribución. Las claves o archivos de firma nunca se guardan en Git.

## Límites

- No se habilitarán notificaciones, lectura de pagos ni automatizaciones sin permiso explícito y prueba en dispositivo.
- Un AAB y una pista interna de Google Play requieren una cuenta de Google Play; esa creación y sus datos de facturación requieren aprobación de la persona propietaria.
