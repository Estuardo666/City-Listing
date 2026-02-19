'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { formatDateTime } from '@/lib/utils'
import type { UpcomingEventNotification } from '@/types/event'
import type { CommentNotification } from '@/actions/notifications/pull-comment-notifications'

type StreamPayload = {
  notifications: UpcomingEventNotification[]
  commentNotifications?: CommentNotification[]
}

export function NotificationCenter() {
  const { data: session, status } = useSession()
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user?.id) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      return
    }

    if (eventSourceRef.current) return

    const es = new EventSource('/api/notifications/stream')
    eventSourceRef.current = es

    es.onmessage = (event) => {
      const payload: unknown = JSON.parse(event.data)
      const typed = payload as StreamPayload

      const items = typed.notifications ?? []
      for (const item of items) {
        toast(`Evento pronto: ${item.title}`, {
          description: `${formatDateTime(item.startDate)} · ${item.address ?? item.location}`,
          action: {
            label: 'Ver',
            onClick: () => {
              window.location.href = `/eventos/${item.slug}`
            },
          },
        })
      }

      const commentItems = typed.commentNotifications ?? []
      for (const item of commentItems) {
        const href =
          item.targetType === 'event'
            ? `/eventos/${item.targetSlug}`
            : item.targetType === 'venue'
              ? `/locales/${item.targetSlug}`
              : `/blog/${item.targetSlug}`

        toast(`Nuevo comentario en ${item.targetTitle}`, {
          description: `${item.authorName}: ${item.content}`,
          action: {
            label: 'Ver',
            onClick: () => {
              window.location.href = href
            },
          },
        })
      }
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [session?.user?.id, status])

  return null
}
