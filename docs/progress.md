# Vive Loja React Backend — progreso de implementación

## Estado actual

- Checkpoint activo: CP9 — auditoría de seguridad y compatibilidad Next.js 16.
- Fuente de verdad backend: `Estuardo666/City-Listing`.
- Producción: `https://viveloja.com`; el smoke actual de `/api/mobile/v1/health`, `/home`, `/explore` y `/content` responde 200 con JSON válido. La comprobación de `/api/auth/providers` devuelve callbacks de NextAuth con el host histórico `city-listing-lovat.vercel.app`, por lo que `NEXTAUTH_URL` aún debe corregirse a `https://viveloja.com` en Vercel antes de cerrar el gate de release; las rutas autenticadas reales y el commit/deployment efectivo siguen pendientes de acceso manual.
- Neon: inspeccionado en solo lectura; la migración aditiva `MobileRefreshSession` está preparada pero aún no aplicada.
- Cliente iOS: proyecto XcodeGen separado en `Vive Loja Swift`; el build unsigned y XCTest se verifican en su propio repositorio.
- Paridad Home móvil ampliada en `8fd32ac`: `/home` ahora devuelve destacados, locales recientes, eventos relacionados, posts y promociones activas, conservando los alias `venues`/`events`.
- Paridad de detalle móvil ampliada en `874ef42`: los locales incluyen horarios, menú, productos, eventos y promociones sanitizadas; el contrato OpenAPI y las pruebas de integración validan cada sección.
- Paridad de guardados ampliada en `4d416f0`: `GET /api/mobile/v1/me/favorites` conserva el contrato legado y añade un resumen sanitizado del local, evento, artículo o ruta guardado; la integración y OpenAPI cubren la forma enriquecida.
- Paridad de cuenta ampliada en `8571e45`: seguimiento idempotente de locales (`GET/POST/DELETE /api/mobile/v1/me/following`), insignias (`GET /me/badges`) y cambio de contraseña (`PATCH /me/password`) tienen validación, autorización, DTOs/OpenAPI e integración contra PostgreSQL efímero. El cliente configura `URLCache` para GET públicos y revalida siempre las respuestas autenticadas.
- Auditoría CP9: rama `checkpoint/cp-9-next16-audit` actualiza Next a `16.3.4`, migra `middleware` a `proxy`, usa ESLint 9/flat config con reglas del React Compiler diferidas, fija dependencias transitivas parcheadas, sirve AASA de forma fail-closed mediante `APPLE_TEAM_ID`, difiere la inicialización de Resend hasta el envío y deja el audit completo y de producción en cero. El build por defecto ahora usa Webpack, igual que `build:webpack`, y conserva `build:turbopack` como opt-in. El contrato canónico de entorno se valida con `tests/env-contract.test.ts` (incluye KV, R2, Neon y Upstash Search; rechaza aliases `uptash_redish_*`/`listing_*` y exige placeholders vacíos). [CI push 33551163790](https://github.com/Estuardo666/City-Listing/actions/runs/33551163790) y [CI PR 33551167519](https://github.com/Estuardo666/City-Listing/actions/runs/33551167519) validan el commit `900a134`; ambos ejecutan Prisma, integración móvil, lint, typecheck, audit, OpenAPI y build webpack. PR #2 queda abierta para revisión con todos sus checks en verde (GitGuardian, Vercel Preview y Backend CI). El preview de Vercel completó correctamente; su URL sigue protegida por SSO y requiere sesión para una inspección manual.
- Código funcional vigente de CP9: `6b9b72e`; su endurecimiento de vistas tiene verdes [CI push 33591665176](https://github.com/Estuardo666/City-Listing/actions/runs/33591665176) y [CI PR 33591667570](https://github.com/Estuardo666/City-Listing/actions/runs/33591667570), incluido seguimiento, insignias, contraseña, recomendaciones, transmisiones, guardados enriquecidos y la regresión de role público. El smoke de producción también documenta que `NEXTAUTH_URL` sigue apuntando al host histórico y requiere corrección en Vercel; el checklist de migración incorpora la verificación. PR #2 permanece `CLEAN`; GitGuardian y Vercel Preview están verdes.
- Paridad final de contenidos móviles: `/content` y los nuevos `/watch-events` + `/watch-events/{slug}` exponen transmisiones activas, intérpretes y locales participantes; `/me/recommendations` devuelve intereses/preferencias, locales seguidos y resultados personalizados; `/views` incrementa contadores públicos de locales, eventos y transmisiones. OpenAPI y `tests/mobile-api.test.ts` cubren forma, autorización, detalle y persistencia del contador. La prueba local pasa lint, typecheck, OpenAPI y smoke sin base local; la integración completa queda delegada al PostgreSQL efímero de GitHub Actions.
- Cierre del gate de código: `5327df0` restringe el contador de vistas a contenido público aprobado/activo. [CI push 33581999540](https://github.com/Estuardo666/City-Listing/actions/runs/33581999540) y [CI PR 33581996365](https://github.com/Estuardo666/City-Listing/actions/runs/33581996365) pasan la integración móvil completa, Prisma/seed efímero, lint, typecheck, audit, OpenAPI y build webpack; PR #2 queda `CLEAN` con Vercel Preview y GitGuardian verdes.
- El documento de progreso queda sincronizado con la cabeza del PR (`26a3399`); este cambio documental se ejecuta en CI para que el check requerido permanezca visible y reproducible.
- La navegación universal de transmisiones se alinea con el cliente: AASA incluye `/partidos/*` y el router iOS reconoce `partidos`, `transmisiones` y `watch-events`; el endpoint permanece fail-closed sin Team ID.
- Endurecimiento final de CP9 en `6b9b72e` (documentado en `9331ce6`): el alta pública ignora cualquier `role` enviado y siempre crea `USER`; el esquema Zod vive fuera del handler para cumplir el tipado de Next 16; se eliminaron los endpoints debug que permitían limpiar caché/inspeccionar configuración y se retiró `@next-auth/prisma-adapter` no utilizado. [CI push 33590634104](https://github.com/Estuardo666/City-Listing/actions/runs/33590634104) y [CI PR 33590635245](https://github.com/Estuardo666/City-Listing/actions/runs/33590635245) pasan Prisma/seed efímero, integración móvil, configuración, lint, typecheck, audit, OpenAPI y build webpack.

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
- [x] Hacer tolerante el build a `RESEND_API_KEY` ausente: la integración falla sólo al enviar y tiene prueba de configuración (`tests/resend-config.test.ts`).
- [x] Añadir seguimiento de locales, lectura de insignias y cambio de contraseña a la API móvil; proteger GET públicos con cache HTTP y excluir respuestas autenticadas.

## Evidencia

- Backend CI verde (último push): https://github.com/Estuardo666/City-Listing/actions/runs/33551163790 y PR https://github.com/Estuardo666/City-Listing/actions/runs/33551167519 (Prisma, seed efímero, integración móvil, pruebas de configuración Resend y contrato de entorno, lint, typecheck, audit, OpenAPI y build webpack sobre `900a134`).
- Backend CI verde sobre los cambios de paridad: [run 33569587155](https://github.com/Estuardo666/City-Listing/actions/runs/33569587155) en `2e30ee1` (código funcional `8fd32ac`/`874ef42`) ejecuta Prisma/seed efímero, integración móvil, contrato OpenAPI, lint, typecheck, audit y build webpack; Home y detalle quedan cubiertos por aserciones de contrato.
- Backend CI verde sobre guardados enriquecidos: [run push 33572842559](https://github.com/Estuardo666/City-Listing/actions/runs/33572842559) y [run PR 33572846382](https://github.com/Estuardo666/City-Listing/actions/runs/33572846382), ambos sobre `4d416f0`, pasan integración móvil, OpenAPI, lint, typecheck, audit y build webpack.
- Backend CI verde sobre la cuenta móvil: [run push 33579090524](https://github.com/Estuardo666/City-Listing/actions/runs/33579090524) y [run PR 33579093197](https://github.com/Estuardo666/City-Listing/actions/runs/33579093197), ambos sobre `8571e45`, pasan integración de seguimiento/contraseña, OpenAPI, lint, typecheck, audit y build webpack.
- PR de checkpoint: https://github.com/Estuardo666/City-Listing/pull/1
- iOS CI (último gate verde previo a la reconexión SSE): https://github.com/Estuardo666/vive-loja-ios/actions/runs/33513652243
- Los errores históricos de iOS quedaron documentados en los logs de Actions; el último commit contiene el fix de MapKit y las aserciones actualizadas.
