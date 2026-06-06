'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { reservationSchema, reservationStatusUpdateSchema, reservationSettingsSchema } from '@/schemas/reservation.schema'
import type { ActionResponse } from '@/types/action-response'
import type { Reservation, ReservationSettings } from '@prisma/client'

export async function createReservationAction(input: unknown): Promise<ActionResponse<Reservation>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado. Inicia sesión para reservar.' }
    }

    const parsed = reservationSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    if (!parsed.data.venueId && !parsed.data.eventId) {
      return { success: false, error: 'Selecciona un local o evento.' }
    }

    if (parsed.data.venueId) {
      const settings = await prisma.reservationSettings.findUnique({
        where: { venueId: parsed.data.venueId },
      })

      if (settings && !settings.acceptsReservations) {
        return { success: false, error: 'Este local no acepta reservas en este momento.' }
      }

      if (settings && parsed.data.partySize > settings.maxPartySize) {
        return {
          success: false,
          error: `El tamaño máximo del grupo es ${settings.maxPartySize} personas.`,
        }
      }
    }

    const created = await prisma.reservation.create({
      data: {
        venueId: parsed.data.venueId,
        eventId: parsed.data.eventId,
        userId: session.user.id,
        date: parsed.data.date,
        time: parsed.data.time,
        partySize: parsed.data.partySize,
        notes: parsed.data.notes,
        status: 'PENDING',
      },
    })

    if (parsed.data.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: parsed.data.venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    }

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear la reserva.' }
  }
}

export async function updateReservationStatusAction(
  input: unknown
): Promise<ActionResponse<Reservation>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parsed = reservationStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservationId },
      include: {
        venue: { select: { userId: true, slug: true } },
      },
    })

    if (!reservation) {
      return { success: false, error: 'Reserva no encontrada.' }
    }

    const isOwner = reservation.userId === session.user.id
    const isVenueOwner = reservation.venue?.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isOwner && !isVenueOwner && !isAdmin) {
      return { success: false, error: 'No tienes permiso.' }
    }

    const updated = await prisma.reservation.update({
      where: { id: parsed.data.reservationId },
      data: {
        status: parsed.data.status,
        cancelReason: parsed.data.cancelReason,
      },
    })

    if (reservation.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: reservation.venueId }, select: { slug: true } })
      if (venue) revalidatePath(`/locales/${venue.slug}`)
    }

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar la reserva.' }
  }
}

export async function upsertReservationSettingsAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<ReservationSettings>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true },
    })

    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso.' }
    }

    const parsed = reservationSettingsSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const result = await prisma.reservationSettings.upsert({
      where: { venueId },
      create: {
        venueId,
        ...parsed.data,
      },
      update: parsed.data,
    })

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'No se pudieron guardar los ajustes.' }
  }
}
