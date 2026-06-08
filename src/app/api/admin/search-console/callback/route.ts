import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTokensFromCode } from '@/lib/google/search-console'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Codigo de autorizacion no proporcionado' }, { status: 400 })
  }

  try {
    const tokens = await getTokensFromCode(code)

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL('/admin/search-console?error=no_refresh_token', request.url),
      )
    }

    const redirectUrl = new URL('/admin/search-console', request.url)
    redirectUrl.searchParams.set('setup', 'success')
    redirectUrl.searchParams.set('refresh_token', tokens.refresh_token)

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.redirect(
      new URL(`/admin/search-console?error=${encodeURIComponent(message)}`, request.url),
    )
  }
}
