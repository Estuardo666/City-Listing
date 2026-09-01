# Vive Loja iOS — progreso de implementación

## Estado actual

- Checkpoint activo: CP5–CP7 — perfil, reservas y mensajería móvil básica.
- Fuente de verdad backend: `Estuardo666/City-Listing`.
- Producción: `https://viveloja.com`.
- Neon: inspeccionado en solo lectura; el esquema coincide con Prisma.
- iOS: proyecto XcodeGen creado en `Vive Loja Swift`; el build unsigned y la suite XCTest se ejecutan en macOS 26/Xcode 26.2 por GitHub Actions.

## Reglas de ejecución

- No escribir en Neon producción.
- No commitear secretos, credenciales, bases locales ni archivos generados.
- Cada checkpoint se trabaja en una rama `checkpoint/cp-N-*` y termina con CI y PR.
- Registrar aquí el commit, el resultado de cada gate y el siguiente paso.

## CP0

- [x] Plan guardado en `PLAN_VIVE_LOJA_IOS.md`.
- [x] `.gitignore` seguro agregado antes de inicializar Git.
- [x] Reconectar copia local con el remoto `City-Listing`.
- [x] Actualizar dependencias con vulnerabilidades runtime conocidas y retirar adapter no usado.
- [x] Añadir OpenAPI móvil y estructura de documentación.
- [x] Añadir workflow backend con PostgreSQL efímero.
- [x] Resolver el bloqueo de build por inicialización eager de Upstash Search (cliente lazy).
- [x] Documentar la excepción de las vulnerabilidades no críticas restantes de Next 15 (la actualización mayor queda para CP9).
- [x] Ejecutar audit/typecheck local con variables dummy; build local requiere PostgreSQL efímero.
- [x] Ejecutar audit, typecheck y build en GitHub Actions (último run `33491264262`).

## CP1 (inicio)

- [x] Añadir modelo separado `MobileRefreshSession`.
- [x] Añadir emisión, rotación y revocación de tokens móviles.
- [x] Añadir endpoints health/register/login/refresh/logout.
- [x] Añadir endpoints públicos de Home, Explore y detalle de locales/eventos con DTO móvil sanitizado.
- [x] Añadir rate limit distribuido para login/registro y manejo de carreras por email único.
- [x] Añadir API autenticada de guardados (`GET/POST/DELETE /api/mobile/v1/me/favorites`) lista para sincronización del cliente.
- [x] Añadir Sign in with Apple: nonce con hash en iOS y verificación JWKS/issuer/audience en backend; se habilita al configurar `APPLE_CLIENT_ID`.
- [x] Añadir contenido móvil: posts/categorías, promociones activas, rutas aprobadas y colecciones públicas.
- [x] Corregir memoización server-side para React 18 con fallback cuando `react.cache` no existe.
- [x] Crear cliente SwiftUI con URLSession, Observation, Keychain y fixtures.
- [x] Crear workflow iOS unsigned para Xcode 26.
- [x] Compilar el cliente y generar el bundle de tests en macOS 26 (runs `33486192317` y posteriores; los fallos iniciales fueron corregidos en commits siguientes).
- [x] Añadir tests de integración de auth, refresh single-use, logout, favoritos y contenido.
- [x] Añadir perfil móvil autenticado (`GET/PATCH /me/profile`) con estadísticas públicas y validación.
- [x] Añadir reservas móviles (`GET/POST /me/reservations`) con fecha futura, aforo e idempotencia lógica.
- [x] Añadir inbox y envío de mensajes (`GET/POST /me/messages`) con control de bloqueo.
- [x] Sanitizar plan histórico de emails que contenía una credencial; la rotación del valor debe hacerse en Resend/hosting.

## Evidencia

- Backend CI verde (último push): https://github.com/Estuardo666/City-Listing/actions/runs/33496658099
- PR de checkpoint: https://github.com/Estuardo666/City-Listing/pull/1
- iOS CI: https://github.com/Estuardo666/vive-loja-ios/actions
- Los errores históricos de iOS quedaron documentados en los logs de Actions; el último commit contiene el fix de MapKit y las aserciones actualizadas.
