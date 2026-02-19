import { NextResponse } from 'next/server'
import { pullUpcomingEventNotificationsAction } from '@/actions/notifications'

export async function GET() {
  const result = await pullUpcomingEventNotificationsAction({})

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? 'Error' }, { status: 401 })
  }

  return NextResponse.json({ notifications: result.data ?? [] })
}
