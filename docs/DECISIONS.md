# Decisiones

## 2026-09-10 - PWA local primero

Se inicia como PWA React + Vite instalable para validar el producto en iPhone sin depender de App Store, backend ni cuentas.

## 2026-09-10 - Datos en centimos

Los importes se almacenan como enteros en centimos para evitar errores de coma flotante en calculos financieros.

## 2026-09-10 - Dexie + Zod

Dexie cubre IndexedDB con una API mantenible y Zod permite validar formularios e importaciones futuras antes de escribir datos.

## 2026-09-10 - Tema profesional de herramienta

La interfaz prioriza densidad, claridad y lectura rapida sobre una landing page o elementos decorativos.

## 2026-09-10 - Tarjetas como unico metodo de pago

El producto inicial representa solo tarjetas: una tarjeta principal y tarjetas adicionales. No se incorporan cuentas ni efectivo a este flujo.

## 2026-09-10 - Captura automatica mediante Atajos nativos

El registro manual conserva un comercio opcional como respaldo. La futura app iOS expondra un App Intent para que Atajos pueda registrar un movimiento con parametros. El disparador de Wallet puede iniciar una automatizacion al usar una tarjeta, pero no se asumira que aporta importe o comercio hasta probarlo en iPhone.

## 2026-09-10 - Navegacion movil antes de ampliar funciones

Se separan los flujos base en Resumen, Registrar, Actividad y Configuracion con una barra inferior fija. Esta estructura se valida desde iPhone antes de ampliar la fase funcional para no trasladar una pagina de desplazamiento continuo a la futura app nativa.

## 2026-09-10 - Material calido y sobrio

El modo claro usa papel marfil y un grano local de muy bajo contraste; el modo oscuro usa tonos tinta y verde apagado, con la misma textura apenas perceptible. La imagen se sirve comprimida como WebP para que forme parte de la PWA sin superar el limite de precache.

## 2026-09-10 - Registro rapido desde Resumen

El flujo cotidiano abre una hoja superpuesta sin abandonar Resumen. Solo solicita gasto o ingreso, importe, concepto y categoria; la tarjeta principal y el momento de registro se asignan localmente. Las inversiones se eliminan del producto inicial para mantener el flujo diario centrado en gastos e ingresos.

## 2026-09-10 - Dia de nomina local

El dia de cobro y la cantidad se guardan en IndexedDB. Determinan la cuenta atras, el ciclo y una unica entrada automatica de nomina cuando la app se abre en la fecha efectiva o despues. Si cae en fin de semana, la fecha efectiva se desplaza al lunes. La notificacion de confirmacion queda pendiente de la aplicacion iOS nativa.

## 2026-09-10 - Resumen fijo y calendario en Actividad

Resumen se mantiene compacto y sin desplazamiento; la navegacion inferior es opaca y reserva espacio para que no se vea contenido debajo. El historial comparativo se traslada a un calendario anual desplegable desde Actividad, con ingresos y gastos por ciclo de nomina.

## 2026-09-10 - Ciclos entre fechas efectivas de cobro

Los ciclos se delimitan entre cobros efectivos, no por el limite natural del calendario. Si el dia configurado cae en fin de semana, se desplaza al lunes y ese retraso amplía el ciclo anterior. El calendario etiqueta cada ciclo por su ultimo dia antes del siguiente cobro: tanto el intervalo 25 de agosto a 25 de septiembre como el de 1 de septiembre a 1 de octubre se consultan desde septiembre.

## 2026-09-10 - Configuracion de acceso directo

Tarjetas y categorias no usan una segunda capa de secciones plegables. Cada una se muestra como selector directo en Configuracion y ofrece un boton `+` lateral para abrir el alta correspondiente.

## 2026-09-10 - Interfaz financiera suave

La interfaz movil conserva una paleta neutra con acento verde, pero reduce bordes pesados y textura para priorizar lectura. Los iconos se reservan para orientacion, navegacion y acciones; las superficies se agrupan por tarea y la barra inferior mantiene icono y etiqueta para una navegacion inmediata. El balance separa ingresos y gastos dentro de la misma superficie, los movimientos usan un marcador por tipo y los campos se identifican con iconos de dominio.

## 2026-09-10 - Resumen centrado en gasto por categoría

Resumen deja de ser una vista fija de últimos movimientos. Pasa a ser desplazable y muestra la distribución de gastos del ciclo por categoría mediante un gráfico circular, más una lista de consumo y límite. El calendario de la propia vista selecciona el año y el mes y actualiza ese mismo resumen, sin cambiar de pestaña. Al pulsar una categoría se despliega su extracto de gastos justo debajo de esa fila, con una apertura breve y el indicador de estado animado.

## 2026-09-10 - Límites locales antes de avisos nativos

Cada límite mensual se guarda exclusivamente en su categoría y se muestra junto al gasto de esa categoría en el ciclo. La alerta del 90% no se simula en la PWA: se implementará junto con las notificaciones locales de la futura aplicación iOS.

## 2026-09-10 - Correccion de movimientos desde Resumen

Los ultimos movimientos se pueden deslizar hacia la izquierda para descubrir acciones persistentes de editar y eliminar. Editar reaprovecha el formulario compacto sin nota; eliminar una nomina automatica evita que vuelva a crearse durante ese mismo ciclo.
