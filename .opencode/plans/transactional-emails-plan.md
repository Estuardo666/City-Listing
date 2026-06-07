# Plan de Implementación: Emails Transaccionales con Resend

## Estado Actual

- **Resend**: Instalado (`resend@6.12.4`), wrapper en `src/lib/resend.ts`, API key configurada
- **Templates existentes**: 3 funciones en `src/lib/email-templates.ts` (NUNCA llamadas):
  - `sendNewReviewEmail`
  - `sendReservationConfirmationEmail`
  - `sendNewCommentEmail`
- **Notificaciones in-app**: Activas vía SSE (eventos próximos + comentarios)
- **Web Push**: Parcialmente implementado (sin envío server-side)

---

## ESCENARIOS DE EMAIL TRANSACCIONAL

### 1. Bienvenida al registrarse
**Trigger**: Nuevo usuario crea cuenta
**Destinatario**: Usuario nuevo
**Contenido**:
- Saludo personalizado
- Breve introducción a Vive Loja
- CTA para explorar locales
- Enlaces a redes sociales

### 2. Confirmación de reserva
**Trigger**: Usuario crea una reserva
**Destinatario**: Usuario que reservó
**Contenido**:
- Detalles de la reserva (local, fecha, hora, personas)
- Dirección del local
- Botón para ver la reserva
- Instrucciones para cancelar

### 3. Notificación al dueño de nueva reserva
**Trigger**: Alguien reserva en su local
**Destinatario**: Dueño del venue
**Contenido**:
- Detalles del cliente (nombre, email)
- Detalles de la reserva
- Botón para confirmar/rechazar
- Link al dashboard

### 4. Estado de reserva actualizado
**Trigger**: Dueño confirma/rechaza una reserva
**Destinatario**: Usuario que reservó
**Contenido**:
- Estado nuevo (Confirmada/Rechazada)
- Detalles originales de la reserva
- Si fue rechazada: opción de reservar otro horario

### 5. Nueva reseña recibida
**Trigger**: Un usuario deja una reseña en un venue
**Destinatario**: Dueño del venue
**Contenido**:
- Nombre del reviewer
- Rating (estrellas)
- Contenido de la reseña
- Botón para responder

### 6. Respuesta a reseña
**Trigger**: Dueño responde a una reseña
**Destinatario**: Usuario que dejó la reseña
**Contenido**:
- Reseña original
- Respuesta del dueño
- Link al venue

### 7. Nuevo mensaje en inbox
**Trigger**: Un usuario envía mensaje a un negocio
**Destinatario**: Dueño del venue
**Contenido**:
- Nombre del remitente
- Preview del mensaje (primeros 100 chars)
- Botón para responder en el dashboard

### 8. Estado de venue actualizado
**Trigger**: Admin aprueba/rechaza un venue
**Destinatario**: Dueño del venue
**Contenido**:
- Estado nuevo (Aprobado/Rechazado)
- Si fue rechazado: razón y cómo corregir
- Link al dashboard

### 9. Venue destacado
**Trigger**: Admin marca un venue como destacado
**Destinatario**: Dueño del venue
**Contenido**:
- Felicitación
- Beneficios de ser destacado
- Link al venue

### 10. Newsletter semanal (opcional)
**Trigger**: Cron job cada lunes
**Destinatario**: Suscriptores de newsletter
**Contenido**:
- Eventos de la semana
- Nuevos locales destacados
- Ofertas activas

---

## ARQUITECTURA PROPUESTA

### Estructura de Archivos

```
src/lib/
├── resend.ts                    (EXISTE - wrapper)
├── email-templates.ts           (EXISTE - refactorizar)
└── email/
    ├── templates/
    │   ├── welcome.ts
    │   ├── reservation-confirmed.ts
    │   ├── reservation-notify-owner.ts
    │   ├── reservation-status-changed.ts
    │   ├── new-review.ts
    │   ├── review-reply.ts
    │   ├── new-message.ts
    │   ├── venue-approved.ts
    │   ├── venue-rejected.ts
    │   └── layout.ts            (HTML base compartido)
    ├── send.ts                  (función central de envío)
    └── types.ts                 (tipos compartidos)
```

### Template Base Compartido

```typescript
// src/lib/email/layout.ts
export function emailLayout(params: {
  title: string
  previewText: string
  content: string
  ctaText?: string
  ctaUrl?: string
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <!-- Header con logo -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #059669; font-size: 24px; margin: 0;">Vive Loja</h1>
          </div>
          
          <!-- Contenido -->
          <div style="background: white; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; font-size: 20px; margin: 0 0 16px;">${params.title}</h2>
            ${params.content}
            ${params.ctaText && params.ctaUrl ? `
              <div style="text-align: center; margin-top: 24px;">
                <a href="${params.ctaUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  ${params.ctaText}
                </a>
              </div>
            ` : ''}
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 32px; color: #6b7280; font-size: 14px;">
            <p>Vive Loja - Tu guía de locales en Loja, Ecuador</p>
            <p><a href="https://viveloja.com" style="color: #059669;">viveloja.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `
}
```

### Función Central de Envío

```typescript
// src/lib/email/send.ts
import { resend, EMAIL_FROM } from '@/lib/resend'

interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendTransactionalEmail(params: SendEmailParams) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? '',
    })
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}
```

---

## INTEGRACIÓN EN ACCIONES EXISTENTES

### 1. Registro de usuario
**Archivo**: `src/app/api/auth/signup/route.ts`
**Agregar después de crear usuario**:
```typescript
import { sendWelcomeEmail } from '@/lib/email/templates/welcome'
await sendWelcomeEmail(user.email, user.name)
```

### 2. Crear reserva
**Archivo**: `src/actions/reservations/create-reservation.ts`
**Agregar después de crear reserva**:
```typescript
import { sendReservationConfirmationEmail } from '@/lib/email/templates/reservation-confirmed'
import { sendNewReservationNotifyOwnerEmail } from '@/lib/email/templates/reservation-notify-owner'
await sendReservationConfirmationEmail(user.email, user.name, venue.name, date, time, partySize)
await sendNewReservationNotifyOwnerEmail(venue.user.email, user.name, venue.name, date, time, partySize)
```

### 3. Actualizar estado de reserva
**Archivo**: `src/actions/reservations/update-reservation-status.ts`
**Agregar después de actualizar**:
```typescript
import { sendReservationStatusChangedEmail } from '@/lib/email/templates/reservation-status-changed'
await sendReservationStatusChangedEmail(user.email, user.name, venue.name, newStatus, date, time)
```

### 4. Crear reseña
**Archivo**: `src/actions/reviews/create-review.ts`
**Agregar después de crear reseña**:
```typescript
import { sendNewReviewEmail } from '@/lib/email/templates/new-review'
await sendNewReviewEmail(venue.user.email, venue.user.name, venue.name, user.name, rating, content)
```

### 5. Responder reseña
**Archivo**: `src/actions/reviews/reply-review.ts`
**Agregar después de responder**:
```typescript
import { sendReviewReplyEmail } from '@/lib/email/templates/review-reply'
await sendReviewReplyEmail(review.user.email, review.user.name, venue.name, replyContent)
```

### 6. Enviar mensaje
**Archivo**: `src/actions/messaging/messages.ts`
**Agregar después de enviar mensaje**:
```typescript
import { sendNewMessageEmail } from '@/lib/email/templates/new-message'
await sendNewMessageEmail(venue.user.email, venue.user.name, sender.name, venue.name, messagePreview)
```

### 7. Actualizar estado de venue
**Archivo**: `src/actions/venues/update-venue-status.ts`
**Agregar después de actualizar**:
```typescript
import { sendVenueApprovedEmail, sendVenueRejectedEmail } from '@/lib/email/templates/venue-status'
if (newStatus === 'APPROVED') await sendVenueApprovedEmail(venue.user.email, venue.name)
if (newStatus === 'REJECTED') await sendVenueRejectedEmail(venue.user.email, venue.name, reason)
```

---

## PREFERENCIAS DE EMAIL

### Modelo Prisma (existente)

```prisma
model NotificationPreference {
  id         String   @id @default(cuid())
  userId     String   @unique
  enabled    Boolean  @default(true)
  hoursAhead Int      @default(48)
  ...
}
```

### Agregar campos de preferencia de email

```prisma
model NotificationPreference {
  ...
  emailNewReservations    Boolean @default(true)
  emailNewReviews         Boolean @default(true)
  emailNewMessages        Boolean @default(true)
  emailReservationUpdates Boolean @default(true)
  emailNewsletter         Boolean @default(true)
}
```

---

## TESTING

### Emails de prueba

```typescript
// En desarrollo, enviar todos los emails a una dirección de prueba
const DEV_EMAIL = 'test@viveloja.com'

export async function sendTransactionalEmail(params: SendEmailParams) {
  const to = process.env.NODE_ENV === 'production' ? params.to : DEV_EMAIL
  // ...
}
```

### Logs

```typescript
console.log(`📧 Email sent to ${to}: ${params.subject}`)
```

---

## IMPLEMENTACIÓN POR FASES

### Fase 1: Core (4h)
- [ ] Refactorizar `email-templates.ts` a estructura modular
- [ ] Crear template base compartido
- [ ] Crear función central de envío con logging
- [ ] Agregar preferencias de email al modelo NotificationPreference

### Fase 2: Emails críticos (6h)
- [ ] Email de bienvenida (registro)
- [ ] Confirmación de reserva (usuario)
- [ ] Notificación de nueva reserva (dueño)
- [ ] Estado de reserva actualizado (usuario)

### Fase 3: Emails de engagement (4h)
- [ ] Nueva reseña (dueño)
- [ ] Respuesta a reseña (usuario)
- [ ] Nuevo mensaje (dueño)

### Fase 4: Emails de plataforma (3h)
- [ ] Venue aprobado (dueño)
- [ ] Venue rechazado (dueño)

### Fase 5: Testing y monitoreo (3h)
- [ ] Configurar email de prueba en desarrollo
- [ ] Agregar logs de envío
- [ ] Crear página de preferencias de email
- [ ] Testing de todos los flujos

**Total estimado: ~20 horas**

---

## VARIABLES DE ENTORNO

```env
# Ya existe
RESEND_API_KEY="re_xxx"

# Agregar
EMAIL_FROM="Vive Loja <notifications@viveloja.com>"
EMAIL_DEV_TEST="test@viveloja.com"
```

---

## MÉTRICAS A MONITOREAR

- Emails enviados por día
- Tasa de apertura (Resend dashboard)
- Tasa de clics (Resend dashboard)
- Errores de envío
- Emails rebotados

---

## CONSIDERACIONES

1. **Rate limiting**: Resend free tier = 100 emails/día, 3000/mes
2. **Unsubscribe**: Agregar link en todos los emails
3. **SPF/DKIM**: Configurar en el dominio viveloja.com
4. **GDPR**: Solo enviar a usuarios que aceptaron términos
5. **Retry**: Implementar retry con backoff exponencial para fallos
