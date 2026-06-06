'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { recurrenceSchema } from '@/schemas/recurrence.schema'
import type { ActionResponse } from '@/types/action-response'
import type { RecurrenceRule } from '@prisma/client'

export async function upsertRecurrenceAction(
  eventId: string,
  input: unknown
): Promise<ActionResponse<RecurrenceRule>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true, slug: true },
    })

    if (!event) {
      return { success: false, error: 'Evento no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && event.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso.' }
    }

    const parsed = recurrenceSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const result = await prisma.recurrenceRule.upsert({
      where: { eventId },
      create: {
        eventId,
        frequency: parsed.data.frequency,
        interval: parsed.data.interval,
        daysOfWeek: parsed.data.daysOfWeek,
        dayOfMonth: parsed.data.dayOfMonth,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        count: parsed.data.count,
      },
      update: {
        frequency: parsed.data.frequency,
        interval: parsed.data.interval,
        daysOfWeek: parsed.data.daysOfWeek,
        dayOfMonth: parsed.data.dayOfMonth,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        count: parsed.data.count,
      },
    })

    await prisma.event.update({
      where: { id: eventId },
      data: { isRecurring: true },
    })

    revalidatePath(`/eventos/${event.slug}`)

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'No se pudo guardar la recurrencia.' }
  }
}

export async function deleteRecurrenceAction(eventId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true, slug: true },
    })

    if (!event) {
      return { success: false, error: 'Evento no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && event.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso.' }
    }

    await prisma.recurrenceRule.delete({ where: { eventId } })

    await prisma.event.update({
      where: { id: eventId },
      data: { isRecurring: false },
    })

    revalidatePath(`/eventos/${event.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la recurrencia.' }
  }
}
