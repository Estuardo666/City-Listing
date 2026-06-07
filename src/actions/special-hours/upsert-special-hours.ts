'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { SpecialHours } from '@prisma/client'

const specialHoursSchema = z.object({
  date: z.coerce.date(),
  openTime: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().regex(/^\d{2}:\d{2}$/).nullable()),
  closeTime: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().regex(/^\d{2}:\d{2}$/).nullable()),
  isClosed: z.coerce.boolean().default(false),
  note: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(200).nullable()),
})

export async function createSpecialHoursAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<SpecialHours>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const parsed = specialHoursSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const created = await prisma.specialHours.upsert({
      where: { venueId_date: { venueId, date: parsed.data.date } },
      create: { venueId, ...parsed.data },
      update: { ...parsed.data },
    })

    revalidatePath(`/locales/${venue.slug}`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo guardar.' }
  }
}

export async function deleteSpecialHoursAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const special = await prisma.specialHours.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!special) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && special.venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.specialHours.delete({ where: { id } })
    revalidatePath(`/locales/${special.venue.slug}`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}
