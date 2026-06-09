import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, unauthorized } from '@/lib/api/require-admin'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const body = await request.json()
  const { id, categorySlugs, subcategorySlugs, approved, confidence } = body

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  const mapping = await prisma.googlePlaceTypeMapping.update({
    where: { id },
    data: {
      ...(categorySlugs !== undefined && { categorySlugs }),
      ...(subcategorySlugs !== undefined && { subcategorySlugs }),
      ...(approved !== undefined && { approved }),
      ...(confidence !== undefined && { confidence }),
    },
  })

  return NextResponse.json(mapping)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const body = await request.json()
  const { googleType, categorySlugs, subcategorySlugs, confidence } = body

  if (!googleType) {
    return NextResponse.json({ error: 'googleType requerido' }, { status: 400 })
  }

  const mapping = await prisma.googlePlaceTypeMapping.upsert({
    where: { googleType },
    update: {
      categorySlugs: categorySlugs || [],
      subcategorySlugs: subcategorySlugs || [],
      confidence: confidence ?? 100,
      approved: true,
    },
    create: {
      googleType,
      categorySlugs: categorySlugs || [],
      subcategorySlugs: subcategorySlugs || [],
      confidence: confidence ?? 100,
      approved: true,
    },
  })

  return NextResponse.json(mapping)
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return unauthorized()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  }

  await prisma.googlePlaceTypeMapping.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
