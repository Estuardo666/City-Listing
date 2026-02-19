'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { slugify } from '@/lib/utils'
import { eventSchema } from '@/schemas/event.schema'
import type { ActionResponse } from '@/types/action-response'
import type { EventWithRelations } from '@/types/event'

async function generateUniqueEventSlug(baseTitle: string): Promise<string> {
  const baseSlug = slugify(baseTitle)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.event.findUnique({
      where: {
        slug: candidateSlug,
      },
      select: {
        id: true,
      },
    })

    if (!existing) {
      return candidateSlug
    }

    suffix += 1
    candidateSlug = `${baseSlug}-${suffix}`
  }
}

export async function createEventAction(input: unknown): Promise<ActionResponse<EventWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para crear eventos.',
      }
    }

    const parsed = eventSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para crear el evento.',
      }
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        type: 'EVENT',
      },
      select: {
        id: true,
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'La categoría seleccionada no es válida para eventos.',
      }
    }

    if (parsed.data.venueId) {
      const venue = await prisma.venue.findFirst({
        where: {
          id: parsed.data.venueId,
          status: 'APPROVED',
        },
        select: {
          id: true,
        },
      })

      if (!venue) {
        return {
          success: false,
          error: 'El local seleccionado no está disponible.',
        }
      }
    }

    const slug = await generateUniqueEventSlug(parsed.data.title)

    const created = await prisma.event.create({
      data: {
        title: parsed.data.title,
        slug,
        description: parsed.data.description,
        content: parsed.data.content,
        image: parsed.data.image,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        price: parsed.data.price,
        location: parsed.data.location,
        address: parsed.data.address,
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        venueId: parsed.data.venueId,
        featured: parsed.data.featured,
        status: 'APPROVED',
        categoryId: category.id,
        userId: session.user.id,
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
        venue: true,
      },
    })

    revalidatePath('/eventos')

    return {
      success: true,
      data: created,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo crear el evento. Intenta nuevamente.',
    }
  }
}
