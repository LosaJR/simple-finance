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
- Los metodos de pago son exclusivamente tarjetas. La tarjeta principal siempre aparece primero y se pueden anadir mas tarjetas.
- El comercio o concepto es opcional para preservar el registro manual cuando no exista una fuente automatica.
- La actividad se consulta por fecha y hora en las pestañas Global, Gastos e Ingresos.
- Categorias ilimitadas; iniciales: Ocio, Supermercado, Gasolina, Hogar y Suscripciones.
- Cada categoria puede tener limite opcional.
- Ciclos con dia de reinicio configurable y cierre manual sin borrar historial.
- Vista agregada y por metodo de pago.
- Reglas por comercio para categorizar transacciones futuras.
- Recurrentes y avisos activables/desactivables por elemento.
- Exportacion CSV y copia/restauracion JSON validada.

## Limites que deben comunicarse

- La PWA no puede leer Apple Pay ni Wallet.
- La PWA no puede leer notificaciones de otras apps. Una app iOS tampoco puede inspeccionarlas de forma generica; cualquier captura automatica futura requerira una fuente autorizada y verificable, no el texto de una notificacion bancaria ajena.
- La PWA no puede garantizar recordatorios con la app cerrada sin servicio adicional.
- Capacidades nativas deben probarse en iPhone fisico antes de declararse disponibles.
