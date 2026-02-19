import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserPosts } from '@/lib/queries/posts'

const DEFAULT_TAKE = 10

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const skip = Number(searchParams.get('skip') ?? '0')
    const take = Number(searchParams.get('take') ?? String(DEFAULT_TAKE))
    const q = searchParams.get('q') ?? ''
    const statusParam = (searchParams.get('status') ?? 'ALL').toUpperCase()
    const tag = searchParams.get('tag') ?? ''

    const status =
      statusParam === 'APPROVED' || statusParam === 'PENDING' || statusParam === 'REJECTED'
        ? statusParam
        : 'ALL'

    const data = await getUserPosts({
      userId: session.user.id,
      skip: Number.isFinite(skip) ? Math.max(0, skip) : 0,
      take: Number.isFinite(take) ? Math.min(Math.max(1, take), 50) : DEFAULT_TAKE,
      q,
      status,
      tag,
    })

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
