'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { checkoutAddon, checkoutSubscription } from '@/lib/billing/service'
import { sendPlanActivatedEmail } from '@/lib/email/templates/plan-activated'
import type { ActionResponse } from '@/types/action-response'

const checkoutSchema = z.object({
  planSlug: z.enum(['free', 'plus', 'pro', 'enterprise']),
  cycle: z.enum(['MONTHLY', 'ANNUAL']),
  idempotencyKey: z.string().min(8).max(120),
  device: z.string().max(40).optional().nullable(),
})

const addonCheckoutSchema = z.object({
  addonSlug: z.string().trim().min(1).max(80),
  idempotencyKey: z.string().min(8).max(120),
  venueId: z.string().min(1).optional().nullable(),
  eventId: z.string().min(1).optional().nullable(),
  device: z.string().max(40).optional().nullable(),
})

export async function activatePlanAction(input: unknown): Promise<ActionResponse<Awaited<ReturnType<typeof checkoutSubscription>>>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Inicia sesión para activar un plan.' }
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  try {
    const order = await checkoutSubscription({ userId: session.user.id, ...parsed.data })
    if (session.user.email && order.plan) {
      const delivery = await sendPlanActivatedEmail({
        to: session.user.email,
        name: session.user.name ?? null,
        planName: order.plan.name,
        cycle: order.cycle,
        referenceAmount: order.referenceAmount,
        startsAt: order.startsAt,
        endsAt: order.endsAt,
        idempotencyKey: `billing:${order.id}:plan-activated`,
      })
      if (!delivery.success) console.error('Plan activation email error:', delivery.error)
    }
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/plan')
    revalidatePath('/locales')
    return { success: true, data: order }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo activar el plan.' }
  }
}

export async function purchaseAddonAction(input: unknown): Promise<ActionResponse<Awaited<ReturnType<typeof checkoutAddon>>>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Inicia sesión para comprar un producto.' }
  const parsed = addonCheckoutSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  try {
    return { success: true, data: await checkoutAddon({ userId: session.user.id, ...parsed.data }) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo registrar la compra.' }
  }
}
