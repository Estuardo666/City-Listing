'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { promotionSchema, promotionStatusUpdateSchema } from '@/schemas/promotion.schema'
import type { ActionResponse } from '@/types/action-response'
import type { Promotion } from '@prisma/client'

export async function createPromotionAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<Promotion>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true, userId: true, slug: true },
    })

    if (!venue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && venue.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para crear ofertas en este local.' }
    }

    const parsed = promotionSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const created = await prisma.promotion.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        image: parsed.data.image,
        discount: parsed.data.discount,
        validFrom: parsed.data.validFrom,
        validUntil: parsed.data.validUntil,
        terms: parsed.data.terms,
        featured: parsed.data.featured,
        venueId,
        status: 'PENDING',
      },
    })

    revalidatePath(`/locales/${venue.slug}`)

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear la oferta.' }
  }
}

export async function updatePromotionStatusAction(
  input: unknown
): Promise<ActionResponse<Promotion>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'Solo administradores pueden cambiar el estado.' }
    }

    const parsed = promotionStatusUpdateSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const updated = await prisma.promotion.update({
      where: { id: parsed.data.promotionId },
      data: { status: parsed.data.status },
    })

    revalidatePath('/admin/ofertas')

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar la oferta.' }
  }
}

export async function deletePromotionAction(promotionId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      include: { venue: { select: { userId: true, slug: true } } },
    })

    if (!promotion) {
      return { success: false, error: 'Oferta no encontrada.' }
    }

    if (session.user.role !== 'ADMIN' && promotion.venue.userId !== session.user.id) {
      return { success: false, error: 'No tienes permiso.' }
    }

    await prisma.promotion.delete({ where: { id: promotionId } })

    revalidatePath(`/locales/${promotion.venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la oferta.' }
  }
}
