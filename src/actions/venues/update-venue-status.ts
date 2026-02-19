'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { venueStatusUpdateSchema } from '@/schemas/venue.schema'
import type { ActionResponse } from '@/types/action-response'
import type { VenueWithRelations } from '@/types/venue'

export async function updateVenueStatusAction(
  input: unknown
): Promise<ActionResponse<VenueWithRelations>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return {
        success: false,
        error: 'No autorizado. Solo administradores pueden cambiar el estado.',
      }
    }

    const parsed = venueStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para actualizar estado.',
      }
    }

    const updated = await prisma.venue.update({
      where: {
        id: parsed.data.venueId,
      },
      data: {
        status: parsed.data.status,
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
      error: 'No se pudo actualizar el estado del local.',
    }
  }
}
