'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { slugify } from '@/lib/utils'
import { eventSchema } from '@/schemas/event.schema'
import { invalidateEventCache } from '@/lib/cache-invalidation'
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

    const categories = await prisma.category.findMany({
      where: {
        id: { in: parsed.data.categoryIds },
        type: 'EVENT',
      },
      select: {
        id: true,
      },
    })

    if (categories.length !== parsed.data.categoryIds.length) {
      return {
        success: false,
        error: 'Una o más categorías seleccionadas no son válidas para eventos.',
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

    const created = await prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
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
          userId: session.user.id,
        },
      })

      await tx.eventCategory.createMany({
        data: categories.map((cat) => ({
          eventId: event.id,
          categoryId: cat.id,
        })),
      })

      return tx.event.findUniqueOrThrow({
        where: { id: event.id },
        include: {
          eventCategories: { include: { category: true } },
          eventSubcategories: { include: { subcategory: true } },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          venue: true,
          media: { orderBy: { order: 'asc' } },
          reviews: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
          },
          recurrenceRule: true,
        },
      })
    })

    revalidatePath('/eventos')
    await invalidateEventCache(created.id)

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
