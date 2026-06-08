import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendWelcomeEmail(to: string, name: string | null) {
  const displayName = name?.split(' ')[0] ?? 'Hola'
  const html = emailLayout({
    title: `Bienvenido, ${displayName}`,
    previewText: 'Tu cuenta en Vive Loja está lista',
    content: `
      <p style="margin:0 0 16px;">Tu cuenta ya está activa. Podés explorar locales, hacer reservas, dejar reseñas y guardar tus favoritos.</p>
      <p style="margin:0;">Si tenés un negocio, podés registrarlo desde tu panel y empezar a recibir clientes.</p>
    `,
    ctaText: 'Explorar locales',
    ctaUrl: `${BASE_URL}/explorar`,
  })

  return sendTransactionalEmail({
    to,
    subject: 'Tu cuenta en Vive Loja está lista',
    html,
  })
}
