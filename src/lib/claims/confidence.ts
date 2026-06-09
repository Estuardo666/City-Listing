import 'server-only'
import { prisma } from '@/lib/prisma'

interface ConfidenceFactors {
  emailVerified: boolean
  userRegistered: boolean
  phoneMatches: boolean
  hasEvidence: boolean
}

const WEIGHTS = {
  emailVerified: 40,
  userRegistered: 20,
  phoneMatches: 20,
  hasEvidence: 20,
} as const

/**
 * Calcula el confidence score (0-100) para un claim.
 *
 * +40  correo verificado (código correcto)
 * +20  usuario registrado (tiene sesión)
 * +20  teléfono coincide con venue.phone
 * +20  evidencia subida
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): number {
  let score = 0
  if (factors.emailVerified) score += WEIGHTS.emailVerified
  if (factors.userRegistered) score += WEIGHTS.userRegistered
  if (factors.phoneMatches) score += WEIGHTS.phoneMatches
  if (factors.hasEvidence) score += WEIGHTS.hasEvidence
  return Math.min(score, 100)
}

/**
 * Recalcula y actualiza el confidence score de un claim dado su ID.
 */
export async function recalculateConfidenceScore(claimId: string): Promise<number> {
  const claim = await prisma.venueClaim.findUnique({
    where: { id: claimId },
    include: {
      venue: { select: { phone: true } },
      user: { select: { id: true } },
    },
  })

  if (!claim) return 0

  const factors: ConfidenceFactors = {
    emailVerified: claim.verified,
    userRegistered: !!claim.user?.id,
    phoneMatches:
      !!claim.claimerPhone &&
      !!claim.venue?.phone &&
      normalizePhone(claim.claimerPhone) === normalizePhone(claim.venue.phone),
    hasEvidence: !!claim.evidenceUrl,
  }

  const score = calculateConfidenceScore(factors)

  await prisma.venueClaim.update({
    where: { id: claimId },
    data: { confidenceScore: score },
  })

  return score
}

/** Normaliza un teléfono quitando espacios, guiones y código de país. */
function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^0?593/, '')
}
