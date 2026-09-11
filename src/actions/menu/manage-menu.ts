'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { MenuCategory, MenuItem } from '@prisma/client'
import { assertVenueCapability, BillingEntitlementError, canManageVenue } from '@/lib/billing/plans'

const menuCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(60),
})

const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  description: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(300).nullable()),
  price: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(0).nullable()),
  image: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().url().nullable()),
  isAvailable: z.coerce.boolean().default(true),
})

export async function createMenuCategoryAction(
  venueId: string,
  input: unknown
): Promise<ActionResponse<MenuCategory>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, venueId)) return { success: false, error: 'No tienes permiso.' }

    if (session.user.role !== 'ADMIN') {
      try { await assertVenueCapability(venueId, 'menuEnabled') }
      catch (error) { if (error instanceof BillingEntitlementError) return { success: false, error: error.message }; throw error }
    }

    const parsed = menuCategorySchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const count = await prisma.menuCategory.count({ where: { venueId } })
    const created = await prisma.menuCategory.create({
      data: { name: parsed.data.name, venueId, order: count },
    })

    revalidatePath(`/locales/${venue.slug}`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear.' }
  }
}

export async function deleteMenuCategoryAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const cat = await prisma.menuCategory.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!cat) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, cat.venueId)) return { success: false, error: 'No tienes permiso.' }

    await prisma.menuCategory.delete({ where: { id } })
    revalidatePath(`/locales/${cat.venue.slug}`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}

export async function createMenuItemAction(
  menuCategoryId: string,
  input: unknown
): Promise<ActionResponse<MenuItem>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const cat = await prisma.menuCategory.findUnique({
      where: { id: menuCategoryId },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!cat) return { success: false, error: 'Categoría no encontrada.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, cat.venueId)) return { success: false, error: 'No tienes permiso.' }

    if (session.user.role !== 'ADMIN') {
      try { await assertVenueCapability(cat.venueId, 'menuEnabled') }
      catch (error) { if (error instanceof BillingEntitlementError) return { success: false, error: error.message }; throw error }
    }

    const parsed = menuItemSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const count = await prisma.menuItem.count({ where: { menuCategoryId } })
    const created = await prisma.menuItem.create({
      data: { ...parsed.data, menuCategoryId, order: count },
    })

    revalidatePath(`/locales/${cat.venue.slug}`)
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear.' }
  }
}

export async function updateMenuItemAction(id: string, input: unknown): Promise<ActionResponse<MenuItem>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { menuCategory: { include: { venue: { select: { userId: true, slug: true } } } } },
    })
    if (!item) return { success: false, error: 'Item no encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, item.menuCategory.venueId)) return { success: false, error: 'No tienes permiso.' }

    const parsed = menuItemSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const updated = await prisma.menuItem.update({ where: { id }, data: parsed.data })
    revalidatePath(`/locales/${item.menuCategory.venue.slug}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function deleteMenuItemAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { menuCategory: { include: { venue: { select: { userId: true, slug: true } } } } },
    })
    if (!item) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, item.menuCategory.venueId)) return { success: false, error: 'No tienes permiso.' }

    await prisma.menuItem.delete({ where: { id } })
    revalidatePath(`/locales/${item.menuCategory.venue.slug}`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}

export async function updateMenuCategoryAction(
  id: string,
  name: string
): Promise<ActionResponse<MenuCategory>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const cat = await prisma.menuCategory.findUnique({
      where: { id },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!cat) return { success: false, error: 'No encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, cat.venueId)) return { success: false, error: 'No tienes permiso.' }

    if (!name?.trim()) return { success: false, error: 'Nombre requerido.' }

    const updated = await prisma.menuCategory.update({ where: { id }, data: { name: name.trim() } })
    revalidatePath(`/locales/${cat.venue.slug}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function reorderCategoriesAction(
  venueId: string,
  categoryIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { userId: true, slug: true } })
    if (!venue) return { success: false, error: 'Local no encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, venueId)) return { success: false, error: 'No tienes permiso.' }

    await Promise.all(
      categoryIds.map((id, index) =>
        prisma.menuCategory.update({ where: { id }, data: { order: index } })
      )
    )

    revalidatePath(`/locales/${venue.slug}`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reordenar.' }
  }
}

export async function reorderItemsAction(
  menuCategoryId: string,
  itemIds: string[]
): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const cat = await prisma.menuCategory.findUnique({
      where: { id: menuCategoryId },
      include: { venue: { select: { userId: true, slug: true } } },
    })
    if (!cat) return { success: false, error: 'Categoría no encontrada.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, cat.venueId)) return { success: false, error: 'No tienes permiso.' }

    await Promise.all(
      itemIds.map((id, index) =>
        prisma.menuItem.update({ where: { id }, data: { order: index } })
      )
    )

    revalidatePath(`/locales/${cat.venue.slug}`)
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reordenar.' }
  }
}

export async function toggleItemAvailabilityAction(id: string): Promise<ActionResponse<MenuItem>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { menuCategory: { include: { venue: { select: { userId: true, slug: true } } } } },
    })
    if (!item) return { success: false, error: 'Item no encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, item.menuCategory.venueId)) return { success: false, error: 'No tienes permiso.' }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    })

    revalidatePath(`/locales/${item.menuCategory.venue.slug}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}

export async function toggleItemFeaturedAction(id: string): Promise<ActionResponse<MenuItem>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { menuCategory: { include: { venue: { select: { userId: true, slug: true } } } } },
    })
    if (!item) return { success: false, error: 'Item no encontrado.' }
    if (session.user.role !== 'ADMIN' && !await canManageVenue(session.user.id, item.menuCategory.venueId)) return { success: false, error: 'No tienes permiso.' }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: { isFeatured: !item.isFeatured },
    })

    revalidatePath(`/locales/${item.menuCategory.venue.slug}`)
    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo actualizar.' }
  }
}
