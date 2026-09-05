import 'server-only'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { invalidateHomeSections, type HomeSectionRow } from '@/lib/queries/home-sections'
import {
  defaultLayoutForType,
  type HomeSectionInput,
} from '@/schemas/home-section.schema'

/**
 * Write helpers for the home composition, shared by the web Server Actions and
 * the mobile admin routes so both surfaces enforce the same rules and both
 * invalidate the same cache.
 */

/** New rows go last unless the caller pinned an explicit position. */
async function nextOrder() {
  const last = await prisma.homeSection.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  return (last?.order ?? -1) + 1
}

function toData(input: HomeSectionInput) {
  return {
    type: input.type,
    title: input.title,
    subtitle: input.subtitle ?? null,
    actionLabel: input.actionLabel ?? null,
    layout: input.layout ?? defaultLayoutForType[input.type],
    params: input.params as Prisma.InputJsonValue,
    isActive: input.isActive ?? true,
    platform: input.platform ?? 'all',
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
  }
}

export async function createHomeSection(input: HomeSectionInput): Promise<HomeSectionRow> {
  const section = await prisma.homeSection.create({
    data: { ...toData(input), order: input.order ?? (await nextOrder()) },
  })
  await invalidateHomeSections()
  return section
}

export async function updateHomeSection(id: string, input: HomeSectionInput): Promise<HomeSectionRow | null> {
  const exists = await prisma.homeSection.findUnique({ where: { id }, select: { id: true } })
  if (!exists) return null
  const section = await prisma.homeSection.update({
    where: { id },
    data: { ...toData(input), ...(input.order !== undefined ? { order: input.order } : {}) },
  })
  await invalidateHomeSections()
  return section
}

export async function deleteHomeSection(id: string): Promise<boolean> {
  const deleted = await prisma.homeSection.deleteMany({ where: { id } })
  if (!deleted.count) return false
  await invalidateHomeSections()
  return true
}

export async function toggleHomeSection(id: string, isActive: boolean): Promise<boolean> {
  const updated = await prisma.homeSection.updateMany({ where: { id }, data: { isActive } })
  if (!updated.count) return false
  await invalidateHomeSections()
  return true
}

/**
 * Rewrites `order` to match the given id sequence. Ids that no longer exist are
 * ignored, so a stale client list cannot fail the whole reorder.
 */
export async function reorderHomeSections(ids: string[]): Promise<void> {
  const existing = await prisma.homeSection.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  })
  const known = new Set(existing.map((row) => row.id))
  const ordered = ids.filter((id) => known.has(id))
  if (!ordered.length) return

  await prisma.$transaction(
    ordered.map((id, index) => prisma.homeSection.update({ where: { id }, data: { order: index } })),
  )
  await invalidateHomeSections()
}
