type WatchEventRecord = {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  image: string | null
  matchDate: Date
  matchTime: string | null
  competition: string | null
  performers: string | null
  status: string
  featured: boolean
  viewCount: number
  performersList: Array<{
    role: string | null
    performer: { id: string; name: string; slug: string; type: string; logo: string | null }
  }>
}

export function mapWatchEvent(event: WatchEventRecord) {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    type: event.type,
    description: event.description,
    image: event.image,
    matchDate: event.matchDate,
    matchTime: event.matchTime,
    competition: event.competition,
    performers: event.performersList.map(({ role, performer }) => ({ ...performer, role })),
    featured: event.featured,
    viewCount: event.viewCount,
  }
}
