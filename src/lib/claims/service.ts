import 'server-only'

import { sendClaimVerificationEmail } from '@/lib/email/templates/claim-verification'
import { prisma } from '@/lib/prisma'

import { recalculateConfidenceScore } from './confidence'

/**
 * Business-owner claims, independent of how the caller authenticated.
 *
 * The web Server Actions and API routes use a NextAuth session; the mobile API
 * uses a bearer principal. Both end up here so the verification code, the retry
 * budget and the confidence scoring behave identically on every surface —
 * duplicating them once produced a mobile flow that could be brute-forced while
 * the web one could not.
 */

/** Codes expire quickly; the claimant has the mail open while they type. */
const CODE_TTL_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

export type ClaimFailure =
  | 'VENUE_NOT_FOUND'
  | 'ALREADY_OWNER'
  | 'ALREADY_CLAIMING'
  | 'CLAIM_NOT_FOUND'
  | 'FORBIDDEN'
  | 'CODE_EXPIRED'
  | 'TOO_MANY_ATTEMPTS'
  | 'INVALID_CODE'

export type ClaimResult<T> = { ok: true; data: T } | { ok: false; reason: ClaimFailure; message: string }

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export interface CreateClaimInput {
  venueId: string
  claimerName: string
  claimerEmail: string
  claimerPhone: string | null
  claimerRole: string | null
  message: string | null
}

export async function createClaim(
  userId: string,
  input: CreateClaimInput,
): Promise<ClaimResult<{ claimId: string; venueSlug: string; confidenceScore: number }>> {
  const venue = await prisma.venue.findUnique({
    where: { id: input.venueId },
    select: { id: true, userId: true, slug: true, name: true },
  })

  if (!venue) {
    return { ok: false, reason: 'VENUE_NOT_FOUND', message: 'Local no encontrado.' }
  }
  if (venue.userId === userId) {
    return { ok: false, reason: 'ALREADY_OWNER', message: 'Ya eres el dueño de este local.' }
  }

  const existing = await prisma.venueClaim.findFirst({
    where: { venueId: input.venueId, userId, status: { in: ['PENDING', 'VERIFIED'] } },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false,
      reason: 'ALREADY_CLAIMING',
      message: 'Ya tienes un reclamo activo para este local.',
    }
  }

  const claim = await prisma.venueClaim.create({
    data: {
      venueId: input.venueId,
      userId,
      claimerName: input.claimerName,
      claimerEmail: input.claimerEmail,
      claimerPhone: input.claimerPhone,
      claimerRole: input.claimerRole,
      message: input.message,
      verificationCode: generateCode(),
      codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      attempts: 0,
      verified: false,
      status: 'PENDING',
    },
    select: { id: true, verificationCode: true },
  })

  const confidenceScore = await recalculateConfidenceScore(claim.id)

  // Delivery failure must not lose the claim: the claimant can ask for a new
  // code, and the row is already scored.
  const emailResult = await sendClaimVerificationEmail(
    input.claimerEmail,
    input.claimerName,
    claim.verificationCode ?? '',
  )
  if (!emailResult.success) {
    console.error('[claims] verification email failed', emailResult.error)
  }

  return { ok: true, data: { claimId: claim.id, venueSlug: venue.slug, confidenceScore } }
}

export async function verifyClaimCode(
  userId: string,
  input: { claimId: string; code: string },
): Promise<ClaimResult<{ verified: true; confidenceScore: number; attemptsLeft: number }>> {
  const claim = await prisma.venueClaim.findUnique({
    where: { id: input.claimId },
    select: {
      id: true,
      userId: true,
      verificationCode: true,
      codeExpiresAt: true,
      attempts: true,
      verified: true,
    },
  })

  if (!claim) {
    return { ok: false, reason: 'CLAIM_NOT_FOUND', message: 'Reclamo no encontrado.' }
  }
  if (claim.userId !== userId) {
    return { ok: false, reason: 'FORBIDDEN', message: 'No autorizado.' }
  }
  if (claim.verified) {
    const score = await recalculateConfidenceScore(claim.id)
    return { ok: true, data: { verified: true, confidenceScore: score, attemptsLeft: MAX_ATTEMPTS } }
  }
  if (claim.attempts >= MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: 'TOO_MANY_ATTEMPTS',
      message: 'Demasiados intentos. Solicita un nuevo código.',
    }
  }
  if (!claim.codeExpiresAt || new Date() > claim.codeExpiresAt) {
    return {
      ok: false,
      reason: 'CODE_EXPIRED',
      message: 'El código ha expirado. Solicita un nuevo código.',
    }
  }

  if (claim.verificationCode !== input.code) {
    await prisma.venueClaim.update({
      where: { id: claim.id },
      data: { attempts: { increment: 1 } },
    })
    const remaining = MAX_ATTEMPTS - 1 - claim.attempts
    return {
      ok: false,
      reason: 'INVALID_CODE',
      message: `Código incorrecto. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`,
    }
  }

  await prisma.venueClaim.update({
    where: { id: claim.id },
    data: { verified: true, status: 'VERIFIED' },
  })

  const confidenceScore = await recalculateConfidenceScore(claim.id)
  return { ok: true, data: { verified: true, confidenceScore, attemptsLeft: MAX_ATTEMPTS } }
}

/** Attaches uploaded proof and re-scores; the file itself is stored in R2. */
export async function attachClaimEvidence(
  userId: string,
  input: { claimId: string; evidenceUrl: string; evidenceName: string | null },
): Promise<ClaimResult<{ confidenceScore: number }>> {
  const claim = await prisma.venueClaim.findUnique({
    where: { id: input.claimId },
    select: { id: true, userId: true },
  })

  if (!claim) return { ok: false, reason: 'CLAIM_NOT_FOUND', message: 'Reclamo no encontrado.' }
  if (claim.userId !== userId) return { ok: false, reason: 'FORBIDDEN', message: 'No autorizado.' }

  await prisma.venueClaim.update({
    where: { id: claim.id },
    data: { evidenceUrl: input.evidenceUrl, evidenceName: input.evidenceName },
  })

  return { ok: true, data: { confidenceScore: await recalculateConfidenceScore(claim.id) } }
}

export const CLAIM_MAX_ATTEMPTS = MAX_ATTEMPTS
