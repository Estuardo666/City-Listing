import { NextRequest, NextResponse } from 'next/server'

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/admin/imports/google/slow/:path*'],
}
