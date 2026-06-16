import { NextRequest, NextResponse } from 'next/server'

function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

const SCRIPT_SRC_DOMAINS = [
  'https://va.vercel-scripts.com',
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'blob:',
].join(' ')

const STYLE_SRC_DOMAINS = [
  'https://api.mapbox.com',
  'https://fonts.googleapis.com',
].join(' ')

const CONNECT_SRC_DOMAINS = [
  'https://*.googleusercontent.com',
  'https://*.pusher.com',
  'wss://*.pusher.com',
  'https://api.groq.com',
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://va.vercel-scripts.com',
].join(' ')

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/admin/imports/google/slow')) {
    const host = request.headers.get('host') || ''
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    if (!isLocal) {
      return NextResponse.json(
        { error: 'La importación lenta solo está disponible en localhost' },
        { status: 403 }
      )
    }
  }

  const nonce = generateNonce()

  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${SCRIPT_SRC_DOMAINS}`,
    `style-src 'self' 'nonce-${nonce}' ${STYLE_SRC_DOMAINS}`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' ${CONNECT_SRC_DOMAINS}`,
    `worker-src 'self' blob:`,
    `child-src 'self' blob:`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
  ].join('; ')

  const response = NextResponse.next()

  const enforceCsp = process.env.CSP_ENFORCE === 'true'
  if (enforceCsp) {
    response.headers.set('Content-Security-Policy', csp)
  } else {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      `${csp}; report-uri /api/csp-report`
    )
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  )
  response.headers.set('x-nonce', nonce)

  return response
}

export const config = {
  matcher: ['/((?!api/csp-report).*)'],
}
