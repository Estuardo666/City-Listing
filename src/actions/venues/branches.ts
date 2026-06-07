'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { ActionResponse } from '@/types/action-response'

export async function createBranchAction(
  parentVenueId: string,
  branchData: {
    name: string
    description: string
    location: string
    address?: string
    lat?: number
    lng?: number
    phone?: string
    email?: string
    website?: string
    categoryId: string
  }
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: parentVenueId },
      select: { userId: true, name: true },
    })

    if (!parentVenue || parentVenue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    if (!branchData.name?.trim()) {
      return { success: false, error: 'El nombre es requerido.' }
    }

    if (!branchData.description?.trim()) {
      return { success: false, error: 'La descripción es requerida.' }
    }

    if (!branchData.location?.trim()) {
      return { success: false, error: 'La ubicación es requerida.' }
    }

    const category = await prisma.category.findFirst({
      where: {
        id: branchData.categoryId,
        type: 'VENUE',
      },
      select: { id: true },
    })

    if (!category) {
      return { success: false, error: 'Categoría inválida.' }
    }

    const baseSlug = slugify(branchData.name)
    let slug = baseSlug
    let suffix = 1

    while (true) {
      const existing = await prisma.venue.findUnique({
        where: { slug },
        select: { id: true },
      })

      if (!existing) break

      suffix += 1
      slug = `${baseSlug}-${suffix}`
    }

    const branch = await prisma.venue.create({
      data: {
        name: branchData.name.trim(),
        slug,
        description: branchData.description.trim(),
        location: branchData.location.trim(),
        address: branchData.address?.trim() || null,
        lat: branchData.lat || null,
        lng: branchData.lng || null,
        phone: branchData.phone?.trim() || null,
        email: branchData.email?.trim() || null,
        website: branchData.website?.trim() || null,
        categoryId: category.id,
        userId: session.user.id,
        parentId: parentVenueId,
        status: 'PENDING',
      },
    })

    revalidatePath(`/dashboard/locales/${parentVenueId}/sucursales`)
    revalidatePath(`/dashboard/locales`)

    return { success: true, data: { id: branch.id, slug: branch.slug } }
  } catch {
    return { success: false, error: 'No se pudo crear la sucursal.' }
  }
}

export async function linkBranchAction(
  parentVenueId: string,
  existingVenueId: string
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: parentVenueId },
      select: { userId: true },
    })

    if (!parentVenue || parentVenue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño del local principal.' }
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: existingVenueId },
      select: { userId: true, parentId: true },
    })

    if (!existingVenue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (existingVenue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de este local.' }
    }

    if (existingVenue.parentId) {
      return { success: false, error: 'Este local ya es una sucursal de otro local.' }
    }

    if (existingVenueId === parentVenueId) {
      return { success: false, error: 'No puedes vincular un local consigo mismo.' }
    }

    await prisma.venue.update({
      where: { id: existingVenueId },
      data: { parentId: parentVenueId },
    })

    revalidatePath(`/dashboard/locales/${parentVenueId}/sucursales`)
    revalidatePath(`/dashboard/locales`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo vincular la sucursal.' }
  }
}

export async function unlinkBranchAction(branchId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const branch = await prisma.venue.findUnique({
      where: { id: branchId },
      select: { parentId: true, userId: true },
    })

    if (!branch || !branch.parentId) {
      return { success: false, error: 'Esta sucursal no está vinculada.' }
    }

    if (branch.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de esta sucursal.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: branch.parentId },
      select: { userId: true },
    })

    if (!parentVenue || parentVenue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño del local principal.' }
    }

    await prisma.venue.update({
      where: { id: branchId },
      data: { parentId: null },
    })

    revalidatePath(`/dashboard/locales/${branch.parentId}/sucursales`)
    revalidatePath(`/dashboard/locales`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo desvincular la sucursal.' }
  }
}

export async function deleteBranchAction(branchId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const branch = await prisma.venue.findUnique({
      where: { id: branchId },
      select: { parentId: true, userId: true },
    })

    if (!branch || !branch.parentId) {
      return { success: false, error: 'Esta sucursal no está vinculada.' }
    }

    if (branch.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño de esta sucursal.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: branch.parentId },
      select: { userId: true },
    })

    if (!parentVenue || parentVenue.userId !== session.user.id) {
      return { success: false, error: 'No eres el dueño del local principal.' }
    }

    await prisma.venue.delete({
      where: { id: branchId },
    })

    revalidatePath(`/dashboard/locales/${branch.parentId}/sucursales`)
    revalidatePath(`/dashboard/locales`)

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la sucursal.' }
  }
}

export async function getBranchesAction(parentVenueId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return []
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: parentVenueId },
      select: { userId: true },
    })

    if (!parentVenue || parentVenue.userId !== session.user.id) {
      return []
    }

    const branches = await prisma.venue.findMany({
      where: {
        parentId: parentVenueId,
      },
      include: {
        category: true,
        _count: {
          select: {
            reviews: true,
            reservations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return branches
  } catch {
    return []
  }
}

export async function getBranchAnalyticsAction(branchId: string) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return null
    }

    const branch = await prisma.venue.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        name: true,
        userId: true,
        viewCount: true,
        avgRating: true,
        reviewCount: true,
        _count: {
          select: {
            reviews: true,
            reservations: true,
            favorites: true,
          },
        },
      },
    })

    if (!branch || branch.userId !== session.user.id) {
      return null
    }

    return branch
  } catch {
    return null
  }
}
