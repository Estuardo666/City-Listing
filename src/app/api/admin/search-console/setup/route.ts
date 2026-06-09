import { NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { getAuthUrl } from '@/lib/google/search-console'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
