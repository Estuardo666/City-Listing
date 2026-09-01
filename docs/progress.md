# Vive Loja React Backend — progreso de implementación

## Estado actual

- Checkpoint activo: CP5–CP8 — contratos móviles de interacción, cuenta, mensajería y creación.
- Fuente de verdad backend: `Estuardo666/City-Listing`.
- Producción: `https://viveloja.com` (la web responde; las rutas nuevas `/api/mobile/v1/*` aún devuelven 404 hasta desplegar este checkpoint).
- Neon: inspeccionado en solo lectura; la migración aditiva `MobileRefreshSession` está preparada pero aún no aplicada.
- Cliente iOS: proyecto XcodeGen separado en `Vive Loja Swift`; el build unsigned y XCTest se verifican en su propio repositorio.

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
- [x] Ejecutar audit, typecheck, OpenAPI y build en GitHub Actions (run base `33498524495`; los contratos posteriores pasan en `33503242312`).

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
- [x] Añadir borradores de eventos móviles (`GET/POST /me/events`) con estado `PENDING` y slug único.
- [x] Añadir reseñas y preguntas móviles (`GET/POST /me/reviews`, `GET/POST /me/questions`) con moderación pendiente.
- [x] Añadir fotos opcionales de reseñas, hasta seis URLs validadas y persistidas en `ReviewPhoto`.
- [x] Añadir conversación detallada, marcar leído, SSE foreground y cancelación de reservas.
- [x] Añadir reporte autenticado e idempotente de mensajes (`POST /me/messages/report`) con razones normalizadas.
- [x] Añadir bloqueo/desbloqueo autenticado de participantes (`POST/DELETE /me/messages/block`) y rechazo de mensajes mientras exista el bloqueo.
- [x] Añadir upload multipart autenticado a R2 y portada opcional de eventos.
- [x] Añadir intereses/preferencias de onboarding (`GET/PUT /me/interests`).
- [x] Añadir colecciones privadas, ítems idempotentes y check-ins con radio de 1 km.
- [x] Añadir borradores autenticados para locales, artículos y rutas con estado `PENDING`.

## Evidencia

- Backend CI verde (último push): https://github.com/Estuardo666/City-Listing/actions/runs/33512178880 (typecheck, lint, integración móvil, OpenAPI y build tras añadir reporte y bloqueo idempotente de conversaciones).
- PR de checkpoint: https://github.com/Estuardo666/City-Listing/pull/1
- iOS CI (último gate verde previo a la reconexión SSE): https://github.com/Estuardo666/vive-loja-ios/actions/runs/33513652243
- Los errores históricos de iOS quedaron documentados en los logs de Actions; el último commit contiene el fix de MapKit y las aserciones actualizadas.
