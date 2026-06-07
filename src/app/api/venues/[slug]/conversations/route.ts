import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { slug } = await params

    const venue = await prisma.venue.findFirst({
      where: {
        slug,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    })

    if (!venue) {
      return NextResponse.json({ error: 'Local no encontrado' }, { status: 404 })
    }

    const messages = await prisma.message.findMany({
      where: {
        venueId: venue.id,
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    const conversationMap = new Map<string, {
      otherUserId: string
      lastMessage: typeof messages[0] | null
      unreadCount: number
      messages: typeof messages
    }>()

    for (const message of messages) {
      const otherUserId = message.senderId === session.user.id 
        ? message.receiverId 
        : message.senderId

      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, {
          otherUserId,
          lastMessage: null,
          unreadCount: 0,
          messages: [],
        })
      }

      const conv = conversationMap.get(otherUserId)!
      conv.messages.push(message)

      if (!conv.lastMessage) {
        conv.lastMessage = message
      }

      if (message.receiverId === session.user.id && !message.isRead) {
        conv.unreadCount++
      }
    }

    const conversations = await Promise.all(
      Array.from(conversationMap.values()).map(async (conv) => {
        const otherUser = await prisma.user.findUnique({
          where: { id: conv.otherUserId },
          select: {
            id: true,
            name: true,
            image: true,
          },
        })

        return {
          id: conv.otherUserId,
          otherUser: {
            id: otherUser?.id ?? conv.otherUserId,
            name: otherUser?.name ?? 'Usuario',
            image: otherUser?.image ?? null,
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt,
            isRead: conv.lastMessage.isRead,
            senderId: conv.lastMessage.senderId,
          } : null,
          unreadCount: conv.unreadCount,
          isClosed: false,
        }
      })
    )

    conversations.sort((a, b) => {
      if (!a.lastMessage || !b.lastMessage) return 0
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    })

    return NextResponse.json({
      venueId: venue.id,
      conversations,
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
