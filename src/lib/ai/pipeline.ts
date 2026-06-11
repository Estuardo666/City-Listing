import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { createAIClient } from './client'
import { decryptApiKey } from './encryption'
import { findDuplicateEvent } from './dedup'
import { uploadBufferToR2, getR2PublicUrl } from '@/lib/storage/r2'

export interface ExtractedData {
  type: 'SPORTS' | 'CONCERT' | 'THEATER' | 'ESPORTS' | 'OTHER'
  performers: string[]
  competition: string | null
  matchDate: string | null // ISO date
  matchTime: string | null // HH:MM
  venueName: string | null
  promotions: string[]
  hasBigScreen: boolean
  hasFreeEntry: boolean
  description: string | null
}

export interface ProcessingResult {
  extracted: ExtractedData
  sourceUrl: string | null
  duplicateEvent: {
    id: string
    name: string
    confidence: number
  } | null
  processingTimeMs: number
  tokensUsed: number | null
}

const SYSTEM_PROMPT = `You are an expert at analyzing promotional flyers, images, PDFs, and text descriptions for sports events, concerts, theater shows, and other live events being shown at bars, restaurants, and venues.

Analyze the provided content and extract structured data. Return ONLY valid JSON with this exact structure:
{
  "type": "SPORTS|CONCERT|THEATER|ESPORTS|OTHER",
  "performers": ["Team/Artist 1", "Team/Artist 2"],
  "competition": "Competition/Tournament name or null",
  "matchDate": "YYYY-MM-DD or null",
  "matchTime": "HH:MM or null",
  "venueName": "Venue/Bar name or null",
  "promotions": ["promotion 1", "promotion 2"],
  "hasBigScreen": true/false,
  "hasFreeEntry": true/false,
  "description": "Brief description of the event"
}

Rules:
- For sports: use team names (e.g., "Ecuador", "Brasil", "Barcelona SC", "Emelec")
- For concerts: use artist/band names (e.g., "Bad Bunny", "Coldplay")
- For theater: use show name (e.g., "Hamilton", "El Fantasma de la Ópera")
- Date format must be YYYY-MM-DD
- Time format must be HH:MM (24h)
- If a field cannot be determined, use null
- Detect if the venue mentions "pantalla gigante", "screen gigante", "mega pantalla" → hasBigScreen: true
- Detect if mentions "entrada gratuita", "free entry", "sin costo" → hasFreeEntry: true
- Extract ALL promotions mentioned (2x1, descuentos, happy hour, etc.)
- If year is not specified, assume 2026`

async function loadConfig() {
  const config = await prisma.aIConfig.findFirst()
  if (!config) throw new Error('AI no configurado. Ve a Admin → IA → Configuración')
  return config
}

async function getClient() {
  const config = await loadConfig()
  const apiKey = config.apiKey ? decryptApiKey(config.apiKey) : ''
  if (!apiKey) throw new Error('API Key no configurada')

  return {
    client: createAIClient({
      provider: config.provider,
      apiKey,
      baseUrl: config.baseUrl,
    }),
    config,
  }
}

export async function processImage(imageUrl: string): Promise<ProcessingResult> {
  const start = Date.now()
  const { client, config } = await getClient()

  const model = config.modelVision || config.modelText || 'gpt-4o'

  const response = await client.chat.completions.create({
    model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analiza este flyer/imagen de evento y extrae la información estructurada.' },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content || '{}'
  const extracted = parseExtractedContent(content)
  const duplicate = await findDuplicateEvent({
    performers: extracted.performers,
    matchDate: extracted.matchDate ? new Date(extracted.matchDate) : new Date(),
    competition: extracted.competition,
  })

  return {
    extracted,
    sourceUrl: imageUrl,
    duplicateEvent: duplicate.isDuplicate
      ? { id: duplicate.existingEventId!, name: duplicate.existingEventName!, confidence: duplicate.confidence }
      : null,
    processingTimeMs: Date.now() - start,
    tokensUsed: response.usage?.total_tokens ?? null,
  }
}

export async function processText(text: string): Promise<ProcessingResult> {
  const start = Date.now()
  const { client, config } = await getClient()

  const model = config.modelText || config.modelVision || 'gpt-4o'

  const response = await client.chat.completions.create({
    model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Analiza este texto promocional de un evento y extrae la información estructurada:\n\n${text}`,
      },
    ],
  })

  const content = response.choices[0]?.message?.content || '{}'
  const extracted = parseExtractedContent(content)
  const duplicate = await findDuplicateEvent({
    performers: extracted.performers,
    matchDate: extracted.matchDate ? new Date(extracted.matchDate) : new Date(),
    competition: extracted.competition,
  })

  return {
    extracted,
    sourceUrl: null,
    duplicateEvent: duplicate.isDuplicate
      ? { id: duplicate.existingEventId!, name: duplicate.existingEventName!, confidence: duplicate.confidence }
      : null,
    processingTimeMs: Date.now() - start,
    tokensUsed: response.usage?.total_tokens ?? null,
  }
}

export async function processPdf(pdfUrl: string): Promise<ProcessingResult> {
  const start = Date.now()
  const { client, config } = await getClient()

  const model = config.modelVision || config.modelText || 'gpt-4o'

  const response = await client.chat.completions.create({
    model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Analiza este documento PDF de evento y extrae la información estructurada.' },
          { type: 'image_url', image_url: { url: pdfUrl, detail: 'high' } },
        ],
      },
    ],
  })

  const content = response.choices[0]?.message?.content || '{}'
  const extracted = parseExtractedContent(content)
  const duplicate = await findDuplicateEvent({
    performers: extracted.performers,
    matchDate: extracted.matchDate ? new Date(extracted.matchDate) : new Date(),
    competition: extracted.competition,
  })

  return {
    extracted,
    sourceUrl: pdfUrl,
    duplicateEvent: duplicate.isDuplicate
      ? { id: duplicate.existingEventId!, name: duplicate.existingEventName!, confidence: duplicate.confidence }
      : null,
    processingTimeMs: Date.now() - start,
    tokensUsed: response.usage?.total_tokens ?? null,
  }
}

function parseExtractedContent(content: string): ExtractedData {
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return {
      type: parsed.type || 'OTHER',
      performers: Array.isArray(parsed.performers) ? parsed.performers : [],
      competition: parsed.competition || null,
      matchDate: parsed.matchDate || null,
      matchTime: parsed.matchTime || null,
      venueName: parsed.venueName || null,
      promotions: Array.isArray(parsed.promotions) ? parsed.promotions : [],
      hasBigScreen: !!parsed.hasBigScreen,
      hasFreeEntry: !!parsed.hasFreeEntry,
      description: parsed.description || null,
    }
  } catch {
    return {
      type: 'OTHER',
      performers: [],
      competition: null,
      matchDate: null,
      matchTime: null,
      venueName: null,
      promotions: [],
      hasBigScreen: false,
      hasFreeEntry: false,
      description: content.slice(0, 500),
    }
  }
}

export async function uploadAndProcessFile(file: Buffer, fileName: string, mimeType: string): Promise<ProcessingResult> {
  const ext = fileName.split('.').pop() || 'bin'
  const key = `watch-events/flyers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await uploadBufferToR2({ key, body: file, contentType: mimeType })
  const publicUrl = getR2PublicUrl(key)

  if (mimeType === 'application/pdf') {
    return processPdf(publicUrl)
  }

  return processImage(publicUrl)
}
