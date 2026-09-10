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
- La PWA no puede integrarse con App Intents ni recibir parametros desde Atajos. La futura app iOS si expondra un atajo para registrar un movimiento con importe, comercio y tarjeta cuando esos datos provengan de una fuente autorizada.
- El disparador de transaccion de Wallet puede iniciar un atajo cuando se usa una tarjeta, pero no debe asumirse que entrega importe ni comercio; se validara en dispositivo antes de diseñar un flujo automatico sobre el.
- La PWA no puede garantizar recordatorios con la app cerrada sin servicio adicional.
- Capacidades nativas deben probarse en iPhone fisico antes de declararse disponibles.
