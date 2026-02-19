import { NextRequest, NextResponse } from 'next/server'
import { getNotificationPreferencesAction, updateNotificationPreferencesAction } from '@/actions/notifications'

export async function GET() {
  const result = await getNotificationPreferencesAction()

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Error' }, { status: 401 })
  }

  return NextResponse.json({ preferences: result.data })
}

export async function PUT(request: NextRequest) {
  const body: unknown = await request.json().catch(() => ({}))

  const result = await updateNotificationPreferencesAction(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Error' }, { status: 400 })
  }

  return NextResponse.json({ preferences: result.data })
}
