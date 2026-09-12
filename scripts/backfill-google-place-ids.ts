import { PrismaClient } from '@prisma/client'
import { googlePlacesService, type GooglePlace } from '../src/lib/google-places'

const prisma = new PrismaClient()

type VenueRow = {
  id: string
  name: string
  address: string | null
  location: string
  lat: number | null
  lng: number | null
  phone: string | null
}

type Candidate = {
  place: GooglePlace
  nameScore: number
  addressScore: number
  distanceMeters: number | null
  phoneMatch: boolean
  score: number
}

type MatchDecision = {
  venue: VenueRow
  candidate: Candidate | null
  secondScore: number
  decision: 'auto' | 'review' | 'none' | 'conflict'
  reason: string
}

const delayMs = Number(process.argv.find((arg) => arg.startsWith('--delay='))?.split('=')[1] || '1000')
const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '117')
const apply = process.argv.includes('--apply')

function normalize(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' y ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(value: string | null | undefined): Set<string> {
  return new Set(
    normalize(value)
      .split(' ')
      .filter((token) => token.length >= 3 && !['loja', 'ecuador', 'de', 'del', 'la', 'el', 'los', 'las'].includes(token))
  )
}

function tokenSimilarity(left: string | null | undefined, right: string | null | undefined): number {
  const a = tokens(left)
  const b = tokens(right)
  if (a.size === 0 || b.size === 0) return 0
  const intersection = [...a].filter((token) => b.has(token)).length
  return intersection / Math.max(a.size, b.size)
}

function textSimilarity(left: string | null | undefined, right: string | null | undefined): number {
  const a = normalize(left)
  const b = normalize(right)
  if (!a || !b) return 0
  if (a === b) return 1
  if (a.includes(b) || b.includes(a)) return 0.94
  return tokenSimilarity(left, right)
}

function phoneDigits(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '')
}

function phoneMatches(left: string | null | undefined, right: string | null | undefined): boolean {
  const a = phoneDigits(left)
  const b = phoneDigits(right)
  if (a.length < 7 || b.length < 7) return false
  return a === b || a.endsWith(b.slice(-7)) || b.endsWith(a.slice(-7))
}

