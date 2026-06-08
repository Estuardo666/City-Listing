import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ClaimActions } from './claim-actions'

export const metadata = {
  title: 'Reclamos - Admin - Vive Loja',
}

export default async function AdminClaimsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return <div className="p-8 text-center text-muted-foreground">No autorizado</div>
  }

  const claims = await prisma.venueClaim.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      venue: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium">Reclamos de locales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona los reclamos de propiedad de locales
        </p>
      </div>

      {claims.length > 0 ? (
        <div className="space-y-3">
          {claims.map((claim) => (
            <div key={claim.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{claim.venue.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Reclamado por {claim.user.name ?? claim.user.email} · {formatDate(claim.createdAt)}
                  </p>
                </div>
                <Badge className={statusColors[claim.status] ?? ''}>{claim.status}</Badge>
              </div>
              {claim.message && <p className="text-sm text-muted-foreground">{claim.message}</p>}
              {claim.status === 'PENDING' && <ClaimActions claimId={claim.id} />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">No hay reclamos</p>
        </div>
      )}
    </div>
  )
}
