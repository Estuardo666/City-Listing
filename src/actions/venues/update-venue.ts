'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueSchema } from '@/schemas/venue.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueWithRelations } from '@/types/venue'

export async function updateVenueAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<VenueWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para editar locales.',
      }
    }

    const parsed = venueSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para actualizar el local.',
      }
    }

    // Check if venue exists and user has permission
    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true },
    })

    if (!existingVenue) {
      return {
        success: false,
        error: 'Local no encontrado.',
      }
    }

    // Only admin or venue owner can edit
    if (session.user.role !== 'ADMIN' && existingVenue.userId !== session.user.id) {
      return {
        success: false,
        error: 'No tienes permiso para editar este local.',
      }
    }

    // Validate category
    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        type: 'VENUE',
      },
      select: { id: true },
    })

    if (!category) {
      return {
        success: false,
        error: 'La categoría seleccionada no es válida para locales.',
      }
    }

    const updated = await prisma.venue.update({
      where: { id: venueId },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        content: parsed.data.content,
        image: parsed.data.image,
        phone: parsed.data.phone,
        email: parsed.data.email,
        website: parsed.data.website,
        location: parsed.data.location,
        address: parsed.data.address,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        featured: parsed.data.featured,
        categoryId: category.id,
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
        events: {
          where: {
            status: 'APPROVED',
          },
          orderBy: {
            startDate: 'asc',
          },
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            location: true,
            address: true,
          },
        },
      },
    })

    revalidatePath('/locales')
    revalidatePath(`/locales/${updated.slug}`)
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updated,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo actualizar el local. Intenta nuevamente.',
    }
  }
}
