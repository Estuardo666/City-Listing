import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendNewReviewEmail(
  to: string,
  ownerName: string,
  venueName: string,
  reviewerName: string,
  rating: number,
  reviewContent: string | null
) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)

  const html = emailLayout({
    title: 'Nueva reseña',
    previewText: `${reviewerName} dejó una reseña en ${venueName}`,
    content: `
      <p style="margin:0 0 20px;">Hola ${ownerName}, <strong>${reviewerName}</strong> dejó una reseña en <strong>${venueName}</strong>.</p>
      <div style="background:#FAFAFA;border-radius:8px;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 8px;font-size:18px;color:#D97706;letter-spacing:2px;">${stars}</p>
        ${reviewContent ? `<p style="margin:0;font-size:14px;color:#171717;line-height:1.5;">${reviewContent}</p>` : ''}
      </div>
      <p style="margin:0;font-size:13px;color:#A3A3A3;">Responder a las reseñas mejora la visibilidad de tu local.</p>
    `,
    ctaText: 'Responder reseña',
    ctaUrl: `${BASE_URL}/dashboard/locales`,
  })

  return sendTransactionalEmail({
    to,
    subject: `Nueva reseña en ${venueName} — ${rating}★`,
    html,
  })
}
