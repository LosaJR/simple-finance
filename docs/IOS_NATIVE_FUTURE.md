# Futuro iOS nativo

No iniciar hasta disponer de macOS, Xcode, membresia Apple Developer y un iPhone fisico de prueba.

## Plan

1. Envolver la PWA con Capacitor.
2. Crear capa Swift para capacidades nativas.
3. Implementar App Intent `Registrar transaccion`.
4. Diseñar Automatizacion de Atajos para enviar datos desde Apple Pay cuando iOS lo permita por flujo del usuario.
5. Añadir notificaciones locales con acciones rapidas y selector completo dentro de la app.
6. Evaluar Face ID/PIN, widgets, Apple Watch y TestFlight.

## Limites

- La PWA no lee Apple Pay ni Wallet.
- Las notificaciones locales fiables requieren app nativa.
- Ninguna capacidad debe marcarse como disponible sin prueba en iPhone fisico.
