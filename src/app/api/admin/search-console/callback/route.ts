import { NextResponse, type NextRequest } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { getTokensFromCode } from '@/lib/google/search-console'

export async function GET(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

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
