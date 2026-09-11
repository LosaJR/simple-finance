# Producto

## Vision

Simple Finance es una herramienta privada para registrar, clasificar y entender finanzas personales desde iPhone. La primera version es una PWA instalable desde Safari; el futuro nativo se abordara con Capacitor y Swift solo cuando exista entorno verificable.

## Usuario inicial

El propietario y un circulo cerrado de testers. No se recopilan datos, no hay backend y no se debe pedir informacion financiera real en reportes.

## Requisitos cerrados

- Idioma inicial: español.
- Datos locales, privados y aislados por dispositivo/persona.
- Tipos separados: gastos e ingresos.
- Los metodos de pago son exclusivamente tarjetas. La tarjeta principal siempre aparece primero y se pueden anadir mas tarjetas.
- La tarjeta principal se guarda como una preferencia unica y se aplica por defecto al registro rapido y al formulario completo.
- El comercio o concepto es opcional para preservar el registro manual cuando no exista una fuente automatica.
- La actividad se consulta por fecha y hora en las pestañas Global, Gastos e Ingresos.
- La actividad puede filtrarse por todas las tarjetas o una tarjeta concreta.
- La navegacion movil separa Resumen, Registrar, Actividad y Configuracion en vistas propias; cada vista solo desplaza el contenido que necesita.
- Resumen ofrece un registro rapido superpuesto con los pasos gasto o ingreso, importe, concepto y categoria; usa la tarjeta principal y el momento actual sin pedirlos.
- Resumen mantiene los ultimos movimientos compactos y permite deslizarlos a la izquierda para editar o eliminar el movimiento.
- Resumen es desplazable y prioriza los gastos del ciclo: un gráfico circular los distribuye por categoría, un calendario permite elegir año y mes para actualizar ese mismo resumen, y una lista muestra solo las categorías usadas, su porcentaje y su consumo frente al límite individual cuando exista. Al pulsar una categoría se abre suavemente su extracto de gastos del ciclo debajo de esa misma fila.
- Registrar no pide notas; solo solicita los datos necesarios para crear el movimiento en una pantalla compacta.
- Configuracion conserva el tema, el dia de cobro y la cantidad de nomina, y muestra selectores directos de tarjetas y categorias con acciones `+` para añadirlas. La aplicación inicia en modo noche y permite cambiar a claro.
- Resumen muestra la cuenta atras para la proxima nomina y Actividad ofrece un calendario anual resumido de ingresos y gastos por ciclo de nomina; al elegir un ciclo muestra su extracto. Cada ciclo se etiqueta con el mes de su ultimo dia antes del siguiente cobro, de modo que los gastos entre el 25 de agosto y el 25 de septiembre, o entre el 1 de septiembre y el 1 de octubre, se muestran en septiembre.
- Cuando la aplicacion se abre en la fecha de cobro efectiva o despues, registra una unica nomina como ingreso. Si el dia elegido cae en fin de semana, se desplaza al siguiente dia laborable.
- Cada ciclo comienza en la fecha efectiva de cobro y termina al comenzar el siguiente. La nomina que abre el ciclo se asigna a ese ciclo, aunque la fecha efectiva caiga al principio del mes siguiente.
- Categorias ilimitadas; las creadas por la persona sirven tanto para gastos como para ingresos. Cada categoría tiene color e icono visual, y puede tener un límite mensual individual opcional. Iniciales: Ocio, Supermercado, Gasolina, Hogar y Suscripciones.
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
- El dia de cobro se usa ya para el ciclo, la cuenta atras y el registro local de nomina al abrir la aplicacion. Una notificacion fiable con la app cerrada requiere la futura capa nativa y una prueba en iPhone fisico.
- Capacidades nativas deben probarse en iPhone fisico antes de declararse disponibles.
- El aviso cuando una categoría alcance el 90% de su límite requiere la futura capa nativa de notificaciones y no se anuncia todavía como disponible.
