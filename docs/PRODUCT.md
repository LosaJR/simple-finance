# Producto

## Vision

Simple Finance es una herramienta privada para registrar, clasificar y entender finanzas personales desde iPhone. La primera version es una PWA instalable desde Safari; el futuro nativo se abordara con Capacitor y Swift solo cuando exista entorno verificable.

## Usuario inicial

El propietario y un circulo cerrado de testers. No se recopilan datos, no hay backend y no se debe pedir informacion financiera real en reportes.

## Requisitos cerrados

- Idioma inicial: español.
- Datos locales, privados y aislados por dispositivo/persona.
- Tipos separados: gastos, ingresos e inversiones.
- Las inversiones no cuentan como gasto y solo muestran importe invertido.
- Categorias ilimitadas; iniciales: Ocio, Supermercado, Gasolina, Hogar y Suscripciones.
- Cada categoria puede tener limite opcional.
- Ciclos con dia de reinicio configurable y cierre manual sin borrar historial.
- Vista agregada y por metodo de pago.
- Reglas por comercio para categorizar transacciones futuras.
- Recurrentes y avisos activables/desactivables por elemento.
- Exportacion CSV y copia/restauracion JSON validada.

## Limites que deben comunicarse

- La PWA no puede leer Apple Pay ni Wallet.
- La captura Apple Pay queda para app iOS nativa mediante Atajos + App Intent.
- La PWA no puede garantizar recordatorios con la app cerrada sin servicio adicional.
- Capacidades nativas deben probarse en iPhone fisico antes de declararse disponibles.
