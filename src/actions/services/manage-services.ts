'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { VenueService } from '@prisma/client'
import { PREDEFINED_SERVICES } from '@/lib/constants/services'

const customServiceSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(50),
  description: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(200).nullable()),
  icon: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(10).nullable()),
})

export async function getVenueServicesAction(venueId: string) {
  return prisma.venueService.findMany({
    where: { venueId },
    orderBy: { sortOrder: 'asc' },
  })
}

export async function togglePredefinedServiceAction(
  venueId: string,
  serviceName: string
): Promise<ActionResponse<VenueService>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const predefined = PREDEFINED_SERVICES.find((s) => s.name === serviceName)
    if (!predefined) return { success: false, error: 'Servicio no válido.' }

    const existing = await prisma.venueService.findFirst({ where: { venueId, name: serviceName } })

    if (existing) {
      const updated = await prisma.venueService.update({
        where: { id: existing.id },
        data: { isActive: !existing.isActive },
      })
      revalidatePath(`/locales/${venue.slug}`)
      revalidatePath(`/dashboard/locales/${venue.slug}/servicios`)
      return { success: true, data: updated }
    }

    const count = await prisma.venueService.count({ where: { venueId } })
    const created = await prisma.venueService.create({
      data: {
        venueId,
        name: predefined.name,
        description: predefined.description,
        icon: predefined.icon,
        isCustom: false,
        isActive: true,
        sortOrder: count,
      },
    })

    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/servicios`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function addCustomServiceAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<VenueService>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const parsed = customServiceSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const existing = await prisma.venueService.findFirst({ where: { venueId, name: parsed.data.name } })
    if (existing) return { success: false, error: 'Ya existe un servicio con ese nombre.' }

    const count = await prisma.venueService.count({ where: { venueId } })
    const created = await prisma.venueService.create({
      data: { venueId, ...parsed.data, icon: parsed.data.icon ?? '✨', isCustom: true, sortOrder: count },
    })

    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/servicios`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear.' }
  }
}

export async function updateCustomServiceAction(
  id: string,
  input: unknown
): Promise<ActionResponse<VenueService>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const service = await prisma.venueService.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!service || !service.isCustom) return { success: false, error: 'Servicio no encontrado o no es personalizado.' }
    if (session.user.role !== 'ADMIN' && service.venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const parsed = customServiceSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const updated = await prisma.venueService.update({ where: { id }, data: parsed.data })
    revalidatePath(`/locales/${service.venue.slug}`)
    revalidatePath(`/dashboard/locales/${service.venue.slug}/servicios`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function deleteServiceAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const service = await prisma.venueService.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!service) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && service.venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.venueService.delete({ where: { id } })
    revalidatePath(`/locales/${service.venue.slug}`)
    revalidatePath(`/dashboard/locales/${service.venue.slug}/servicios`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}

export async function reorderServicesAction(
  venueId: string,
  serviceIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await Promise.all(
      serviceIds.map((id, index) =>
        prisma.venueService.update({ where: { id }, data: { sortOrder: index } })
      )
    )

    revalidatePath(`/locales/${venue.slug}`)
    revalidatePath(`/dashboard/locales/${venue.slug}/servicios`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reordenar.' }
  }
}