function distanceMeters(
  lat1: number | null | undefined,
  lng1: number | null | undefined,
  lat2: number | null | undefined,
  lng2: number | null | undefined
): number | null {
  if (![lat1, lng1, lat2, lng2].every((value) => typeof value === 'number' && Number.isFinite(value))) return null
  const radians = Math.PI / 180
  const dLat = ((lat2! - lat1!) * radians)
  const dLng = ((lng2! - lng1!) * radians)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1! * radians) * Math.cos(lat2! * radians) * Math.sin(dLng / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distanceScore(distance: number | null): number {
  if (distance === null) return 0
  if (distance <= 100) return 1
  if (distance <= 300) return 0.9
  if (distance <= 700) return 0.75
  if (distance <= 1500) return 0.45
  return 0
}

function scoreCandidate(venue: VenueRow, place: GooglePlace): Candidate {
  const nameScore = textSimilarity(venue.name, place.displayName?.text)
  const addressScore = tokenSimilarity(venue.address || venue.location, place.formattedAddress)
  const distance = distanceMeters(venue.lat, venue.lng, place.location?.latitude, place.location?.longitude)
  const phoneMatch = phoneMatches(venue.phone, place.nationalPhoneNumber)
  const score =
    nameScore * 0.5 +
    addressScore * 0.15 +
    distanceScore(distance) * 0.25 +
    (phoneMatch ? 0.1 : 0)

  return { place, nameScore, addressScore, distanceMeters: distance, phoneMatch, score }
}

function isSafeMatch(venue: VenueRow, candidate: Candidate, secondScore: number): boolean {
  const distance = candidate.distanceMeters
  const exactName = normalize(venue.name) === normalize(candidate.place.displayName?.text)
  const closeEnough = distance !== null && distance <= 1500
  const clearLead = candidate.score - secondScore >= 0.12

  if (!clearLead || !closeEnough) return false
  if (candidate.phoneMatch && candidate.nameScore >= 0.7) return true
  if (exactName && distance !== null && distance <= 300) return true
  if (exactName && distance !== null && distance <= 1000 && candidate.addressScore >= 0.25) return true
  return false
}

function formatCandidate(candidate: Candidate | null): string {
  if (!candidate) return 'sin candidato'
  const distance = candidate.distanceMeters === null ? '?' : `${Math.round(candidate.distanceMeters)}m`
  const rating = candidate.place.rating == null ? 'sin rating' : `${candidate.place.rating}/${candidate.place.userRatingCount ?? 0}`
  return `${candidate.place.displayName?.text} | ${distance} | ${rating} | score ${candidate.score.toFixed(2)}`
}

async function findDecision(venue: VenueRow): Promise<MatchDecision> {
  const query = `${venue.name}, ${venue.address || venue.location}, Loja, Ecuador`
  const result = await googlePlacesService.searchPlaces(query, {
    ...(venue.lat !== null && venue.lng !== null ? { location: { lat: venue.lat, lng: venue.lng } } : {}),
    radius: 2000,
    maxResultCount: 20,
  })

  const candidates = result.places
    .filter((place) => place.id && place.displayName?.text && !/^([A-Z0-9]{2,}\+){1}/.test(place.displayName.text))
    .map((place) => scoreCandidate(venue, place))
    .sort((a, b) => b.score - a.score)

  const candidate = candidates[0] || null
  const secondScore = candidates[1]?.score || 0
  if (!candidate) return { venue, candidate: null, secondScore, decision: 'none', reason: 'Google no devolvió candidatos utilizables' }
  if (!isSafeMatch(venue, candidate, secondScore)) {
    return { venue, candidate, secondScore, decision: 'review', reason: 'Coincidencia insuficientemente clara' }
  }

  const existing = await prisma.venue.findUnique({
    where: { googlePlaceId: candidate.place.id },
    select: { id: true },
  })
  if (existing && existing.id !== venue.id) {
    return { venue, candidate, secondScore, decision: 'conflict', reason: 'El Place ID ya está vinculado a otro local' }
  }

  return { venue, candidate, secondScore, decision: 'auto', reason: 'Coincidencia segura' }
}

async function main() {
  const venues = await prisma.venue.findMany({
    where: { googlePlaceId: null, status: 'APPROVED', isActive: true },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, name: true, address: true, location: true, lat: true, lng: true, phone: true },
  })

  console.log(`Modo: ${apply ? 'APLICAR' : 'SIMULACIÓN LOCAL'}`)
  console.log(`Locales objetivo: ${venues.length}`)
  console.log(`Pausa entre búsquedas: ${delayMs}ms`)

  const decisions: MatchDecision[] = []
  for (let index = 0; index < venues.length; index++) {
    const venue = venues[index]
    try {
      const decision = await findDecision(venue)
      decisions.push(decision)
      console.log(`[${index + 1}/${venues.length}] ${venue.name} -> ${formatCandidate(decision.candidate)} | ${decision.decision}`)

      if (apply && decision.decision === 'auto' && decision.candidate) {
        await prisma.venue.update({
          where: { id: venue.id },
          data: {
            googlePlaceId: decision.candidate.place.id,
            googleRating: decision.candidate.place.rating ?? null,
            googleReviewCount: decision.candidate.place.userRatingCount ?? 0,
            googleLastSyncAt: new Date(),
          },
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      decisions.push({ venue, candidate: null, secondScore: 0, decision: 'none', reason: message })
      console.error(`[${index + 1}/${venues.length}] ${venue.name} -> ERROR: ${message}`)
    }

    if (index < venues.length - 1 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  const summary = {
    target: venues.length,
    auto: decisions.filter((decision) => decision.decision === 'auto').length,
    review: decisions.filter((decision) => decision.decision === 'review').length,
    conflict: decisions.filter((decision) => decision.decision === 'conflict').length,
    none: decisions.filter((decision) => decision.decision === 'none').length,
    applied: apply ? decisions.filter((decision) => decision.decision === 'auto').length : 0,
    autoWithRating: decisions.filter((decision) => decision.decision === 'auto' && decision.candidate?.place.rating != null).length,
  }

  console.log('--- RESUMEN ---')
  console.log(JSON.stringify(summary, null, 2))
  if (!apply) console.log('Simulación terminada. Usa --apply para guardar solo las coincidencias seguras.')
}

main()
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
