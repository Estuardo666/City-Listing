'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { operatingHoursSchema } from '@/schemas/operating-hours.schema'
import type { ActionResponse } from '@/types/action-response'
import type { OperatingHours } from '@prisma/client'

export async function upsertOperatingHoursAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<OperatingHours>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autorizado. Inicia sesión para editar horarios.',
      }
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true },
    })

    if (!existingVenue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && existingVenue.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para editar este local.' }
    }

    const parsed = operatingHoursSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos para los horarios.',
      }
    }

    const result = await prisma.operatingHours.upsert({
      where: { venueId },
      create: {
        venueId,
        mon: parsed.data.mon,
        tue: parsed.data.tue,
        wed: parsed.data.wed,
        thu: parsed.data.thu,
        fri: parsed.data.fri,
        sat: parsed.data.sat,
        sun: parsed.data.sun,
        notes: parsed.data.notes,
      },
      update: {
        mon: parsed.data.mon,
        tue: parsed.data.tue,
        wed: parsed.data.wed,
        thu: parsed.data.thu,
        fri: parsed.data.fri,
        sat: parsed.data.sat,
        sun: parsed.data.sun,
        notes: parsed.data.notes,
      },
    })

    revalidatePath(`/locales/${existingVenue.slug}`)

    return { success: true, data: result }
  } catch {
    return {
      success: false,
      error: 'No se pudieron guardar los horarios. Intenta nuevamente.',
    }
  }
}
