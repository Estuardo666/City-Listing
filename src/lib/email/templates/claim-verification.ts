import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendClaimVerificationEmail(
  to: string,
  claimerName: string,
  code: string,
) {
  const html = emailLayout({
    title: 'Verifica tu reclamo de negocio',
    previewText: `Tu código de verificación es ${code}`,
    content: `
      <p style="margin:0 0 16px;">Hola <strong>${claimerName}</strong>,</p>
      <p style="margin:0 0 24px;">Usa el siguiente código para verificar tu reclamo de negocio en Vive Loja:</p>

      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:8px;color:#171717;background:#F5F5F5;padding:16px 32px;border-radius:12px;font-family:monospace;">
          ${code}
        </span>
      </div>

      <p style="margin:0 0 8px;color:#737373;font-size:14px;">
        Este código expirará en <strong>15 minutos</strong>.
      </p>
      <p style="margin:0;color:#737373;font-size:14px;">
        Si no solicitaste este reclamo, puedes ignorar este correo.
      </p>
    `,
  })

  return sendTransactionalEmail({
    to,
    subject: 'Verifica tu reclamo de negocio',
    html,
  })
}
