'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

export type CommentNotification = {
  id: string
  content: string
  createdAt: Date
  authorName: string
  targetType: 'event' | 'venue' | 'post'
  targetTitle: string
  targetSlug: string
}

export async function pullCommentNotificationsAction(): Promise<ActionResponse<CommentNotification[]>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const since = new Date(Date.now() - 35_000)

    type RawCommentNotification = {
      id: string
      content: string
      createdAt: Date
      user: { name: string | null }
      event: { title: string; slug: string } | null
      venue: { name: string; slug: string } | null
      post: { title: string; slug: string } | null
    }

    const prismaAny = prisma as unknown as {
      comment: {
        findMany: (args: unknown) => Promise<RawCommentNotification[]>
      }
    }

    const comments = await prismaAny.comment.findMany({
      where: {
        createdAt: { gte: since },
        NOT: { userId: session.user.id },
        OR: [
          { event: { userId: session.user.id } },
          { venue: { userId: session.user.id } },
          { post: { userId: session.user.id } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { name: true } },
        event: { select: { title: true, slug: true } },
        venue: { select: { name: true, slug: true } },
        post: { select: { title: true, slug: true } },
      },
    })

    const notifications: CommentNotification[] = comments.map((comment: RawCommentNotification) => {
      if (comment.event) {
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          authorName: comment.user.name ?? 'Usuario',
          targetType: 'event',
          targetTitle: comment.event.title,
          targetSlug: comment.event.slug,
        }
      }
      if (comment.venue) {
        return {
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          authorName: comment.user.name ?? 'Usuario',
          targetType: 'venue',
          targetTitle: comment.venue.name,
          targetSlug: comment.venue.slug,
        }
      }
      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        authorName: comment.user.name ?? 'Usuario',
        targetType: 'post',
        targetTitle: comment.post?.title ?? 'Publicación',
        targetSlug: comment.post?.slug ?? '',
      }
    })

    return { success: true, data: notifications }
  } catch {
    return { success: false, error: 'No se pudieron cargar notificaciones de comentarios.' }
  }
}
