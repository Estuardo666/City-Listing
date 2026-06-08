import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendReviewReplyEmail(
  to: string,
  userName: string,
  venueName: string,
  originalReview: string | null,
  replyContent: string
) {
  const html = emailLayout({
    title: 'Respondieron tu reseña',
    previewText: `El dueño de ${venueName} respondió tu reseña`,
    content: `
      <p style="margin:0 0 20px;">Hola ${userName}, el dueño de <strong>${venueName}</strong> respondió tu reseña.</p>
      ${originalReview ? `
      <div style="background:#FAFAFA;border-radius:8px;padding:14px;margin:0 0 12px;border-left:3px solid #E5E5E5;">
        <p style="margin:0;font-size:13px;color:#A3A3A3;">Tu reseña:</p>
        <p style="margin:4px 0 0;font-size:14px;color:#525252;">${originalReview}</p>
      </div>
      ` : ''}
      <div style="background:#FAFAFA;border-radius:8px;padding:14px;margin:0 0 20px;border-left:3px solid #16A34A;">
        <p style="margin:0;font-size:13px;color:#16A34A;">Respuesta del dueño:</p>
        <p style="margin:4px 0 0;font-size:14px;color:#171717;">${replyContent}</p>
      </div>
    `,
    ctaText: 'Ver reseña',
    ctaUrl: `${BASE_URL}/locales/${encodeURIComponent(venueName.toLowerCase().replace(/\s+/g, '-'))}`,
  })

  return sendTransactionalEmail({
    to,
    subject: `Respondieron tu reseña en ${venueName}`,
    html,
  })
}
