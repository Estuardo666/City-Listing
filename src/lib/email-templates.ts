import 'server-only'
import { sendEmail, EMAIL_FROM } from './resend'

export async function sendNewReviewEmail(
  ownerEmail: string,
  ownerName: string,
  venueName: string,
  reviewerName: string,
  rating: number,
  reviewContent: string | null
) {
  const stars = '⭐'.repeat(rating)
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #059669;">Nueva reseña en ${venueName}</h2>
      <p>Hola ${ownerName},</p>
      <p><strong>${reviewerName}</strong> dejó una reseña en <strong>${venueName}</strong>:</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0;">${stars}</p>
        ${reviewContent ? `<p style="margin: 8px 0 0; color: #374151;">${reviewContent}</p>` : ''}
      </div>
      <p style="color: #6b7280; font-size: 12px;">Vive Loja — Tu plataforma de descubrimiento local</p>
    </div>
  `
  return sendEmail({ to: ownerEmail, subject: `Nueva reseña en ${venueName}`, html })
}

export async function sendReservationConfirmationEmail(
  userEmail: string,
  userName: string,
  venueName: string,
  date: string,
  time: string,
  partySize: number
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #059669;">Reserva confirmada</h2>
      <p>Hola ${userName},</p>
      <p>Tu reserva en <strong>${venueName}</strong> ha sido recibida:</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p><strong>Fecha:</strong> ${date}</p>
        <p><strong>Hora:</strong> ${time}</p>
        <p><strong>Personas:</strong> ${partySize}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px;">Vive Loja</p>
    </div>
  `
  return sendEmail({ to: userEmail, subject: `Reserva en ${venueName}`, html })
}

export async function sendNewCommentEmail(
  ownerEmail: string,
  ownerName: string,
  entityName: string,
  commenterName: string,
  commentContent: string
) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #059669;">Nuevo comentario en ${entityName}</h2>
      <p>Hola ${ownerName},</p>
      <p><strong>${commenterName}</strong> comentó en <strong>${entityName}</strong>:</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #374151;">${commentContent}</p>
      </div>
      <p style="color: #6b7280; font-size: 12px;">Vive Loja</p>
    </div>
  `
  return sendEmail({ to: ownerEmail, subject: `Nuevo comentario en ${entityName}`, html })
}
