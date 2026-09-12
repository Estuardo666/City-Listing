import 'server-only'
import { sendTransactionalEmail, emailLayout } from '../send'

export async function sendVerificationCodeEmail(to: string, code: string, intent: 'visitor' | 'business' = 'visitor') {
  const formattedCode = code.split('').join(' ')
  const isBusiness = intent === 'business'

  const html = emailLayout({
    title: isBusiness ? 'Verifica tu correo para publicar tu negocio' : 'Tu código de verificación',
    previewText: `Tu código de Vive Loja es ${code}`,
    content: `
      <p style="margin:0 0 20px;">Usa el siguiente código para ${isBusiness ? 'verificar tu correo y continuar con la publicación de tu negocio' : 'verificar tu correo y crear tu cuenta'}:</p>
      <div style="text-align:center;margin:24px 0;">
        <span style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:8px;color:#171717;background:#F5F5F5;padding:16px 32px;border-radius:12px;font-family:monospace;">
          ${formattedCode}
        </span>
      </div>
      <p style="margin:0 0 8px;color:#737373;font-size:13px;">Este código expira en <strong>10 minutos</strong>.</p>
      <p style="margin:0;color:#737373;font-size:13px;">Si no solicitaste este código, puedes ignorar este mensaje.</p>
    `,
  })

  return sendTransactionalEmail({
    to,
    subject: isBusiness ? 'Verifica tu correo para publicar tu negocio — Vive Loja' : 'Tu código de verificación — Vive Loja',
    html,
  })
}
