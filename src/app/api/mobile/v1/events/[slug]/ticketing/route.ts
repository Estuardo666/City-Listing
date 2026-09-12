import { mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { getPublicTicketingBySlug } from '@/lib/ticketing'

export const dynamic = 'force-dynamic'

export const GET = withMobileErrors(async (_request: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  return mobileSuccess(await getPublicTicketingBySlug(slug))
})
