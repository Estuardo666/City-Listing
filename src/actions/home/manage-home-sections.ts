'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createHomeSection,
  deleteHomeSection,
  reorderHomeSections,
  toggleHomeSection,
  updateHomeSection,
} from '@/lib/home-sections-admin'
import type { HomeSectionRow } from '@/lib/queries/home-sections'
import { homeSectionInputSchema, homeSectionReorderSchema } from '@/schemas/home-section.schema'
import type { ActionResponse } from '@/types/action-response'

/**
 * Home composition actions. The home screen is what every visitor sees first,
 * so every action is admin-only — ownership is not a thing here.
 */

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return 'No autorizado.'
  if (session.user.role !== 'ADMIN') return 'Necesitas permisos de administrador.'
  return null
}

/** The admin list is the only page that renders these rows. */
function revalidate() {
  revalidatePath('/admin/home')
  revalidatePath('/')
}

export async function createHomeSectionAction(input: unknown): Promise<ActionResponse<HomeSectionRow>> {
  const denied = await requireAdmin()
  if (denied) return { success: false, error: denied }

  const parsed = homeSectionInputSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

  try {
    const section = await createHomeSection(parsed.data)
    revalidate()
    return { success: true, data: section }
  } catch {
    return { success: false, error: 'No se pudo crear la sección.' }
  }
}

export async function updateHomeSectionAction(
  id: string,
  input: unknown,
): Promise<ActionResponse<HomeSectionRow>> {
  const denied = await requireAdmin()
  if (denied) return { success: false, error: denied }

  const parsed = homeSectionInputSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

  try {
    const section = await updateHomeSection(id, parsed.data)
    if (!section) return { success: false, error: 'La sección ya no existe.' }
    revalidate()
    return { success: true, data: section }
  } catch {
    return { success: false, error: 'No se pudo guardar la sección.' }
  }
}

export async function deleteHomeSectionAction(id: string): Promise<ActionResponse<void>> {
  const denied = await requireAdmin()
  if (denied) return { success: false, error: denied }

  try {
    const deleted = await deleteHomeSection(id)
    if (!deleted) return { success: false, error: 'La sección ya no existe.' }
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar la sección.' }
  }
}

export async function toggleHomeSectionAction(id: string, isActive: boolean): Promise<ActionResponse<void>> {
  const denied = await requireAdmin()
  if (denied) return { success: false, error: denied }

  try {
    const updated = await toggleHomeSection(id, isActive)
    if (!updated) return { success: false, error: 'La sección ya no existe.' }
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo cambiar la visibilidad.' }
  }
}

export async function reorderHomeSectionsAction(ids: unknown): Promise<ActionResponse<void>> {
  const denied = await requireAdmin()
  if (denied) return { success: false, error: denied }

  const parsed = homeSectionReorderSchema.safeParse({ ids })
  if (!parsed.success) return { success: false, error: 'Orden inválido.' }

  try {
    await reorderHomeSections(parsed.data.ids)
    revalidate()
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo reordenar.' }
  }
}
