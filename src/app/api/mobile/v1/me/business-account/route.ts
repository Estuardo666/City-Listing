import { getMobilePrincipal } from '@/lib/mobile-auth'
import { getBusinessAccountSnapshot } from '@/lib/billing/service'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

export const dynamic = 'force-dynamic'

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para consultar tu cuenta empresarial.', 401)
  const snapshot = await getBusinessAccountSnapshot(principal.userId)
  return mobileSuccess(snapshot ?? {
    account: null,
    plan: { slug: 'free', name: 'Gratis', source: 'INHERITED', capabilities: { maxLocations: 1, maxMembers: 1, maxMediaPerVenue: 0, googlePhotoEnabled: true, menuEnabled: false, servicesEnabled: true, monthlyEventsPerVenue: 0, maxActivePromotionsPerVenue: 0, analyticsRetentionDays: null, whatsappEnabled: false, messagingEnabled: false, reservationsEnabled: false, priorityModeration: false, includedBoostCredits: 0, eventTicketingEnabled: false, seatMapsEnabled: false }, entitlementsVersion: 'free-v1', monthlyPrice: 0, annualPrice: 0, currency: 'USD', versionId: 'free-default', version: 1 },
    subscription: null,
    usage: { locations: { used: 0, limit: 1 }, members: { used: 0, limit: 1 }, boostCredits: { used: 0, limit: 0 }, venues: [] },
    members: [],
    venues: [],
    orders: [],
  })
})
