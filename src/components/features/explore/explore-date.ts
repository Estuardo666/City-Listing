const exploreEventDateFormatter = new Intl.DateTimeFormat('es-EC', {
  timeZone: 'America/Guayaquil',
  day: 'numeric',
  month: 'short',
})

export function formatExploreEventDate(value: string | Date): string {
  return exploreEventDateFormatter.format(new Date(value))
}
