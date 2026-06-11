import { prisma } from '@/lib/prisma'

interface DedupInput {
  performers: string[]
  matchDate: Date
  competition?: string | null
}

interface DedupResult {
  isDuplicate: boolean
  existingEventId: string | null
  existingEventName: string | null
  confidence: number
}

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(fc|cf|sc|cd|ud|sd)\b/g, '')
    .replace(/\b(seleccion|seleção|national|nacional)\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '))
  const setB = new Set(b.split(' '))
  const intersection = new Set([...setA].filter((x) => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size === 0 ? 0 : intersection.size / union.size
}

function datesAreClose(d1: Date, d2: Date, daysWindow: number = 1): boolean {
  const diff = Math.abs(d1.getTime() - d2.getTime())
  return diff <= daysWindow * 24 * 60 * 60 * 1000
}

export async function findDuplicateEvent(input: DedupInput): Promise<DedupResult> {
  const { performers, matchDate, competition } = input

  if (performers.length === 0) {
    return { isDuplicate: false, existingEventId: null, existingEventName: null, confidence: 0 }
  }

  const normalizedPerformers = performers.map(normalizeTeamName)

  const windowStart = new Date(matchDate)
  windowStart.setDate(windowStart.getDate() - 1)
  const windowEnd = new Date(matchDate)
  windowEnd.setDate(windowEnd.getDate() + 1)

  const candidates = await prisma.watchEvent.findMany({
    where: {
      matchDate: { gte: windowStart, lte: windowEnd },
      status: { not: 'CANCELLED' },
    },
    include: { performersList: { include: { performer: true } } },
  })

  let bestMatch: { eventId: string; eventName: string; confidence: number } | null = null

  for (const candidate of candidates) {
    const candidatePerformers = candidate.performersList.map((p) =>
      normalizeTeamName(p.performer.name),
    )

    let matchCount = 0
    for (const np of normalizedPerformers) {
      for (const cp of candidatePerformers) {
        if (np === cp || jaccardSimilarity(np, cp) >= 0.6) {
          matchCount++
          break
        }
      }
    }

    if (matchCount === 0) continue

    const performerConfidence = (matchCount / Math.max(normalizedPerformers.length, candidatePerformers.length)) * 100

    let competitionBonus = 0
    if (competition && candidate.competition) {
      const normComp = normalizeTeamName(competition)
      const normCandComp = normalizeTeamName(candidate.competition)
      if (normComp === normCandComp || jaccardSimilarity(normComp, normCandComp) >= 0.6) {
        competitionBonus = 15
      }
    }

    const dateBonus = datesAreClose(matchDate, candidate.matchDate) ? 10 : 0
    const totalConfidence = Math.min(100, performerConfidence + competitionBonus + dateBonus)

    if (totalConfidence >= 70 && (!bestMatch || totalConfidence > bestMatch.confidence)) {
      bestMatch = {
        eventId: candidate.id,
        eventName: candidate.name,
        confidence: totalConfidence,
      }
    }
  }

  if (bestMatch) {
    return {
      isDuplicate: true,
      existingEventId: bestMatch.eventId,
      existingEventName: bestMatch.eventName,
      confidence: bestMatch.confidence,
    }
  }

  return { isDuplicate: false, existingEventId: null, existingEventName: null, confidence: 0 }
}
