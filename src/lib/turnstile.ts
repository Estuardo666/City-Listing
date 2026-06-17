import 'server-only'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
}

export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY is not set')
    return { success: false, error: 'Configuración del servidor incorrecta' }
  }

  if (!token) {
    return { success: false, error: 'Token de verificación requerido' }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteip) {
      formData.append('remoteip', remoteip)
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    if (!response.ok) {
      console.error('Turnstile verification request failed:', response.status)
      return { success: false, error: 'Error al verificar token' }
    }

    const data: TurnstileResponse = await response.json()

    if (!data.success) {
      console.warn('Turnstile verification failed:', data['error-codes'])
      return { success: false, error: 'Verificación de seguridad fallida' }
    }

    return { success: true }
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return { success: false, error: 'Error al verificar seguridad' }
  }
}
