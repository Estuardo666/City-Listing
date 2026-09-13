import type { Metadata } from 'next'
import { SeoEventLanding } from '@/components/features/events/seo-event-landing'
import {
  EVENT_LANDING_CONFIGS,
  buildEventLandingMetadata,
  getSeoEventLandingEvents,
} from '@/lib/seo/event-landings'

export const revalidate = 900
export const metadata: Metadata = buildEventLandingMetadata(EVENT_LANDING_CONFIGS.weekend)

export default async function EventosEsteFinDeSemanaEnLojaPage() {
  const config = EVENT_LANDING_CONFIGS.weekend
  const events = await getSeoEventLandingEvents(config)
  return <SeoEventLanding config={config} events={events} />
}
