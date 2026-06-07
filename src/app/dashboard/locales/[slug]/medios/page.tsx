import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MediaManager } from '@/components/media/media-manager'

export const metadata = {
  title: 'Medios — Dashboard',
}

export default async function VenueMediaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const { slug } = await params

  const venue = await prisma.venue.findFirst({
    where: {
      slug,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImage: true,
      logo: true,
      media: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!venue) redirect('/dashboard/locales')

  return (
    <div className="pb-16 pt-8">
      <section className="mx-auto max-w-4xl space-y-8 px-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {venue.name}
          </p>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
            Gestión de Medios
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra las imágenes, logo y portada de tu local.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <MediaManager
            venueId={venue.id}
            initialMedia={venue.media}
            currentCover={venue.coverImage}
            currentLogo={venue.logo}
          />
        </div>
      </section>
    </div>
  )
}
