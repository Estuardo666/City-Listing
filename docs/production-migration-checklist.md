# Migración de producción — MobileRefreshSession

La API móvil usa el modelo aditivo `MobileRefreshSession`. Neon producción no se modifica durante la corrida nocturna; por eso los endpoints de login/registro de la rama de checkpoint requieren esta migración antes de habilitarse en el dominio público.

## Preflight con aprobación

1. Rotar todas las credenciales que se compartieron en el chat y actualizar el hosting con nombres canónicos (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, R2 y Google).
2. Establecer `NEXTAUTH_URL=https://viveloja.com` y `NEXT_PUBLIC_APP_URL=https://viveloja.com`; comprobar que `/api/auth/providers` anuncie callbacks en el dominio canónico y no en el deployment histórico.
3. Confirmar backup/punto de restauración de Neon y ventana de mantenimiento.
4. Revisar el SQL de `prisma/migrations/20260901000000_add_mobile_refresh_session/migration.sql`.
5. Ejecutar `npx prisma migrate deploy` con `DATABASE_URL_UNPOOLED` de producción desde un runner autorizado.
6. Comprobar `GET /api/mobile/v1/health`, registro de prueba controlado, refresh rotativo y logout; revocar/eliminar la cuenta de prueba.
7. Sólo después fusionar el PR y dejar que Vercel despliegue.

No se deben pegar valores de entorno en este archivo, en logs ni en GitHub Actions.

## Activación de venta de entradas

La migración de ticketing es aditiva y está en `prisma/migrations/20260911150000_event_ticketing/migration.sql`. Antes de habilitar venta interna en producción:

1. Configurar en el hosting `PAYPHONE_TOKEN`, `PAYPHONE_STORE_ID`, `TICKETING_CREDENTIAL_ENCRYPTION_KEY`, `CRON_SECRET`, `TICKETING_JOB_SECRET`, `RESEND_API_KEY` y `EMAIL_FROM` con un remitente cuyo dominio esté verificado en Resend; agregar `QSTASH_TOKEN` si se usará QStash para la cola durable.
2. Confirmar que `NEXT_PUBLIC_APP_URL` y `NEXTAUTH_URL` sean el dominio HTTPS canónico, porque PayPhone utiliza las URLs de retorno/cancelación para cerrar el checkout.
3. Autorizar el webhook de PayPhone hacia `POST /api/webhooks/payphone/NotificacionPago` y conservar el `CRON_SECRET`/job secret sólo en servidor.
4. Ejecutar `npx prisma migrate deploy` desde un runner autorizado, verificando primero backup y la URL de producción; no usar `prisma db push`.
5. Crear un evento de prueba con monto pequeño, validar hold, pago aprobado, retorno, correo, QR, escaneo online y devolución total.
6. Para organizadores externos, registrar su `Store ID` y token desde el panel; Vive Loja los cifra y nunca los envía al navegador ni a iOS.

Si el organizador vende con un enlace externo, no se requiere configurar credenciales en Vive Loja: se guarda únicamente la URL HTTPS pública del checkout.
