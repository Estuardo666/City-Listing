import 'server-only'
import { sendTransactionalEmail, emailLayout, BASE_URL } from '../send'

export async function sendOnboardingCompleteEmail(
  to: string,
  name: string | null,
  interestsCount: number,
  venuesCount: number
) {
  const displayName = name?.split(' ')[0] ?? 'Hola'

  const html = emailLayout({
    title: `Tu ViveLoja está personalizado, ${displayName}`,
    previewText: 'Tus preferencias han sido configuradas correctamente',
    content: `
      <p style="margin:0 0 16px;">Bienvenido a ViveLoja. Tus preferencias han sido configuradas correctamente.</p>
      <p style="margin:0 0 16px;">Seleccionaste <strong>${interestsCount} intereses</strong> y estás siguiendo <strong>${venuesCount} lugares</strong>.</p>
      <p style="margin:0;">Comienza a descubrir lugares, eventos y experiencias en Loja. Explora, guarda favoritos, crea colecciones y escribe reseñas.</p>
    `,
    ctaText: 'Comenzar a explorar',
    ctaUrl: `${BASE_URL}/`,
  })

  return sendTransactionalEmail({
    to,
    subject: 'Tu ViveLoja está listo',
    html,
  })
}
