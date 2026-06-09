import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ClaimActions } from './claim-actions'
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Shield,
  ExternalLink,
} from 'lucide-react'

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
      venue: { select: { name: true, slug: true, phone: true } },
      user: { select: { name: true, email: true } },
    },
  })

  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    VERIFIED: 'bg-blue-100 text-blue-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50'
    if (score >= 40) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  function getScoreBarColor(score: number) {
    if (score >= 80) return 'bg-emerald-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-red-500'
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
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="rounded-xl border border-border/50 bg-card p-5 space-y-4"
            >
              {/* Header: Venue + Status */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-lg font-semibold truncate">{claim.venue.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(claim.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {claim.verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <Shield className="h-3.5 w-3.5" />
                      Verificado
                    </span>
                  )}
                  <Badge className={statusColors[claim.status] ?? ''}>
                    {claim.status === 'PENDING' && 'Pendiente'}
                    {claim.status === 'VERIFIED' && 'Verificado'}
                    {claim.status === 'APPROVED' && 'Aprobado'}
                    {claim.status === 'REJECTED' && 'Rechazado'}
                  </Badge>
                </div>
              </div>

              {/* Claimer info grid */}
              <div className="grid grid-cols-1 gap-3 rounded-lg bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Solicitante</p>
                    <p className="font-medium">{claim.claimerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Correo</p>
                    <p className="font-medium">{claim.claimerEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{claim.claimerPhone ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cargo</p>
                    <p className="font-medium">{claim.claimerRole ?? '—'}</p>
                  </div>
                </div>
              </div>

              {/* Confidence score bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Puntuación de confianza</span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${getScoreColor(claim.confidenceScore)}`}>
                    {claim.confidenceScore}/100
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${getScoreBarColor(claim.confidenceScore)}`}
                    style={{ width: `${claim.confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Evidence link */}
              {claim.evidenceUrl && (
                <a
                  href={claim.evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver evidencia: {claim.evidenceName ?? 'documento'}
                </a>
              )}

              {/* Message */}
              {claim.message && (
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Mensaje del solicitante</p>
                  <p className="mt-1 text-sm">{claim.message}</p>
                </div>
              )}

              {/* Admin notes */}
              {claim.adminNotes && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800">Notas del admin</p>
                  <p className="mt-1 text-sm text-amber-900">{claim.adminNotes}</p>
                </div>
              )}

              {/* Actions */}
              {(claim.status === 'PENDING' || claim.status === 'VERIFIED') && (
                <ClaimActions claimId={claim.id} />
              )}
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
