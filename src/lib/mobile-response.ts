import { NextResponse } from 'next/server'

export function mobileSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) })
}

export function mobileError(code: string, message: string, status = 400, fields?: Record<string, string[]>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status })
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
      // Logged server-side only; the client gets no internal detail.
      console.error('[mobile-api] unhandled error', request.url, error)
      return mobileError('INTERNAL_ERROR', 'Ocurrió un problema en el servidor. Inténtalo de nuevo.', 500)
    }
  }
}
