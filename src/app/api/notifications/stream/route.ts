import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pullUpcomingEventNotificationsAction } from '@/actions/notifications'
import { pullCommentNotificationsAction } from '@/actions/notifications'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()

  let intervalId: NodeJS.Timeout | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = async () => {
        const [eventResult, commentResult] = await Promise.all([
          pullUpcomingEventNotificationsAction({}),
          pullCommentNotificationsAction(),
        ])

        const eventNotifications = eventResult.success ? eventResult.data ?? [] : []
        const commentNotifications = commentResult.success ? commentResult.data ?? [] : []

        if (eventNotifications.length > 0 || commentNotifications.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                notifications: eventNotifications,
                commentNotifications,
              })}\n\n`
            )
          )
        }
      }

      controller.enqueue(encoder.encode('event: ready\ndata: {}\n\n'))

      intervalId = setInterval(() => {
        void send()
      }, 30_000)

      void send()
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
