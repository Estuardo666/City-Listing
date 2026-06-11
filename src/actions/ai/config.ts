'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptApiKey, decryptApiKey } from '@/lib/ai/encryption'
import type { ActionResponse } from '@/types/action-response'

export interface AIConfigData {
  provider: string
  apiKey: string
  baseUrl: string
  modelVision: string
  modelText: string
  timeout: number
  temperature: number
  maxTokens: number
}

export async function getAIConfigAction(): Promise<ActionResponse<AIConfigData>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const config = await prisma.aIConfig.findFirst()
    if (!config) {
      return {
        success: true,
        data: {
          provider: 'openai',
          apiKey: '',
          baseUrl: '',
          modelVision: '',
          modelText: '',
          timeout: 30,
          temperature: 0.1,
          maxTokens: 4096,
        },
      }
    }

    return {
      success: true,
      data: {
        provider: config.provider,
        apiKey: config.apiKey ? '••••••••' : '',
        baseUrl: config.baseUrl || '',
        modelVision: config.modelVision || '',
        modelText: config.modelText || '',
        timeout: config.timeout,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      },
    }
  } catch {
    return { success: false, error: 'Error obteniendo configuración.' }
  }
}

export async function saveAIConfigAction(input: AIConfigData & { apiKeyPlain?: string }): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const existing = await prisma.aIConfig.findFirst()

    const data: Record<string, unknown> = {
      provider: input.provider,
      baseUrl: input.baseUrl || null,
      modelVision: input.modelVision || null,
      modelText: input.modelText || null,
      timeout: input.timeout,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    }

    if (input.apiKeyPlain) {
      data.apiKey = encryptApiKey(input.apiKeyPlain)
    }

    if (existing) {
      await prisma.aIConfig.update({ where: { id: existing.id }, data })
    } else {
      await prisma.aIConfig.create({ data })
    }

    return { success: true }
  } catch {
    return { success: false, error: 'Error guardando configuración.' }
  }
}

export async function testConnectionAction(): Promise<ActionResponse<{ connected: boolean; models: string[] }>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const config = await prisma.aIConfig.findFirst()
    if (!config || !config.apiKey) {
      return { success: false, error: 'No hay API Key configurada.' }
    }

    const apiKey = decryptApiKey(config.apiKey)
    const { createAIClient } = await import('@/lib/ai/client')
    const client = createAIClient({ provider: config.provider, apiKey, baseUrl: config.baseUrl })

    const modelsResponse = await client.models.list()
    const models = modelsResponse.data
      .map((m) => m.id)
      .filter((id) => id.length > 0)
      .sort()

    return { success: true, data: { connected: true, models } }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error de conexión.'
    return { success: false, error: message }
  }
}

export async function getAIStatsAction(): Promise<ActionResponse<{
  totalProcessed: number
  totalConfirmed: number
  totalTokens: number
  avgProcessingTime: number
}>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: 'No autorizado.' }
    }

    const [totalProcessed, confirmedCount, tokensAgg, timeAgg] = await Promise.all([
      prisma.aIProcessingLog.count(),
      prisma.aIProcessingLog.count({ where: { status: 'CONFIRMED' } }),
      prisma.aIProcessingLog.aggregate({ _sum: { tokensUsed: true } }),
      prisma.aIProcessingLog.aggregate({ _avg: { processingTimeMs: true }, where: { processingTimeMs: { not: null } } }),
    ])

    return {
      success: true,
      data: {
        totalProcessed,
        totalConfirmed: confirmedCount,
        totalTokens: tokensAgg._sum.tokensUsed || 0,
        avgProcessingTime: Math.round(timeAgg._avg.processingTimeMs || 0),
      },
    }
  } catch {
    return { success: false, error: 'Error obteniendo estadísticas.' }
  }
}
