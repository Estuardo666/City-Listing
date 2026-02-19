'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { eventSchema } from '@/schemas/event.schema'
import type { ActionResponse } from '@/types/action-response'
import type { EventWithRelations } from '@/types/event'

export async function updateEventAction(
  eventId: string,
  input: unknown
): Promise<ActionResponse<EventWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para editar eventos.',
      }
    }

    const parsed = eventSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para actualizar el evento.',
      }
    }

    // Check if event exists and user has permission
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true, slug: true },
    })

    if (!existingEvent) {
      return {
        success: false,
        error: 'Evento no encontrado.',
      }
    }

    // Only admin or event owner can edit
    if (session.user.role !== 'ADMIN' && existingEvent.userId !== session.user.id) {
      return {
        success: false,
        error: 'No tienes permiso para editar este evento.',
      }
    }

    // Validate category
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        type: 'EVENT',
      },
      select: { id: true },
    })

    if (!category) {
      return {
        success: false,
        error: 'La categoría seleccionada no es válida para eventos.',
      }
    }

    // Validate venue if provided
    if (parsed.data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: parsed.data.venueId,
          status: 'APPROVED',
        },
        select: { id: true },
      })

      if (!venue) {
        return {
          success: false,
          error: 'El local seleccionado no es válido o no está aprobado.',
        }
      }
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        content: parsed.data.content,
        image: parsed.data.image,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        location: parsed.data.location,
        address: parsed.data.address,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        featured: parsed.data.featured,
        categoryId: category.id,
        venueId: parsed.data.venueId,
      },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        venue: parsed.data.venueId ? {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        } : false,
      },
    })

    revalidatePath('/eventos')
    revalidatePath(`/eventos/${updated.slug}`)
    revalidatePath('/admin')
    revalidatePath('/admin/eventos')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updated,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el evento. Intenta nuevamente.',
    }
  }
}
