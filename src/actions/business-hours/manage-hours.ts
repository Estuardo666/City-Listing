'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { invalidateCache } from '@/lib/cache'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { VenueBusinessHours } from '@prisma/client'

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const hourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(TIME_REGEX, 'Formato HH:MM requerido'),
  closeTime: z.string().regex(TIME_REGEX, 'Formato HH:MM requerido'),
  isClosed: z.boolean().default(false),
}).refine((d) => d.isClosed || d.openTime !== d.closeTime, {
  // openTime > closeTime es valido: el local cierra pasada la medianoche (20:00 -> 02:00).
  // openTime === closeTime queda reservado para "abierto 24 horas" y no se captura aqui.
  message: 'La hora de apertura y la de cierre no pueden ser iguales',
  path: ['openTime'],
})

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Los turnos que cruzan medianoche se extienden mas alla de 1440 para poder compararlos. */
function toInterval(slot: { openTime: string; closeTime: string }): { start: number; end: number } {
  const start = timeToMinutes(slot.openTime)
  const end = timeToMinutes(slot.closeTime)
  return { start, end: end > start ? end : end + 1440 }
}

function hasOverlap(slots: { openTime: string; closeTime: string }[], excludeId?: string): boolean {
  const filtered = slots.filter((_, i) => !excludeId || String(i) !== excludeId)
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const a = toInterval(filtered[i])
      const b = toInterval(filtered[j])
      if (a.start < b.end && b.start < a.end) return true
    }
  }
  return false
}

/** El filtro "abierto ahora" se sirve desde Redis: al tocar horarios hay que tirarlo. */
async function invalidateHoursCache(): Promise<void> {
  await invalidateCache('explore:*')
}

export async function getBusinessHoursAction(venueId: string): Promise<VenueBusinessHours[]> {
  return prisma.venueBusinessHours.findMany({
    where: { venueId },
    orderBy: [{ dayOfWeek: 'asc' }, { openTime: 'asc' }],
  })
}

export async function upsertBusinessHoursAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<VenueBusinessHours>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const parsed = hourSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const data = parsed.data
    const existingDaySlots = await prisma.venueBusinessHours.findMany({
      where: { venueId, dayOfWeek: data.dayOfWeek, isClosed: false },
    })

    const newSlot = { openTime: data.openTime, closeTime: data.closeTime }
    const allSlots = [...existingDaySlots.map((s) => ({ openTime: s.openTime, closeTime: s.closeTime })), newSlot]

    if (!data.isClosed && hasOverlap(allSlots)) {
      return { success: false, error: 'El horario se solapa con otro existente.' }
    }

    const created = await prisma.venueBusinessHours.create({
      data: {
        venueId,
        dayOfWeek: data.dayOfWeek,
        openTime: data.openTime,
        closeTime: data.closeTime,
        isClosed: data.isClosed,
      },
    })

    await invalidateHoursCache()
    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/horarios`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo guardar.' }
  }
}

export async function deleteBusinessHoursAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const hour = await prisma.venueBusinessHours.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!hour) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && hour.venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.venueBusinessHours.delete({ where: { id } })
    await invalidateHoursCache()
    revalidatePath(`/locales/${hour.venue.slug}`)
    revalidatePath(`/dashboard/locales/${hour.venue.slug}/horarios`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}

export async function setDayClosedAction(
  venueId: string,
  dayOfWeek: number,
  isClosed: boolean
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    if (isClosed) {
      await prisma.venueBusinessHours.deleteMany({ where: { venueId, dayOfWeek } })
      await prisma.venueBusinessHours.create({
        data: { venueId, dayOfWeek, openTime: '00:00', closeTime: '00:00', isClosed: true },
      })
    } else {
      await prisma.venueBusinessHours.deleteMany({ where: { venueId, dayOfWeek, isClosed: true } })
    }

    await invalidateHoursCache()
    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/horarios`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function duplicateDayScheduleAction(
  venueId: string,
  fromDay: number,
  toDays: number[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const sourceSlots = await prisma.venueBusinessHours.findMany({
      where: { venueId, dayOfWeek: fromDay },
    })

    for (const targetDay of toDays) {
      await prisma.venueBusinessHours.deleteMany({ where: { venueId, dayOfWeek: targetDay } })
      if (sourceSlots.length > 0) {
        await prisma.venueBusinessHours.createMany({
          data: sourceSlots.map((s) => ({
            venueId,
            dayOfWeek: targetDay,
            openTime: s.openTime,
            closeTime: s.closeTime,
            isClosed: s.isClosed,
          })),
        })
      }
    }

    await invalidateHoursCache()
    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/horarios`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo duplicar.' }
  }
}
