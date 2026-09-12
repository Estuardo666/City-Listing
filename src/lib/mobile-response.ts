import { NextResponse } from 'next/server'
import { TicketingError } from '@/lib/ticketing/constants'

export function mobileSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) })
}

export function mobileError(code: string, message: string, status = 400, fields?: Record<string, string[]>, context?: Record<string, unknown>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}), ...(context ? { context } : {}) } }, { status })
}

type MobileRouteHandler<Args extends unknown[]> = (request: Request, ...args: Args) => Promise<Response>

/**
 * Wraps a mobile route so an unhandled exception still answers with the error
 * envelope clients parse. Without it the platform returns an empty 500 with no
 * content-type, which the iOS app can only surface as a generic failure.
 */
export function withMobileErrors<Args extends unknown[]>(
  handler: MobileRouteHandler<Args>,
): MobileRouteHandler<Args> {
  return async (request, ...args) => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      if (error instanceof TicketingError) return mobileError(error.code, error.message, error.status, undefined, error.context)
      // Logged server-side only; the client gets no internal detail.
      // Never log bearer tokens or private query strings from a request URL.
      console.error('[mobile-api] unhandled error', new URL(request.url).pathname, error)
      return mobileError('INTERNAL_ERROR', 'Ocurrió un problema en el servidor. Inténtalo de nuevo.', 500)
    }
  }
}
