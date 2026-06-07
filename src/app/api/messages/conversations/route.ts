import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const venues = await prisma.venue.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
      },
    })

    const venueIds = venues.map((v) => v.id)

    if (venueIds.length === 0) {
      return NextResponse.json({ conversations: [] })
    }

    const messages = await prisma.message.findMany({
      where: {
        venueId: { in: venueIds },
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
    })

    const conversationMap = new Map<string, {
      venueId: string
      otherUserId: string
      lastMessage: typeof messages[0] | null
      unreadCount: number
      messages: typeof messages
    }>()

    for (const message of messages) {
      const otherUserId = message.senderId === session.user.id 
        ? message.receiverId 
        : message.senderId

      const conversationKey = `${message.venueId}-${otherUserId}`

      if (!conversationMap.has(conversationKey)) {
        conversationMap.set(conversationKey, {
          venueId: message.venueId,
          otherUserId,
          lastMessage: null,
          unreadCount: 0,
          messages: [],
        })
      }

      const conv = conversationMap.get(conversationKey)!
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
        const [otherUser, venue] = await Promise.all([
          prisma.user.findUnique({
            where: { id: conv.otherUserId },
            select: {
              id: true,
              name: true,
              image: true,
            },
          }),
          prisma.venue.findUnique({
            where: { id: conv.venueId },
            select: {
              id: true,
              name: true,
            },
          }),
        ])

        return {
          id: conv.venueId + '-' + conv.otherUserId,
          venueId: conv.venueId,
          venueName: venue?.name ?? 'Local',
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

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
