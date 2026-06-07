import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { OsmConfigSchema } from '@/schemas/osm-import'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let config = await prisma.osmConfig.findFirst()
    if (!config) {
      config = await prisma.osmConfig.create({ data: { id: 'default' } })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching OSM config:', error)
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = OsmConfigSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.errors }, { status: 400 })
    }

    let config = await prisma.osmConfig.findFirst()
    if (!config) {
      config = await prisma.osmConfig.create({ data: { id: 'default', ...parsed.data } })
    } else {
      config = await prisma.osmConfig.update({ where: { id: config.id }, data: parsed.data })
    }

    return NextResponse.json({ success: true, config })
  } catch (error) {
    console.error('Error updating OSM config:', error)
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 })
  }
}
