'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { Collection, CollectionItem } from '@prisma/client'

const collectionSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(60, 'Máximo 60 caracteres'),
  description: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(200).nullable()),
  icon: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(4).nullable()),
  isPublic: z.coerce.boolean().default(true),
})

const addToCollectionSchema = z.object({
  collectionId: z.string().min(1),
  venueId: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  eventId: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  postId: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  routeId: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().nullable()),
  note: z.preprocess((v) => (v === '' || v == null ? null : v), z.string().max(200).nullable()),
})

async function generateUniqueCollectionSlug(baseName: string): Promise<string> {
  const base = slugify(baseName)
  let candidate = base
  let suffix = 1
  while (true) {
    const existing = await prisma.collection.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing) return candidate
    suffix++
    candidate = `${base}-${suffix}`
  }
}

export async function createCollectionAction(input: unknown): Promise<ActionResponse<Collection>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = collectionSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const slug = await generateUniqueCollectionSlug(parsed.data.name)
    const created = await prisma.collection.create({
      data: { ...parsed.data, slug, userId: session.user.id },
    })

    revalidatePath('/dashboard/colecciones')
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo crear la colección.' }
  }
}

export async function deleteCollectionAction(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const collection = await prisma.collection.findUnique({ where: { id }, select: { userId: true } })
    if (!collection) return { success: false, error: 'Colección no encontrada.' }
    if (session.user.role !== 'ADMIN' && collection.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.collection.delete({ where: { id } })
    revalidatePath('/dashboard/colecciones')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}

export async function addToCollectionAction(input: unknown): Promise<ActionResponse<CollectionItem>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = addToCollectionSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const { collectionId, ...itemData } = parsed.data
    if (!itemData.venueId && !itemData.eventId && !itemData.postId && !itemData.routeId) {
      return { success: false, error: 'Selecciona un elemento.' }
    }

    const collection = await prisma.collection.findUnique({ where: { id: collectionId }, select: { userId: true } })
    if (!collection || collection.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    const count = await prisma.collectionItem.count({ where: { collectionId } })
    const created = await prisma.collectionItem.create({
      data: { collectionId, ...itemData, order: count },
    })

    revalidatePath('/dashboard/colecciones')
    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo agregar.' }
  }
}

export async function removeFromCollectionAction(itemId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const item = await prisma.collectionItem.findUnique({
      where: { id: itemId },
      include: { collection: { select: { userId: true } } },
    })
    if (!item || item.collection.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.collectionItem.delete({ where: { id: itemId } })
    revalidatePath('/dashboard/colecciones')
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}
