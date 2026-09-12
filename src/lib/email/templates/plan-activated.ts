import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

type PlanActivatedEmailInput = {
  to: string
  name: string | null
  planName: string
  cycle: string | null
  referenceAmount: number
  startsAt: Date | string | null
  endsAt: Date | string | null
  idempotencyKey: string
}

const money = (value: number) => new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(value)

const date = (value: Date | string | null) => value
  ? new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeZone: 'America/Guayaquil' }).format(new Date(value))
  : '—'

export async function sendPlanActivatedEmail(input: PlanActivatedEmailInput) {
  const displayName = input.name?.trim().split(/\s+/)[0] || 'Hola'
  const cycleLabel = input.cycle === 'ANNUAL' ? 'anual' : 'mensual'

  const html = emailLayout({
    title: `Tu plan ${input.planName} ya está activo`,
    previewText: `Tu plan ${input.planName} quedó activado en Vive Loja`,
    content: `
      <p style="margin:0 0 16px;">Hola <strong>${displayName}</strong>,</p>
      <p style="margin:0 0 20px;">Ya puedes publicar y administrar tu negocio en Vive Loja. Esta activación corresponde al periodo beta y no genera un cobro ni una renovación automática.</p>
      <div style="margin:20px 0;padding:16px;background:#F5F5F5;border-radius:12px;">
        <p style="margin:0 0 8px;"><strong>Plan:</strong> ${input.planName}</p>
        <p style="margin:0 0 8px;"><strong>Ciclo:</strong> ${cycleLabel}</p>
        <p style="margin:0 0 8px;"><strong>Precio de referencia:</strong> ${money(input.referenceAmount)}</p>
        <p style="margin:0 0 8px;"><strong>Total cobrado:</strong> $0,00 durante la beta</p>
        <p style="margin:0;"><strong>Vigencia:</strong> ${date(input.startsAt)} — ${date(input.endsAt)}</p>
      </div>
      <p style="margin:0;">Completa los datos de tu local y envíalo a revisión cuando esté listo.</p>
    `,
    ctaText: 'Publicar mi negocio',
    ctaUrl: `${BASE_URL}/dashboard/locales/crear`,
    ctaColor: '#312E81',
  })

  return sendTransactionalEmail({
    to: input.to,
    subject: `Plan ${input.planName} activado · Vive Loja`,
    html,
    idempotencyKey: input.idempotencyKey,
  })
}
