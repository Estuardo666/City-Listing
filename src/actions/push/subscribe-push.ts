'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
})

export async function subscribePushAction(input: unknown): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = subscribeSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: 'Datos inválidos.' }

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      create: {
        userId: session.user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
      },
      update: {
        userId: session.user.id,
        p256dh: parsed.data.p256dh,
        auth: parsed.data.auth,
      },
    })

    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo suscribir.' }
  }
}

export async function unsubscribePushAction(endpoint: string): Promise<ActionResponse<void>> {
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } })
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo desuscribir.' }
  }
}
