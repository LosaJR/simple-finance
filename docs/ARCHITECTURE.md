# Arquitectura

## Stack

- React + Vite.
- TypeScript estricto.
- PWA con `vite-plugin-pwa` y service worker generado. Comprueba actualizaciones al abrirse, recuperar el foco y cada hora; el worker entrante se activa sin esperar a que desaparezca la versión anterior, toma el control y recarga la PWA automáticamente.
- IndexedDB mediante Dexie para datos locales.
- Zod para validar entradas e importaciones futuras.
- Vitest para logica financiera y Playwright para flujos principales.

## Interfaz movil

La interfaz de fase 0 usa navegacion local en el cliente con una barra inferior fija. Las vistas Resumen, Registrar, Actividad y Configuracion comparten el estado de IndexedDB, pero no se apilan en una pagina unica. Resumen puede abrir un registro rapido como hoja modal sin abandonar el contexto y permite editar o eliminar sus ultimos movimientos mediante deslizamiento. La superficie usa una textura local comprimida para no penalizar la precache de la PWA.

## Modelo local inicial

- `PaymentMethod`: tarjeta, nombre, color, ultimos cuatro digitos opcional, activa y bandera unica de tarjeta principal. No se modelan cuentas ni efectivo.
- `Category`: nombre, icono textual, color, tipos permitidos, límite mensual opcional y activo.
- `Transaction`: gasto o ingreso, importe en centimos, comercio, fecha local, metodo, categoria, estado, ciclo y origen manual, nomina, recurrente o automatizacion futura.
- `MerchantRule`: comercio normalizado y categoria sugerida. Nunca modifica un movimiento existente ni registra datos por si solo.
- `PlannedPayment`: pago recurrente local con importe, tarjeta, categoria, frecuencia, proxima fecha y estado. Solo crea una transaccion cuando la persona pulsa `Registrar`.
- `AppSettings`: dia de cobro, cantidad de nomina, cierres manuales de ciclo, ciclos cuya nomina automatica fue eliminada, tema, contraste y estado de primera configuracion.

Los importes se almacenan como enteros en centimos. Las fechas de movimientos usan formato `YYYY-MM-DD` y los calculos de ciclo se hacen con fecha local al mediodia para evitar desplazamientos por zona horaria. El resumen actual calcula el ciclo contra el dia de cobro vigente y desplaza un cobro de fin de semana al lunes. Un cierre manual termina el extracto en el día anterior y abre uno nuevo en la fecha actual; conserva los movimientos y se registra como un límite adicional del ciclo programado. Agrupa los gastos por categoría para el gráfico circular y el consumo del límite. El calendario anual agrupa el historial por ciclos delimitados por esas fechas efectivas y etiqueta cada uno por su ultimo dia antes del siguiente cobro: el intervalo 25 de agosto a 25 de septiembre, y el de 1 de septiembre a 1 de octubre, se registran como septiembre. El borrado de una nomina automatica marca su ciclo para que no reaparezca en la siguiente carga.

El Resumen deriva un disponible diario del saldo estimado y los días hasta nómina. Los límites individuales se calculan por categoría y ciclo, con estados locales al 75%, 90% y 100%, sin enviar información fuera del dispositivo. Actividad agrupa hasta los últimos seis ciclos programados para mostrar la evolución de ingresos, gastos y su variación frente al periodo anterior; el gráfico usa el mismo filtro de ciclo que el extracto. Los pagos recurrentes siguen siendo planes locales: se muestran por su próxima fecha y solo se materializan como movimiento después de que la persona lo confirme.

Las copias JSON se validan con Zod antes de sustituir el contenido local; el CSV es una exportacion de lectura de movimientos. No existe sincronizacion remota.

## Privacidad

No hay backend, analitica ni SDKs externos. Los datos quedan en IndexedDB del navegador. No se deben versionar exportaciones reales ni fixtures con datos sensibles.

## Extension nativa futura

Capacitor envolverá la PWA sin romper la capa de dominio. Android será la primera plataforma nativa: el proyecto Android se construirá desde Windows con Android Studio, se firmará para pruebas y se distribuirá primero en una pista de pruebas de Google Play. Los plugins nativos se aislarán detrás de interfaces de la aplicación para que la lógica financiera, Dexie y la interfaz React continúen compartidas.

Notificaciones, autenticación biométrica e integraciones para proponer movimientos se implementarán por plataforma y solo tras permisos explícitos, política de privacidad y pruebas físicas. Android no recibirá una equivalencia ficticia de App Intents o Wallet; iOS conservará su puente posterior con App Intents, Atajos, Face ID, widgets y Apple Watch cuando haya macOS, cuenta Apple Developer y un iPhone de pruebas.

## Identidad y sincronizacion futura

La autenticación con Apple o Google no aporta recuperación ni continuidad si los datos permanecen solo en IndexedDB. Se incorporará con una capa remota separada que incluya identidad, almacenamiento por usuario, sincronización entre dispositivos, exportación y borrado de cuenta. Antes de escoger proveedor se definirá un modelo de cifrado, minimización de metadatos, recuperación y migración desde los datos locales. La sesión nunca sustituirá la posibilidad de usar la aplicación privada y local.
