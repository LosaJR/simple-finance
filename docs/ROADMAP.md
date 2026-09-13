# Roadmap

## Seguimiento de avance

El estado visible y actualizado de cada fase se mantiene en el issue de GitHub [Actualizacion Objetivos](https://github.com/LosaJR/simple-finance/issues/13). Debe actualizarse al cerrar un hito, cambiar el alcance de una fase o aparecer un bloqueo relevante. Este documento conserva el alcance tecnico de referencia.

## Fase 0 - Base del proyecto

Estado: completada.

Criterios:
- Repositorio, documentación persistente, issues/milestones y CI básica.
- La app arranca localmente y se puede instalar como PWA.
- `lint`, pruebas y `build` pasan en local y CI.

Issues previstos:
- #1 Configuración inicial y repositorio.
- #2 PWA base instalable y offline.
- #3 CI, pruebas unitarias y Playwright.
- #4 Serena y documentacion persistente.

## Fase 1 - Fundamentos financieros

Estado: completada.

- Dashboard responsive para iPhone.
- Tarjeta principal configurable, tarjetas adicionales y CRUD seguro de tarjetas y categorias desde Configuracion.
- Registro manual compacto de gastos e ingresos, con edicion y eliminacion del movimiento.
- Registro rapido diario de gasto o ingreso, con tarjeta principal y fecha/hora automaticas.
- Actividad global, de gastos y de ingresos ordenada por fecha y hora.
- Filtro de actividad por tarjeta, dia de cobro, cuenta atras de nomina, registro diferido de nomina y calendario resumido por ciclos de nomina.

## Fase 2 - Limites y ciclos

Estado: iniciada.

- Límite mensual opcional por categoría: disponible en Configuración y visible en Resumen con importe restante, progreso y estado al 75%, 90% y 100%.
- Disponible diario: disponible en Resumen para repartir el saldo estimado hasta la próxima nómina.
- Próximos pagos recurrentes: visibles en Resumen y confirmables solo cuando vencen.
- Día de cobro configurable como único delimitador de ciclo.
- Aviso al aproximarse al 90% del límite mediante la futura capa de notificaciones nativas.
- Pruebas de cambios de mes, fines de semana y reinicios: disponibles.

## Fase 3 - Automatizacion personal

- Reglas por comercio: disponible localmente.
- Pendientes de categorizar: disponible como estado revisable; la entrada automatica queda bloqueada hasta la capa nativa.
- Categorias frecuentes y selector completo.
- Recurrentes: disponible con confirmacion manual y pausa por elemento. Los avisos de sistema siguen en la futura capa nativa.

## Fase 4 - Estadisticas y portabilidad

- Gasto por categoria y disponible estimado por ciclo: disponible.
- Comparativa básica frente al ciclo anterior y evolución visual de los últimos seis ciclos: disponibles.
- Exportacion CSV y copia/restauracion JSON validada: disponible.

## Fase 5 - Calidad y pruebas privadas

- Accesibilidad, estados vacios, errores y pulido visual: primer pase completado (objetivos de 44 px, contraste, foco modal, estados de guardado y confirmaciones de borrado).
- Checklist iPhone Safari.
- Plantilla de bugs para testers.

## Fase 6 - Despliegue de prueba

- Estado: en curso.
- Hosting elegido y publicado: GitHub Pages; la guía de configuración está en `docs/DEPLOYMENT.md`.
- `main` es la base aprobada y la rama de producción. Cada `push` a `main` reconstruye automáticamente `https://losajr.github.io/simple-finance/`.
- Pendiente: verificar la instalación y los flujos principales desde Safari en iPhone y un dispositivo Android, también con datos móviles.
- El repositorio es público temporalmente para permitir GitHub Pages. La URL de prueba expone únicamente los recursos estáticos de la PWA, pero no se deben introducir datos financieros reales.

## Fase 7 - Puente Android nativo

Planificada después de validar los flujos locales y de cerrar la calidad privada.

- Integrar Capacitor y crear el proyecto Android sin alterar la capa de dominio web.
- Preparar firma, paquete AAB y pista de pruebas interna de Google Play.
- Validar en Android físico instalación, almacenamiento local, navegación, actualizaciones y notificaciones locales autorizadas.
- Evaluar de forma separada cualquier integración autorizada para proponer movimientos desde el sistema, sin asumir acceso a datos de pago o notificaciones.

## Fase 8 - Identidad y sincronizacion futura

Estado: planificada tras validar el uso local privado.

- Diseñar almacenamiento remoto cifrado y sincronización entre dispositivos.
- Migrar de forma explícita los datos locales existentes, con exportación y borrado de cuenta.
- Incorporar inicio de sesión con Apple y Google solo sobre esa base de privacidad y recuperación.

## Fase 9 - Puente iOS nativo posterior

Bloqueada hasta macOS, cuenta Apple Developer y pruebas en iPhone físico.

- Integrar Capacitor para iOS conservando la misma capa de dominio.
- Exponer un App Intent de registro desde Atajos con datos entregados por una fuente autorizada.
- Evaluar en dispositivo el disparador de transacción de Wallet y sus datos disponibles.
