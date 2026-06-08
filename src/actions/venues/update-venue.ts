'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueSchema } from '@/schemas/venue.schema'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
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

    // Validate categories
    const categories = await prisma.category.findMany({
      where: {
        id: { in: parsed.data.categoryIds },
        type: 'VENUE',
      },
      select: { id: true },
    })

    if (categories.length !== parsed.data.categoryIds.length) {
      return {
        success: false,
        error: 'Una o más categorías seleccionadas no son válidas para locales.',
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.venueCategory.deleteMany({
        where: { venueId },
      })

      await tx.venueCategory.createMany({
        data: categories.map((cat) => ({
          venueId,
          categoryId: cat.id,
        })),
      })

      await tx.venueSubcategory.deleteMany({
        where: { venueId },
      })

      if (parsed.data.subcategoryIds && parsed.data.subcategoryIds.length > 0) {
        const subcategories = await tx.subcategory.findMany({
          where: { id: { in: parsed.data.subcategoryIds } },
          select: { id: true },
        })

        if (subcategories.length > 0) {
          await tx.venueSubcategory.createMany({
            data: subcategories.map((sub) => ({
              venueId,
              subcategoryId: sub.id,
            })),
          })
        }
      }

      return tx.venue.update({
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
          priceRange: parsed.data.priceRange,
          featured: parsed.data.featured,
        },
        include: {
          venueCategories: { include: { category: true } },
          venueSubcategories: { include: { subcategory: true } },
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
          media: { orderBy: { order: 'asc' } },
          operatingHours: true,
          businessHours: {
            orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
          },
          services: {
            orderBy: { sortOrder: 'asc' },
          },
          products: {
            orderBy: { order: 'asc' },
          },
          reviews: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
          },
          promotions: { where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' } },
          reservationSettings: true,
        },
      })
    })

    revalidatePath('/locales')
    revalidatePath(`/locales/${updated.slug}`)
    revalidatePath('/admin')
    revalidatePath('/admin/locales')
    revalidatePath('/dashboard')
    await invalidateVenueCache(venueId)

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
