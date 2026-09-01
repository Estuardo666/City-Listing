# Vive Loja iOS — progreso de implementación

## Estado actual

- Checkpoint activo: CP1 — base iOS y autenticación.
- Fuente de verdad backend: `Estuardo666/City-Listing`.
- Producción: `https://viveloja.com`.
- Neon: inspeccionado en solo lectura; el esquema coincide con Prisma.
- iOS: proyecto XcodeGen creado en `Vive Loja Swift`; pendiente de primer build macOS.

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
- [ ] Resolver las vulnerabilidades no críticas restantes o documentar la excepción de Next 15.
- [x] Ejecutar audit/typecheck local con variables dummy; build local requiere PostgreSQL efímero.
- [ ] Ejecutar audit, typecheck y build en GitHub Actions.

## CP1 (inicio)

- [x] Añadir modelo separado `MobileRefreshSession`.
- [x] Añadir emisión, rotación y revocación de tokens móviles.
- [x] Añadir endpoints health/register/login/refresh/logout.
- [x] Crear cliente SwiftUI con URLSession, Observation, Keychain y fixtures.
- [x] Crear workflow iOS unsigned para Xcode 26.
- [ ] Añadir tests de integración de auth y rate limiting.
- [ ] Añadir Sign in with Apple con verificación JWKS.

## Evidencia

Pendiente de registrar después de ejecutar los gates de CP0.
