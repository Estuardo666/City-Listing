import { getTicketCheckoutProviderUrl } from '@/lib/ticketing'
import { payphoneRedirectDocument } from '@/lib/ticketing/provider/payphone'

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  'Content-Type': 'text/html; charset=utf-8',
  'Referrer-Policy': 'origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')?.trim() ?? ''
  if (token.length < 20 || token.length > 160) {
    return new Response('<!doctype html><html lang="es"><body><p>El enlace de pago no es válido.</p></body></html>', { status: 400, headers: responseHeaders })
  }
  try {
    const checkoutUrl = await getTicketCheckoutProviderUrl(token)
    return new Response(payphoneRedirectDocument(checkoutUrl), { headers: responseHeaders })
  } catch {
    return new Response('<!doctype html><html lang="es"><body><p>La sesión de pago no existe o expiró. Regresa a Vive Loja e inténtalo de nuevo.</p></body></html>', { status: 410, headers: responseHeaders })
  }
}
