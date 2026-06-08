import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { OfferActions } from './offer-actions'

export const metadata = {
  title: 'Ofertas - Admin - Vive Loja',
}

export default async function AdminOffersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  }

  const promotions = await prisma.promotion.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      venue: { select: { name: true, slug: true } },
    },
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    ACTIVE: 'bg-emerald-100 text-emerald-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Ofertas y promociones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las ofertas publicadas por los locales
        </p>
      </div>

      {promotions.length > 0 ? (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div key={promo.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{promo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {promo.venue.name} · {formatDate(promo.validFrom)} - {formatDate(promo.validUntil)}
                  </p>
                </div>
                <Badge className={statusColors[promo.status] ?? ''}>{promo.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{promo.description}</p>
              {promo.status === 'PENDING' && <OfferActions promotionId={promo.id} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">No hay ofertas</p>
        </div>
      )}
    </div>
  )
}
