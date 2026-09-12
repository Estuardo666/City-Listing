# Boletería de eventos

Esta implementación soporta dos modos públicos:

- `INTERNAL`: Vive Loja muestra tipos de entrada, reserva inventario y redirige el pago a PayPhone. La cuenta que cobra se decide por evento: cuenta central (`PLATFORM`, solo administración) o cuenta PayPhone del organizador (`ORGANIZER`).
- `EXTERNAL`: Vive Loja no procesa dinero ni sincroniza estados; solo muestra un enlace HTTPS al sitio autorizado del organizador.

## Componentes

El dominio vive en `src/lib/ticketing/service.ts` y usa dinero en centavos enteros.

- `EventTicketingConfig`: modo, vendedor, ventanas de venta y política de tarifa.
- `OrganizerPaymentAccount`: Store ID y token PayPhone cifrado con AES-256-GCM; el token nunca se devuelve por API.
- `TicketType`: boletos generales, numerados o de asiento asignado.
- `TicketHold` / `TicketHoldItem`: reserva temporal de 10 minutos con clave de idempotencia.
- `TicketOrder` / `TicketPaymentAttempt`: orden y trazabilidad del pago.
- `Ticket` / `TicketCheckIn`: entrada emitida, QR bearer cifrado en reposo y validación online atómica.
- `TicketingOutbox` / `TicketingLedgerEntry` / `TicketingAuditLog`: entrega de correo, conciliación y auditoría.

El flujo de cobro es:

1. El navegador o iOS consulta `GET /api/ticketing/events/:slug` o `GET /api/mobile/v1/events/:slug/ticketing`.
2. Crea un hold con `POST /api/ticketing/holds` o `/api/mobile/v1/ticketing/holds` y `Idempotency-Key`.
3. Envía datos del comprador a `POST .../ticketing/checkouts`.
4. El servidor crea la sesión PayPhone (`/api/button/Prepare`) y devuelve una URL hospedada por PayPhone.
5. PayPhone vuelve a `/api/ticketing/payphone/return`; el servidor confirma con `/api/button/V2/Confirm` y valida referencia, importe y moneda antes de emitir entradas.
6. La notificación aprobada de PayPhone llega a `/api/webhooks/payphone/NotificacionPago`; se vuelve a confirmar server-to-server, por lo que el webhook no es una autoridad ciega.
7. La emisión crea códigos QR, ledger y outbox. QStash procesa el correo; sin QStash, el cron drena el outbox en lotes pequeños.

## Variables de entorno

Copiar los nombres de `.env.example` al entorno correspondiente:

```text
NEXT_PUBLIC_APP_URL=https://viveloja.com
PAYPHONE_TOKEN=                  # Solo cuenta central de Vive Loja
PAYPHONE_STORE_ID=               # Solo cuenta central de Vive Loja
TICKETING_CREDENTIAL_ENCRYPTION_KEY=<base64 de 32 bytes>
QSTASH_TOKEN=<token de QStash>   # recomendado en producción
TICKETING_JOB_SECRET=<secreto aleatorio>
CRON_SECRET=<secreto del cron>
RESEND_API_KEY=<clave de Resend>
```

Generar la clave de cifrado sin pegarla en Git:

```bash
openssl rand -base64 32
```

Si se habilita QStash deben existir `QSTASH_TOKEN` y `TICKETING_JOB_SECRET`. QStash entrega el secreto como `x-ticketing-secret` al endpoint interno. Si falta cualquiera, el cron usa el fallback DB y no publica a QStash.

## Smoke test de staging

El comando es de sólo lectura por defecto:

```bash
TICKETING_SMOKE_BASE_URL=https://staging.viveloja.com \
TICKETING_SMOKE_EVENT_SLUG=evento-de-prueba \
npm run smoke:ticketing
```

En PowerShell:

```powershell
$env:TICKETING_SMOKE_BASE_URL = 'https://staging.viveloja.com'
$env:TICKETING_SMOKE_EVENT_SLUG = 'evento-de-prueba'
npm run smoke:ticketing
```

Para probar hold, repetición idempotente y liberación de inventario, agregar `TICKETING_SMOKE_ALLOW_MUTATIONS=1`. Para crear una orden pendiente y obtener un checkout PayPhone, agregar además `TICKETING_SMOKE_ALLOW_CHECKOUT=1` únicamente con credenciales sandbox.

## Migración y activación

La migración está en `prisma/migrations/20260911150000_event_ticketing/migration.sql`.

```bash
npx prisma migrate deploy
npx prisma generate
```

Después de migrar:

1. Confirmar que Plus tenga `eventTicketingEnabled=true` y Pro/Enterprise además `seatMapsEnabled=true`.
2. Configurar PayPhone central solo si Vive Loja será el vendedor de ese evento.
3. Para terceros, el organizador conecta su PayPhone desde la pantalla de edición del evento; se guarda Store ID + token cifrado. No usar tokens en variables `NEXT_PUBLIC_*` ni en iOS.
4. En el portal PayPhone autorizar la notificación externa apuntando al endpoint exacto `/api/webhooks/payphone/NotificacionPago`.
5. Probar en credenciales/entorno de prueba: hold concurrente, cancelación, pago aprobado, pago rechazado, callback repetido, webhook repetido, expiración, QR duplicado y devolución el mismo día.

La migración es aditiva, pero `migrate deploy` modifica la base de datos del entorno elegido; ejecutar backup y revisión de la URL de base de datos antes de producción.

## Operación

La configuración, cuentas, tipos de boleto, mapa de filas, ventas, CSV y devolución total están disponibles en la edición del evento del dashboard.

- La comisión de organizador se fuerza a cero mientras la cuenta no tenga capability `split=true`; así no se cobra una tarifa que Vive Loja no puede liquidar.
- PayPhone Reverse se usa para devolución total. En V1 solo se permite devolver antes de usar la entrada y el proveedor puede limitar la reversa a la ventana del mismo día.
- El escáner iOS es online-only en V1 y usa una actualización condicional para que dos dispositivos no acepten el mismo QR.
- iOS ofrece selección, reserva y datos del comprador de forma nativa, pero abre el checkout PayPhone en `SFSafariViewController`; no guarda credenciales de comercios ni usa StoreKit para entradas físicas.
- El QR público solo muestra el estado y datos mínimos de la entrada; no permite hacer check-in.
- Una devolución comienza en `REFUND_PENDING` antes de llamar a PayPhone; un timeout queda para conciliación operativa y no se marca falsamente como fallido.
- Los errores `DISPUTED` o pagos recibidos después del vencimiento requieren revisión administrativa.

## Endpoints principales

| Área | Endpoint |
| --- | --- |
| Público web | `GET /api/ticketing/events/:slug` |
| Hold web | `POST /api/ticketing/holds` |
| Checkout web | `POST /api/ticketing/checkouts` |
| Resultado | `GET /api/ticketing/status?clientTransactionId=...` |
| Orden pública | `GET /api/ticketing/orders/:token` |
| Callback PayPhone | `GET /api/ticketing/payphone/return` |
| Webhook PayPhone | `POST /api/webhooks/payphone/NotificacionPago` |
| App tickets | `GET /api/mobile/v1/me/tickets` |
| App check-in | `POST /api/mobile/v1/ticketing/check-ins` |
| Ventas | `GET /api/dashboard/events/:id/ticketing/orders` |
| Devolución | `POST /api/dashboard/ticketing/orders/:id/refund` |
