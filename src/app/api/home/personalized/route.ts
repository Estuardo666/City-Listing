import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPersonalizedHomeData } from '@/lib/queries/onboarding'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, {
      status: 401,
      headers: { 'Cache-Control': 'private, no-store' },
    })
  }

  const data = await getPersonalizedHomeData(session.user.id)
  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 'private, no-store' },
  })
}
