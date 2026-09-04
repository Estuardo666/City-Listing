/** Only return known diagnostics to admins, never raw upstream responses. */
export function googleImportError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
    return { status: 502, code: 'GOOGLE_KEY_REFERRER_BLOCKED', error: 'Google bloqueó la clave porque está restringida a sitios web. Configura GOOGLE_PLACES_API_KEY con una clave para llamadas desde el servidor, autorizada para Places API (New).' }
  }
  if (message.includes('SERVICE_DISABLED')) {
    return { status: 502, code: 'GOOGLE_PLACES_DISABLED', error: 'Places API (New) está deshabilitada en el proyecto de la clave de Google. Actívala en Google Cloud y vuelve a intentar.' }
  }
  if (message.includes('API key not configured')) {
    return { status: 503, code: 'GOOGLE_KEY_MISSING', error: 'Falta GOOGLE_PLACES_API_KEY en el servidor. Configúrala en el entorno de Vercel y vuelve a desplegar.' }
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('API error: 429')) {
    return { status: 429, code: 'GOOGLE_QUOTA_EXCEEDED', error: 'Google alcanzó el límite de solicitudes o de cuota. Revisa la cuota de Places API y vuelve a intentar más tarde.' }
  }
  if (message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID')) {
    return { status: 502, code: 'GOOGLE_ACCESS_DENIED', error: 'Google rechazó la solicitud. Revisa la clave, sus restricciones de API y la facturación del proyecto en Google Cloud.' }
  }
  return { status: 502, code: 'GOOGLE_REQUEST_FAILED', error: 'No se pudo completar la consulta a Google Places. Vuelve a intentar; si persiste, revisa los logs del servidor.' }
}
