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
- Tarjeta principal configurable, tarjetas adicionales y CRUD seguro de tarjetas y categorias.
- Registro manual completo de gastos e ingresos.
- Registro rapido diario de gasto o ingreso, con tarjeta principal y fecha/hora automaticas.
- Actividad global, de gastos y de ingresos ordenada por fecha y hora.
- Filtro de actividad por tarjeta, dia de cobro, cuenta atras de nomina, registro diferido de nomina y calendario mensual resumido.

## Fase 2 - Limites y ciclos

- Limites opcionales por categoria.
- Dia de reinicio configurable.
- Reinicio manual con historial.
- Pruebas de cambios de mes y reinicios.

## Fase 3 - Automatizacion personal

- Reglas por comercio.
- Pendientes de categorizar.
- Categorias frecuentes y selector completo.
- Recurrentes con aviso individual.

## Fase 4 - Estadisticas y portabilidad

- Gasto por categoria y evolucion por ciclos.
- Comparativa de periodos.
- Exportacion CSV y copia/restauracion JSON validada.

## Fase 5 - Calidad y pruebas privadas

- Accesibilidad, estados vacios, errores y pulido visual.
- Checklist iPhone Safari.
- Plantilla de bugs para testers.

## Fase 6 - Despliegue privado

- Evaluar hosting estatico compatible con repositorio privado.
- Preparar despliegue sin publicar codigo ni datos.

## Fase 7 - Puente iOS nativo futuro

Bloqueada hasta macOS, Apple Developer y pruebas en iPhone fisico.

- Exponer un App Intent para registrar un movimiento desde Atajos con importe, comercio y tarjeta.
- Evaluar en dispositivo el disparador de transaccion de Wallet y sus datos disponibles.
