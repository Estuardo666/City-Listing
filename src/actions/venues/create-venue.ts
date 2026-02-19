'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { venueSchema } from '@/schemas/venue.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueWithRelations } from '@/types/venue'

async function generateUniqueVenueSlug(baseName: string): Promise<string> {
  const baseSlug = slugify(baseName)
  let candidateSlug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await prisma.venue.findUnique({
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

export async function createVenueAction(input: unknown): Promise<ActionResponse<VenueWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para registrar locales.',
      }
    }

    const parsed = venueSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para crear el local.',
      }
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parsed.data.categoryId,
        type: 'VENUE',
      },
      select: {
        id: true,
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'La categoría seleccionada no es válida para locales.',
      }
    }

    const slug = await generateUniqueVenueSlug(parsed.data.name)

    const created = await prisma.venue.create({
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
        featured: parsed.data.featured,
        status: 'PENDING',
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
    revalidatePath('/dashboard')

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
