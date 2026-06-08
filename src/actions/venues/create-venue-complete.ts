'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { venueSchema } from '@/schemas/venue.schema'
import { invalidateVenueCache } from '@/lib/cache-invalidation'
import type { ActionResponse } from '@/types/action-response'
import type { VenueWithRelations } from '@/types/venue'

interface BusinessHoursInput {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

interface ServiceInput {
  name: string
  description?: string | null
  icon?: string | null
  isCustom?: boolean
}

interface MenuItemInput {
  name: string
  description?: string | null
  price?: number | null
  image?: string | null
}

interface MenuCategoryInput {
  name: string
  items: MenuItemInput[]
}

interface ProductInput {
  name: string
  description?: string | null
  price?: number | null
  image?: string | null
}

export interface VenueCompleteInput {
  basic: {
    name: string
    description: string
    content?: string | null
    image?: string | null
    categoryIds: string[]
    priceRange?: string | null
  }
  location: {
    location: string
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
    lat?: number | null
    lng?: number | null
  }
  businessHours: BusinessHoursInput[]
  services: ServiceInput[]
  menuCategories: MenuCategoryInput[]
  products: ProductInput[]
}

async function generateUniqueVenueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.venue.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    })

    if (!existing) return candidateSlug
    suffix += 1
    candidateSlug = `${baseSlug}-${suffix}`
  }
}

export async function createVenueCompleteAction(
  input: VenueCompleteInput
): Promise<ActionResponse<VenueWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para registrar locales.',
      }
    }

    const venueData = {
      ...input.basic,
      ...input.location,
    }

    const parsed = venueSchema.safeParse(venueData)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para crear el local.',
      }
    }

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

    const slug = await generateUniqueVenueSlug(parsed.data.name)

    const created = await prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
        data: {
          name: parsed.data.name,
          slug,
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
          status: 'PENDING',
          userId: session.user.id,
        },
      })

      await tx.venueCategory.createMany({
        data: categories.map((cat) => ({
          venueId: venue.id,
          categoryId: cat.id,
        })),
      })

      if (parsed.data.subcategoryIds && parsed.data.subcategoryIds.length > 0) {
        const subcategories = await tx.subcategory.findMany({
          where: { id: { in: parsed.data.subcategoryIds } },
          select: { id: true },
        })

        if (subcategories.length > 0) {
          await tx.venueSubcategory.createMany({
            data: subcategories.map((sub) => ({
              venueId: venue.id,
              subcategoryId: sub.id,
            })),
          })
        }
      }

      if (input.businessHours.length > 0) {
        await tx.venueBusinessHours.createMany({
          data: input.businessHours.map((bh) => ({
            venueId: venue.id,
            dayOfWeek: bh.dayOfWeek,
            openTime: bh.openTime,
            closeTime: bh.closeTime,
            isClosed: bh.isClosed,
          })),
        })
      }

      if (input.services.length > 0) {
        await tx.venueService.createMany({
          data: input.services.map((s, idx) => ({
            venueId: venue.id,
            name: s.name,
            description: s.description ?? null,
            icon: s.icon ?? null,
            isCustom: s.isCustom ?? false,
            isActive: true,
            sortOrder: idx,
          })),
        })
      }

      if (input.menuCategories.length > 0) {
        for (let catIdx = 0; catIdx < input.menuCategories.length; catIdx++) {
          const cat = input.menuCategories[catIdx]
          const menuCategory = await tx.menuCategory.create({
            data: {
              venueId: venue.id,
              name: cat.name,
              order: catIdx,
            },
          })

          if (cat.items.length > 0) {
            await tx.menuItem.createMany({
              data: cat.items.map((item, itemIdx) => ({
                menuCategoryId: menuCategory.id,
                name: item.name,
                description: item.description ?? null,
                price: item.price ?? null,
                image: item.image ?? null,
                order: itemIdx,
                isAvailable: true,
                isFeatured: false,
              })),
            })
          }
        }
      }

      if (input.products.length > 0) {
        await tx.product.createMany({
          data: input.products.map((p, idx) => ({
            venueId: venue.id,
            name: p.name,
            description: p.description ?? null,
            price: p.price ?? null,
            image: p.image ?? null,
            order: idx,
            isAvailable: true,
            isFeatured: false,
          })),
        })
      }

      return tx.venue.findUniqueOrThrow({
        where: { id: venue.id },
        include: {
          venueCategories: { include: { category: true } },
          venueSubcategories: { include: { subcategory: true } },
          user: {
            select: { id: true, name: true, email: true },
          },
          businessHours: {
            orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
          },
          services: {
            orderBy: { sortOrder: 'asc' },
          },
          products: {
            orderBy: { order: 'asc' },
          },
          menuCategories: {
            include: {
              items: {
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          media: { orderBy: { order: 'asc' } },
          operatingHours: true,
          events: {
            where: { status: 'APPROVED' },
            orderBy: { startDate: 'asc' },
            select: {
              id: true, title: true, slug: true, startDate: true,
              location: true, address: true,
            },
          },
          reviews: {
            include: { user: { select: { id: true, name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
          },
          promotions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
          },
          reservationSettings: true,
        },
      })
    })

    revalidatePath('/locales')
    revalidatePath('/dashboard')
    await invalidateVenueCache(created.id)

    return {
      success: true,
      data: created,
    }
  } catch {
    return {
      success: false,
      error: 'No se pudo registrar el local. Intenta nuevamente.',
    }
  }
}
