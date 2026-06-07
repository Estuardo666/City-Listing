import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { importService } from '@/lib/osm/import-service'
import { OsmBulkImportSchema } from '@/schemas/osm-import'
import type { OsmPlace } from '@/types/osm-import'

async function logToImport(importId: string, message: string, level: string) {
  await prisma.osmImportLog.create({
    data: { importId, message, level },
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = OsmBulkImportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.errors }, { status: 400 })
    }

    const { places, categoryId, importId, options } = parsed.data

    if (importId) {
      await prisma.osmImport.update({
        where: { id: importId },
        data: { status: 'RUNNING' },
      })
      await logToImport(importId, `Iniciando importación de ${places.length} lugares`, 'INFO')
    }

    const result = await importService.bulkImport(
      places as OsmPlace[],
      categoryId,
      session.user.id,
      options,
      importId,
      logToImport
    )

    if (importId) {
      await prisma.osmImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          importedCount: result.imported,
          duplicateCount: result.duplicates,
          errorCount: result.errors,
        },
      })
      await logToImport(importId, `Importación completada: ${result.imported} importados, ${result.duplicates} duplicados, ${result.errors} errores`, 'INFO')
    }

    return NextResponse.json({ success: true, stats: result })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error en importación masiva' }, { status: 500 })
  }
}
