import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendVenueApprovedEmail(
  to: string,
  venueName: string,
  venueSlug: string
) {
  const html = emailLayout({
    title: 'Tu local fue aprobado',
    previewText: `${venueName} ya está visible en Vive Loja`,
    content: `
      <p style="margin:0 0 16px;">Buenas noticias. <strong>${venueName}</strong> fue revisado y aprobado.</p>
      <p style="margin:0;">Ya es visible para todos los usuarios de Vive Loja. Podés empezar a recibir visitas, reseñas y reservas.</p>
    `,
    ctaText: 'Ver mi local',
    ctaUrl: `${BASE_URL}/locales/${venueSlug}`,
    ctaColor: '#16A34A',
  })

  return sendTransactionalEmail({
    to,
    subject: `${venueName} está en línea`,
    html,
  })
}

export async function sendVenueRejectedEmail(
  to: string,
  venueName: string,
  reason: string | null
) {
  const html = emailLayout({
    title: 'Tu local necesita cambios',
    previewText: `${venueName} no pudo ser aprobado`,
    content: `
      <p style="margin:0 0 16px;">Revisamos <strong>${venueName}</strong> y no pudimos aprobarlo por el siguiente motivo:</p>
      <div style="background:#FEF2F2;border-radius:8px;padding:14px;margin:0 0 20px;border-left:3px solid #DC2626;">
        <p style="margin:0;font-size:14px;color:#171717;">${reason ?? 'No se especificó un motivo.'}</p>
      </div>
      <p style="margin:0;">Podés editar tu local y volver a enviarlo para revisión.</p>
    `,
    ctaText: 'Editar mi local',
    ctaUrl: `${BASE_URL}/dashboard/locales`,
    ctaColor: '#DC2626',
  })

  return sendTransactionalEmail({
    to,
    subject: `${venueName} — Acción requerida`,
    html,
  })
}
