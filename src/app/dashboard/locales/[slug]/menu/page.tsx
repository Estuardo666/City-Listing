import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVenueMenu } from '@/lib/queries/features'
import { MenuManager } from '@/components/menu/menu-manager'

export const metadata = { title: 'Menú — Vive Loja' }

export default async function VenueMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const venue = await prisma.venue.findFirst({
    where: { slug, userId: session.user.id },
    select: { id: true, name: true },
  })

  if (!venue) redirect('/dashboard/locales')

  const menu = await getVenueMenu(venue.id)

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{venue.name}</p>
          <h1 className="text-2xl font-semibold text-foreground">Menú / Carta</h1>
        </div>
        <MenuManager venueId={venue.id} initialMenu={menu} />
      </section>
    </div>
  )
}
