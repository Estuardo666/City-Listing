import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendNewMessageEmail(
  to: string,
  ownerName: string,
  senderName: string,
  venueName: string,
  messagePreview: string
) {
  const truncated = messagePreview.length > 120 ? messagePreview.slice(0, 120) + '…' : messagePreview

  const html = emailLayout({
    title: 'Nuevo mensaje',
    previewText: `${senderName} te envió un mensaje`,
    content: `
      <p style="margin:0 0 20px;">Hola ${ownerName}, <strong>${senderName}</strong> te envió un mensaje sobre <strong>${venueName}</strong>.</p>
      <div style="background:#FAFAFA;border-radius:8px;padding:14px;margin:0 0 20px;border-left:3px solid #E5E5E5;">
        <p style="margin:0;font-size:14px;color:#171717;line-height:1.5;">"${truncated}"</p>
      </div>
      <p style="margin:0;font-size:13px;color:#A3A3A3;">Responder rápido mejora la experiencia de tus clientes.</p>
    `,
    ctaText: 'Responder',
    ctaUrl: `${BASE_URL}/dashboard/mensajes`,
  })

  return sendTransactionalEmail({
    to,
    subject: `Nuevo mensaje de ${senderName}`,
    html,
  })
}
