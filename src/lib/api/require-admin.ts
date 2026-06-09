import 'server-only'
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'

export async function requireAdmin(): Promise<Session | null> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }
  return session
}

export function unauthorized() {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
