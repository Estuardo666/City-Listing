import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RouteDetail } from '@/components/route/route-detail'
import { FavoriteButton } from '@/components/features/favorites/favorite-button'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { RouteWithStops } from '@/types/route'

type RouteDetailPageProps = {
  params: Promise<{ slug: string }>
}

export default async function RouteDetailPage({ params }: RouteDetailPageProps) {
  const { slug } = await params
  const [route, session] = await Promise.all([
    prisma.route.findFirst({
      where: { slug, status: 'APPROVED' },
      include: {
        user: { select: { id: true, name: true, image: true } },
        stops: {
          include: {
            venue: {
              select: { id: true, name: true, slug: true, image: true, lat: true, lng: true, location: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { favorites: true } },
      },
    }) as Promise<RouteWithStops | null>,
    getServerSession(authOptions),
  ])

  if (!route) notFound()

  const isFavorite = session?.user?.id
    ? await prisma.favorite.findUnique({
        where: { userId_routeId: { userId: session.user.id, routeId: route.id } },
        select: { id: true },
      }).then(Boolean)
    : false

  return (
    <div className="pb-20 pt-10 sm:pt-14">
      <section className="section-shell space-y-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="h-10 gap-2 rounded-xl border border-border/60 bg-card px-4 text-sm font-semibold text-foreground hover:bg-accent">
            <Link href="/rutas">
              <ArrowLeft className="h-4 w-4" />
              Volver a rutas
            </Link>
          </Button>
          {session?.user?.id && (
            <FavoriteButton routeId={route.id} initialIsFavorite={isFavorite} />
          )}
        </div>
        <RouteDetail route={route} />
      </section>
    </div>
  )
}
