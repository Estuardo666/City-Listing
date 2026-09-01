import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para recibir mensajes.', 401)
  const url = new URL(request.url)
  const sinceValue = url.searchParams.get('since')
  const since = sinceValue ? new Date(sinceValue) : null
  if (since && Number.isNaN(since.getTime())) return mobileError('VALIDATION_ERROR', 'El cursor de mensajes no es válido.', 422)

  const initial = await prisma.message.findMany({
    where: {
      OR: [{ senderId: principal.userId }, { receiverId: principal.userId }],
      ...(since ? { createdAt: { gt: since } } : {}),
    },
    orderBy: { createdAt: 'asc' }, take: 100,
    select: { id: true, venueId: true, senderId: true, receiverId: true, content: true, images: true, isRead: true, createdAt: true },
  })

  const encoder = new TextEncoder()
  let heartbeat: ReturnType<typeof setInterval> | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      send('connected', { at: new Date().toISOString() })
      for (const message of initial) send('message', message)
      heartbeat = setInterval(() => send('ping', { at: new Date().toISOString() }), 15_000)
      timeout = setTimeout(() => {
        if (heartbeat) clearInterval(heartbeat)
        controller.close()
      }, 60_000)
      request.signal.addEventListener('abort', () => {
        if (heartbeat) clearInterval(heartbeat)
        if (timeout) clearTimeout(timeout)
        try { controller.close() } catch { /* already closed */ }
      }, { once: true })
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat)
      if (timeout) clearTimeout(timeout)
    },
  })
  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
}
