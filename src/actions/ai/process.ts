'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadAndProcessFile, processText, processImage, type ExtractedData, type ProcessingResult } from '@/lib/ai/pipeline'
import type { ActionResponse } from '@/types/action-response'

interface ProcessFlyerResult {
  logId: string
  extracted: ExtractedData
  sourceUrl: string | null
  duplicateEvent: { id: string; name: string; confidence: number } | null
  processingTimeMs: number
  tokensUsed: number | null
  matchedVenues: Array<{ id: string; name: string; slug: string }>
}

export async function processFlyerAction(formData: FormData): Promise<ActionResponse<ProcessFlyerResult>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const file = formData.get('file') as File | null
    const text = formData.get('text') as string | null

    if (!file && !text?.trim()) {
      return { success: false, error: 'Proporciona un archivo o texto para procesar.' }
    }

    let result: ProcessingResult

    if (file) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      result = await uploadAndProcessFile(buffer, file.name, file.type)
    } else {
      result = await processText(text!.trim())
    }

    const matchedVenues: Array<{ id: string; name: string; slug: string }> = []
    if (result.extracted.venueName) {
      const venues = await prisma.venue.findMany({
        where: {
          status: 'APPROVED',
          isActive: true,
          name: { contains: result.extracted.venueName, mode: 'insensitive' },
        },
        select: { id: true, name: true, slug: true },
        take: 5,
      })
      matchedVenues.push(...venues)
    }

    const log = await prisma.aIProcessingLog.create({
      data: {
        sourceType: file ? (file.type === 'application/pdf' ? 'PDF' : 'IMAGE') : 'TEXT',
        sourceUrl: result.sourceUrl,
        inputText: text?.trim() || null,
        extractedData: JSON.stringify(result.extracted),
        tokensUsed: result.tokensUsed,
        processingTimeMs: result.processingTimeMs,
        status: 'COMPLETED',
      },
    })

    return {
      success: true,
      data: {
        logId: log.id,
        extracted: result.extracted,
        sourceUrl: result.sourceUrl,
        duplicateEvent: result.duplicateEvent,
        processingTimeMs: result.processingTimeMs,
        tokensUsed: result.tokensUsed,
        matchedVenues,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error procesando el flyer.'
    return { success: false, error: message }
  }
}
