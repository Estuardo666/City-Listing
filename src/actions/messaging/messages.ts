'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNewMessageEmail } from '@/lib/email/templates/new-message'
import type { ActionResponse } from '@/types/action-response'

export async function sendMessageAction(
  venueId: string,
  receiverId: string,
  content: string,
  images: string[] = []
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    if (!content?.trim() && images.length === 0) {
      return { success: false, error: 'El mensaje no puede estar vacío.' }
    }

    if (content && content.length > 1000) {
      return { success: false, error: 'El mensaje no puede exceder 1000 caracteres.' }
    }

    if (images.length > 5) {
      return { success: false, error: 'Máximo 5 imágenes por mensaje.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        userId: true,
        name: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })

    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        venueId,
        blockedUserId: session.user.id,
      },
    })

    if (isBlocked) {
      return { success: false, error: 'Has sido bloqueado de este local.' }
    }

    const isVenueOwner = venue.userId === session.user.id
    const isReceiverOwner = receiverId === venue.userId

    if (!isVenueOwner && !isReceiverOwner) {
      return { success: false, error: 'Destinatario inválido.' }
    }

    const message = await prisma.message.create({
      data: {
        content: content?.trim() || null,
        senderId: session.user.id,
        receiverId,
        venueId,
        images,
      },
    })

    if (receiverId === venue.userId && venue.user.email && content?.trim()) {
      const sender = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } })
      sendNewMessageEmail(venue.user.email, venue.user.name ?? '', sender?.name ?? 'Un usuario', venue.name, content.trim()).catch(() => {})
    }

    revalidatePath(`/dashboard/locales/${venueId}/mensajes`)
    revalidatePath(`/dashboard/mensajes`)

    return { success: true, data: { id: message.id } }
  } catch {
    return { success: false, error: 'No se pudo enviar el mensaje.' }
  }
}

export async function markAsReadAction(messageId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    await prisma.message.updateMany({
      where: {
        id: messageId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo marcar como leído.' }
  }
}

export async function markConversationAsReadAction(
  venueId: string,
  otherUserId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    await prisma.message.updateMany({
      where: {
        venueId,
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    revalidatePath(`/dashboard/locales/${venueId}/mensajes`)
    revalidatePath(`/dashboard/mensajes`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo marcar la conversación como leída.' }
  }
}

export async function deleteMessageAction(messageId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    })

    if (!message || message.senderId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para eliminar este mensaje.' }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null,
        images: [],
      },
    })

    revalidatePath(`/dashboard/mensajes`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar el mensaje.' }
  }
}

export async function closeConversationAction(
  venueId: string,
  otherUserId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    await prisma.message.updateMany({
      where: {
        venueId,
        OR: [
          { senderId: otherUserId, receiverId: session.user.id },
          { senderId: session.user.id, receiverId: otherUserId },
        ],
      },
      data: {
        isRead: true,
      },
    })

    revalidatePath(`/dashboard/locales/${venueId}/mensajes`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo cerrar la conversación.' }
  }
}

export async function reportMessageAction(
  messageId: string,
  reason: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const validReasons = ['SPAM', 'HARASSMENT', 'SCAM', 'OTHER']
    if (!validReasons.includes(reason)) {
      return { success: false, error: 'Razón de reporte inválida.' }
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, content: true },
    })

    if (!message) {
      return { success: false, error: 'Mensaje no encontrado.' }
    }

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: `[REPORTADO: ${reason}] ${message.content || ''}`,
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reportar el mensaje.' }
  }
}

export async function reportBusinessAction(
  venueId: string,
  description: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    if (!description?.trim()) {
      return { success: false, error: 'La descripción no puede estar vacía.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        userId: true,
        name: true,
        user: { select: { id: true, email: true, name: true } },
      },
    })

    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    const isBlocked = await prisma.blockedUser.findFirst({
      where: {
        venueId,
        blockedUserId: session.user.id,
      },
    })

    if (isBlocked) {
      return { success: false, error: 'Has sido bloqueado de este local.' }
    }

    const isVenueOwner = venue.userId === session.user.id

    if (isVenueOwner) {
      return { success: false, error: 'No puedes reportar tu propio negocio.' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: {
        status: 'PENDING',
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reportar el negocio.' }
  }
}
