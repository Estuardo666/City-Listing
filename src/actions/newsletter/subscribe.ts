'use server'

import { prisma } from '@/lib/prisma'
import { newsletterSubscribeSchema } from '@/schemas/newsletter.schema'
import type { ActionResponse } from '@/types/action-response'
import type { NewsletterSubscription } from '@prisma/client'
import crypto from 'crypto'

export async function subscribeNewsletterAction(
  input: unknown
): Promise<ActionResponse<NewsletterSubscription>> {
  try {
    const parsed = newsletterSubscribeSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Datos inválidos.',
      }
    }

    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email: parsed.data.email },
    })

    if (existing) {
      if (existing.active) {
        return { success: false, error: 'Ya estás suscrito al newsletter.' }
      }

      const updated = await prisma.newsletterSubscription.update({
        where: { email: parsed.data.email },
        data: { active: true, name: parsed.data.name },
      })

      return { success: true, data: updated }
    }

    const token = crypto.randomBytes(32).toString('hex')

    const created = await prisma.newsletterSubscription.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        token,
        confirmed: false,
        active: true,
      },
    })

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo procesar la suscripción.' }
  }
}

export async function confirmNewsletterAction(
  token: string
): Promise<ActionResponse<void>> {
  try {
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { token },
    })

    if (!subscription) {
      return { success: false, error: 'Token inválido.' }
    }

    if (subscription.confirmed) {
      return { success: false, error: 'Ya está confirmado.' }
    }

    await prisma.newsletterSubscription.update({
      where: { token },
      data: { confirmed: true },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo confirmar.' }
  }
}

export async function unsubscribeNewsletterAction(
  token: string
): Promise<ActionResponse<void>> {
  try {
    const subscription = await prisma.newsletterSubscription.findUnique({
      where: { token },
    })

    if (!subscription) {
      return { success: false, error: 'Token inválido.' }
    }

    await prisma.newsletterSubscription.update({
      where: { token },
      data: { active: false },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo procesar.' }
  }
}
