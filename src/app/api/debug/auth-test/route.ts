import 'server-only'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const sessionA = await auth()
  const sessionB = await getServerSession(authOptions)

  const a = {
    id: sessionA?.user?.id ?? null,
    role: sessionA?.user?.role ?? null,
    email: sessionA?.user?.email ?? null,
    image: sessionA?.user?.image ?? null,
  }

  const b = {
    id: sessionB?.user?.id ?? null,
    role: sessionB?.user?.role ?? null,
    email: sessionB?.user?.email ?? null,
    image: sessionB?.user?.image ?? null,
  }

  return NextResponse.json({
    auth_wrapper: a,
    getServerSession: b,
    identical: JSON.stringify(a) === JSON.stringify(b),
    note: 'Delete this endpoint after validation',
  })
}
