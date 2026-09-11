# Roadmap

## Seguimiento de avance

El estado visible y actualizado de cada fase se mantiene en el issue de GitHub [Actualizacion Objetivos](https://github.com/LosaJR/simple-finance/issues/13). Debe actualizarse al cerrar un hito, cambiar el alcance de una fase o aparecer un bloqueo relevante. Este documento conserva el alcance tecnico de referencia.

## Fase 0 - Base del proyecto

Estado: en curso.

Criterios:
- Repositorio privado, documentacion persistente, issues/milestones, Serena y CI basica.
- La app arranca localmente y se puede instalar como PWA.
- `lint`, pruebas y `build` pasan en local y CI.

Issues previstos:
- #1 Configuracion inicial y repositorio privado.
- #2 PWA base instalable y offline.
- #3 CI, pruebas unitarias y Playwright.
- #4 Serena y documentacion persistente.

## Fase 1 - Fundamentos financieros

- Dashboard responsive para iPhone.
- Tarjeta principal configurable, tarjetas adicionales y CRUD seguro de tarjetas y categorias desde Configuracion.
- Registro manual compacto de gastos e ingresos, con edicion y eliminacion del movimiento.
- Registro rapido diario de gasto o ingreso, con tarjeta principal y fecha/hora automaticas.
- Actividad global, de gastos y de ingresos ordenada por fecha y hora.
- Filtro de actividad por tarjeta, dia de cobro, cuenta atras de nomina, registro diferido de nomina y calendario resumido por ciclos de nomina.

## Fase 2 - Limites y ciclos

Estado: iniciada.

- Límite mensual opcional por categoría: disponible en Configuración y visible en Resumen.
- Dia de reinicio configurable.
- Reinicio manual con historial.
- Aviso al aproximarse al 90% del límite mediante la futura capa de notificaciones nativas.
- Pruebas de cambios de mes y reinicios.

## Fase 3 - Automatizacion personal

- Reglas por comercio: disponible localmente.
- Pendientes de categorizar: disponible como estado revisable; la entrada automatica queda bloqueada hasta la capa nativa.
- Categorias frecuentes y selector completo.
- Recurrentes: disponible con confirmacion manual y pausa por elemento. Los avisos de sistema siguen en la futura capa nativa.

## Fase 4 - Estadisticas y portabilidad

- Gasto por categoria y disponible estimado por ciclo: disponible.
- Comparativa básica frente al ciclo anterior: disponible; evolución detallada por periodos es el siguiente hito.
- Exportacion CSV y copia/restauracion JSON validada: disponible.

## Fase 5 - Calidad y pruebas privadas

- Accesibilidad, estados vacios, errores y pulido visual.
- Checklist iPhone Safari.
- Plantilla de bugs para testers.

## Fase 6 - Despliegue privado

- Hosting elegido: Cloudflare Pages con integración GitHub; la guía de configuración está en `docs/DEPLOYMENT.md`.
- Pendiente: autorizar la cuenta de Cloudflare, crear el proyecto y verificar la URL HTTPS desde iPhone con datos móviles.
- El repositorio permanece privado y no se despliegan datos; la URL pública de prueba expone únicamente los recursos estáticos de la PWA. El acceso restringido requiere una fase posterior con dominio propio y Cloudflare Access.

## Fase 7 - Puente iOS nativo futuro

Bloqueada hasta macOS, Apple Developer y pruebas en iPhone fisico.

- Exponer un App Intent para registrar un movimiento desde Atajos con importe, comercio y tarjeta.
- Evaluar en dispositivo el disparador de transaccion de Wallet y sus datos disponibles.
