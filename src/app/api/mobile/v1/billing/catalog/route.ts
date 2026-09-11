import { getPublishedCatalog } from '@/lib/billing/plans'
import { mobileSuccess, withMobileErrors } from '@/lib/mobile-response'

export const dynamic = 'force-dynamic'

export const GET = withMobileErrors(async () => mobileSuccess(await getPublishedCatalog()))
