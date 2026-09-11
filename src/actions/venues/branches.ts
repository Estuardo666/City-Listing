'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import type { ActionResponse } from '@/types/action-response'
import { ensureBusinessAccount, assertLocationCapacity, BillingEntitlementError, canManageVenue } from '@/lib/billing/plans'

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
    categoryIds: string[]
  }
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return { success: false, error: 'No autorizado.' }
    }

    const businessAccount = await ensureBusinessAccount(session.user.id)
    try {
      await assertLocationCapacity(session.user.id)
    } catch (error) {
      if (error instanceof BillingEntitlementError) return { success: false, error: error.message }
      throw error
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: parentVenueId },
      select: { userId: true, name: true },
    })

    if (!parentVenue || session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, parentVenueId, ['OWNER', 'ADMIN'])) {
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

    if (!branchData.categoryIds || branchData.categoryIds.length === 0) {
      return { success: false, error: 'Selecciona al menos una categoría.' }
    }

    const categories = await prisma.category.findMany({
      where: {
        id: { in: branchData.categoryIds },
        type: 'VENUE',
      },
      select: { id: true },
    })

    if (categories.length !== branchData.categoryIds.length) {
      return { success: false, error: 'Una o más categorías inválidas.' }
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

    const branch = await prisma.$transaction(async (tx) => {
      const venue = await tx.venue.create({
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
          userId: session.user.id,
          parentId: parentVenueId,
          businessAccountId: businessAccount.id,
          status: 'PENDING',
        },
      })

      await tx.venueCategory.createMany({
        data: categories.map((cat) => ({
          venueId: venue.id,
          categoryId: cat.id,
        })),
      })

      return venue
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

    if (!parentVenue || (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, parentVenueId, ['OWNER', 'ADMIN']))) {
      return { success: false, error: 'No eres el dueño del local principal.' }
    }

    const existingVenue = await prisma.venue.findUnique({
      where: { id: existingVenueId },
      select: { userId: true, parentId: true },
    })

    if (!existingVenue) {
      return { success: false, error: 'Local no encontrado.' }
    }

    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, existingVenueId, ['OWNER', 'ADMIN'])) {
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

    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, branchId, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'No eres el dueño de esta sucursal.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: branch.parentId },
      select: { userId: true },
    })

    if (!parentVenue || (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, branch.parentId, ['OWNER', 'ADMIN']))) {
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

    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, branchId, ['OWNER', 'ADMIN'])) {
      return { success: false, error: 'No eres el dueño de esta sucursal.' }
    }

    const parentVenue = await prisma.venue.findUnique({
      where: { id: branch.parentId },
      select: { userId: true },
    })

    if (!parentVenue || (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, branch.parentId, ['OWNER', 'ADMIN']))) {
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

    if (!parentVenue || (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, parentVenueId, ['OWNER', 'ADMIN']))) {
      return []
    }

    const branches = await prisma.venue.findMany({
      where: {
        parentId: parentVenueId,
      },
      include: {
        venueCategories: { include: { category: true } },
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

    if (!branch || (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, branchId))) {
      return null
    }

    return branch
  } catch {
    return null
  }
}
