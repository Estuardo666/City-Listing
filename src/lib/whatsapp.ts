/**
 * Limpia y formatea un número de teléfono para uso en WhatsApp.
 * Asume código de país Ecuador (593) si no se proporciona.
 */
export function formatWhatsAppPhone(phone: string): string | null {
  if (!phone) return null

  // Quitar todo excepto dígitos y +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Si empieza con +, quitar el +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1)
  }

  // Si empieza con 0 (número local Ecuador), quitar el 0 y agregar 593
  if (cleaned.startsWith('0') && cleaned.length >= 9) {
    cleaned = '593' + cleaned.slice(1)
  }

  // Si no empieza con 593 y tiene 9-10 dígitos, asumir Ecuador
  if (!cleaned.startsWith('593') && cleaned.length >= 9 && cleaned.length <= 10) {
    cleaned = '593' + cleaned
  }

  // Validar que tenga al menos 12 dígitos (593 + 9 dígitos)
  if (cleaned.length < 12) return null

  return cleaned
}

/**
 * Genera un mensaje preformateado para WhatsApp según el contexto del venue.
 */
export function buildWhatsAppMessage(venue: {
  name: string
  hasMenu?: boolean
  acceptsReservations?: boolean
}): string {
  const greeting = `Hola, vi tu perfil en *Vive Loja* y me gustaría contactarte.`

  if (venue.hasMenu) {
    return `${greeting}\n\nQuisiera hacer un pedido o consultar sobre el menú de *${venue.name}*.`
  }

  if (venue.acceptsReservations) {
    return `${greeting}\n\nQuisiera reservar una mesa en *${venue.name}*.`
  }

  return `${greeting}\n\nMe gustaría saber más sobre *${venue.name}*.`
}

/**
 * Construye la URL completa de WhatsApp con mensaje preformateado.
 */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const formattedPhone = formatWhatsAppPhone(phone)
  if (!formattedPhone) return null

  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}
