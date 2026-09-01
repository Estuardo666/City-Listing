# Vive Loja iOS — progreso de implementación

## Estado actual

- Checkpoint activo: CP1 — base iOS y autenticación.
- Fuente de verdad backend: `Estuardo666/City-Listing`.
- Producción: `https://viveloja.com`.
- Neon: inspeccionado en solo lectura; el esquema coincide con Prisma.
- iOS: proyecto XcodeGen creado en `Vive Loja Swift`; el build unsigned ya compila en macOS 26/Xcode 26.2 y la suite XCTest sigue ejecutándose por cola de GitHub Actions.

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
- [x] Ejecutar audit, typecheck y build en GitHub Actions (run `33486590765`).

## CP1 (inicio)

- [x] Añadir modelo separado `MobileRefreshSession`.
- [x] Añadir emisión, rotación y revocación de tokens móviles.
- [x] Añadir endpoints health/register/login/refresh/logout.
- [x] Crear cliente SwiftUI con URLSession, Observation, Keychain y fixtures.
- [x] Crear workflow iOS unsigned para Xcode 26.
- [x] Compilar el cliente y generar el bundle de tests en macOS 26 (runs `33486192317` y posteriores; los fallos iniciales fueron corregidos en commits siguientes).
- [ ] Añadir tests de integración de auth y rate limiting.
- [ ] Añadir Sign in with Apple con verificación JWKS.

## Evidencia

- Backend CI verde: https://github.com/Estuardo666/City-Listing/actions/runs/33486590765
- PR de checkpoint: https://github.com/Estuardo666/City-Listing/pull/1
- iOS CI: https://github.com/Estuardo666/vive-loja-ios/actions
- Los errores históricos de iOS quedaron documentados en los logs de Actions; el último commit contiene el fix de MapKit y las aserciones actualizadas.
