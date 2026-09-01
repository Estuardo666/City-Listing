# Migración de producción — MobileRefreshSession

La API móvil usa el modelo aditivo `MobileRefreshSession`. Neon producción no se modifica durante la corrida nocturna; por eso los endpoints de login/registro de la rama de checkpoint requieren esta migración antes de habilitarse en el dominio público.

## Preflight con aprobación

1. Rotar todas las credenciales que se compartieron en el chat y actualizar el hosting con nombres canónicos (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, R2 y Google).
2. Confirmar backup/punto de restauración de Neon y ventana de mantenimiento.
3. Revisar el SQL de `prisma/migrations/20260901000000_add_mobile_refresh_session/migration.sql`.
4. Ejecutar `npx prisma migrate deploy` con `DATABASE_URL_UNPOOLED` de producción desde un runner autorizado.
5. Comprobar `GET /api/mobile/v1/health`, registro de prueba controlado, refresh rotativo y logout; revocar/eliminar la cuenta de prueba.
6. Sólo después fusionar el PR y dejar que Vercel despliegue.

No se deben pegar valores de entorno en este archivo, en logs ni en GitHub Actions.
