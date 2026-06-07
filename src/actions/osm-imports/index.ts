'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResponse } from '@/types/action-response'
import type { OsmImport, OsmImportLog, OsmConfig } from '@prisma/client'

export async function getOsmImports(filters?: {
  status?: string
  page?: number
  limit?: number
}): Promise<ActionResponse<{ data: OsmImport[]; total: number; page: number; limit: number }>> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    const page = Math.max(1, filters?.page ?? 1)
    const limit = Math.min(100, Math.max(1, filters?.limit ?? 20))
    const where: any = {}
    if (filters?.status) where.status = filters.status

    const [data, total] = await Promise.all([
      prisma.osmImport.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { logs: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.osmImport.count({ where }),
    ])

    return { success: true, data: { data, total, page, limit } }
  } catch (error) {
    console.error('Error fetching OSM imports:', error)
    return { success: false, error: 'Error al obtener importaciones' }
  }
}

export async function getOsmImportById(id: string): Promise<ActionResponse<OsmImport & { logs: OsmImportLog[] }>> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    const importRecord = await prisma.osmImport.findUnique({
      where: { id },
      include: {
        logs: { orderBy: { createdAt: 'desc' } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!importRecord) {
      return { success: false, error: 'Importación no encontrada' }
    }

    return { success: true, data: importRecord as any }
  } catch (error) {
    console.error('Error fetching OSM import:', error)
    return { success: false, error: 'Error al obtener importación' }
  }
}

export async function deleteOsmImport(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    await prisma.osmImport.delete({ where: { id } })
    return { success: true }
  } catch (error) {
    console.error('Error deleting OSM import:', error)
    return { success: false, error: 'Error al eliminar importación' }
  }
}

export async function getOsmConfig(): Promise<ActionResponse<OsmConfig>> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    let config = await prisma.osmConfig.findFirst()
    if (!config) {
      config = await prisma.osmConfig.create({ data: { id: 'default' } })
    }

    return { success: true, data: config }
  } catch (error) {
    console.error('Error fetching OSM config:', error)
    return { success: false, error: 'Error al obtener configuración' }
  }
}

export async function updateOsmConfig(data: Partial<OsmConfig>): Promise<ActionResponse<OsmConfig>> {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado' }
    }

    let config = await prisma.osmConfig.findFirst()
    if (!config) {
      config = await prisma.osmConfig.create({ data: { id: 'default', ...data } })
    } else {
      config = await prisma.osmConfig.update({ where: { id: config.id }, data })
    }

    return { success: true, data: config }
  } catch (error) {
    console.error('Error updating OSM config:', error)
    return { success: false, error: 'Error al actualizar configuración' }
  }
}
