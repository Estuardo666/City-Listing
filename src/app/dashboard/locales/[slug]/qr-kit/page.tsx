import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { QRKitGenerator } from '@/components/features/qr/qr-kit-generator'

export const metadata = { title: 'Kit QR — Vive Loja' }

export default async function QRKitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/auth/signin')

  const venue = await prisma.venue.findFirst({
    where: { slug, userId: session.user.id },
    select: { id: true, name: true, slug: true },
  })
  if (!venue) redirect('/dashboard/locales')

  return (
    <div className="pb-16 pt-8">
      <section className="section-shell">
        <QRKitGenerator venueName={venue.name} venueSlug={venue.slug} />
      </section>
    </div>
  )
}
