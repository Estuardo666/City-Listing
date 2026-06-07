'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'

export async function setCoverImageAction(
  venueId: string,
  imageUrl: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true, slug: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    if (!imageUrl?.trim()) {
      return { success: false, error: 'La URL de la imagen es requerida.' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: { coverImage: imageUrl.trim() },
    })

    revalidatePath(`/dashboard/locales/${venueId}/medios`)
    revalidatePath(`/locales/${venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo establecer la imagen de portada.' }
  }
}

export async function setLogoAction(
  venueId: string,
  imageUrl: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true, slug: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    if (!imageUrl?.trim()) {
      return { success: false, error: 'La URL de la imagen es requerida.' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: { logo: imageUrl.trim() },
    })

    revalidatePath(`/dashboard/locales/${venueId}/medios`)
    revalidatePath(`/locales/${venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo establecer el logo.' }
  }
}

export async function removeCoverImageAction(venueId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true, slug: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: { coverImage: null },
    })

    revalidatePath(`/dashboard/locales/${venueId}/medios`)
    revalidatePath(`/locales/${venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo remover la imagen de portada.' }
  }
}

export async function removeLogoAction(venueId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true, slug: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    await prisma.venue.update({
      where: { id: venueId },
      data: { logo: null },
    })

    revalidatePath(`/dashboard/locales/${venueId}/medios`)
    revalidatePath(`/locales/${venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo remover el logo.' }
  }
}

export async function reorderMediaAction(
  venueId: string,
  mediaIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true, slug: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    await Promise.all(
      mediaIds.map((id, index) =>
        prisma.media.update({
          where: { id },
          data: { order: index },
        })
      )
    )

    revalidatePath(`/dashboard/locales/${venueId}/medios`)
    revalidatePath(`/locales/${venue.slug}`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reordenar los medios.' }
  }
}

export async function getVenueMediaAction(venueId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return []
    }

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { userId: true },
    })

    if (!venue || venue.userId !== session.user.id) {
      return []
    }

    const media = await prisma.media.findMany({
      where: { venueId },
      orderBy: { order: 'asc' },
    })

    return media
  } catch {
    return []
  }
}
