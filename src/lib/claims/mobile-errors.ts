import 'server-only'

import { mobileError } from '@/lib/mobile-response'

import type { ClaimFailure } from './service'

/**
 * One mapping from claim failures to mobile error codes, shared by the claim
 * routes. It lives here rather than in a route file because Next rejects
 * unexpected exports from a route module.
 */
const FAILURES: Record<ClaimFailure, { code: string; status: number }> = {
  VENUE_NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  ALREADY_OWNER: { code: 'CONFLICT', status: 409 },
  ALREADY_CLAIMING: { code: 'CONFLICT', status: 409 },
  CLAIM_NOT_FOUND: { code: 'NOT_FOUND', status: 404 },
  FORBIDDEN: { code: 'FORBIDDEN', status: 403 },
  CODE_EXPIRED: { code: 'CODE_EXPIRED', status: 410 },
  TOO_MANY_ATTEMPTS: { code: 'RATE_LIMITED', status: 429 },
  INVALID_CODE: { code: 'INVALID_CODE', status: 400 },
}

export function claimFailureResponse(reason: ClaimFailure, message: string) {
  const failure = FAILURES[reason]
  return mobileError(failure.code, message, failure.status)
}
