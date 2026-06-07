import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id: conversationId } = await params

    const [venueId, otherUserId] = conversationId.split('-')

    if (!venueId || !otherUserId) {
      return NextResponse.json({ error: 'ID de conversación inválido' }, { status: 400 })
    }

    const venue = await prisma.venue.findFirst({
      where: {
        id: venueId,
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
          {
            senderId: session.user.id,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: session.user.id,
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
    })

    await prisma.message.updateMany({
      where: {
        venueId: venue.id,
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({
      messages: messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt.toISOString(),
        readAt: msg.readAt?.toISOString() ?? null,
      })),
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
