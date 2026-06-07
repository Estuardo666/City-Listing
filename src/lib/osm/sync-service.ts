import { prisma } from '@/lib/prisma'
import { overpassService } from './overpass-service'
import type { OsmPlace } from '@/types/osm-import'

class SyncService {
  async createSyncJob(type: string, importId?: string) {
    return prisma.osmSyncJob.create({
      data: { type, importId: importId ?? null, status: 'PENDING' },
    })
  }

  async updateJobProgress(jobId: string, data: { status?: string; progress?: number; processed?: number; total?: number; errorMessage?: string; startedAt?: Date; finishedAt?: Date }) {
    return prisma.osmSyncJob.update({ where: { id: jobId }, data })
  }

  async pauseJob(jobId: string) {
    return prisma.osmSyncJob.update({ where: { id: jobId }, data: { status: 'PAUSED' } })
  }

  async resumeJob(jobId: string) {
    return prisma.osmSyncJob.update({ where: { id: jobId }, data: { status: 'RUNNING' } })
  }

  async cancelJob(jobId: string) {
    return prisma.osmSyncJob.update({ where: { id: jobId }, data: { status: 'FAILED', errorMessage: 'Cancelado por el usuario', finishedAt: new Date() } })
  }

  async syncPlace(venueId: string): Promise<{ action: string; error?: string }> {
    try {
      const venue = await prisma.venue.findUnique({ where: { id: venueId } })
      if (!venue || !(venue as any).osmId) return { action: 'error', error: 'Venue sin osmId' }

      const osmIdParts = (venue as any).osmId.split('/')
      const osmType = osmIdParts[0]
      const osmId = osmIdParts[1]

      const query = `[out:json][timeout:30];${osmType}(${osmId});out;`
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ViveLoja/1.0' },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) return { action: 'error', error: `Overpass API error: ${response.status}` }
      const data = await response.json()
      if (!data.elements || data.elements.length === 0) return { action: 'removed' }

      const el = data.elements[0]
      const tags = el.tags ?? {}
      const name = tags['name:es'] ?? tags['name'] ?? venue.name
      const lat = el.lat ?? el.center?.lat ?? (venue as any).lat
      const lon = el.lon ?? el.center?.lon ?? (venue as any).lng

      await prisma.venue.update({
        where: { id: venueId },
        data: {
          name,
          lat,
          lng: lon,
          phone: tags['phone'] ?? tags['contact:phone'] ?? (venue as any).phone,
          website: tags['website'] ?? tags['contact:website'] ?? (venue as any).website,
          email: tags['email'] ?? tags['contact:email'] ?? (venue as any).email,
        },
      })

      return { action: 'updated' }
    } catch (err) {
      return { action: 'error', error: err instanceof Error ? err.message : 'Error desconocido' }
    }
  }

  async markRemovedPlaces(importId: string): Promise<number> {
    const importRecord = await prisma.osmImport.findUnique({ where: { id: importId } })
    if (!importRecord) return 0

    const venues = await prisma.venue.findMany({
      where: { osmId: { not: null } } as any,
      select: { id: true, osmId: true },
    })

    let removedCount = 0
    for (const venue of venues) {
      const osmIdParts = (venue as any).osmId?.split('/')
      if (!osmIdParts || osmIdParts.length < 2) continue
      const [osmType, osmId] = osmIdParts

      const query = `[out:json][timeout:30];${osmType}(${osmId});out ids;`
      try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'ViveLoja/1.0' },
          body: `data=${encodeURIComponent(query)}`,
        })
        const data = await response.json()
        if (!data.elements || data.elements.length === 0) {
          await prisma.venue.update({ where: { id: venue.id }, data: { status: 'DISABLED' } })
          removedCount++
        }
      } catch {
        continue
      }
    }
    return removedCount
  }
}

export const syncService = new SyncService()
