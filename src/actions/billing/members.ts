'use server'

import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { addBusinessMember, removeBusinessMember } from '@/lib/billing/members'
import { BillingEntitlementError } from '@/lib/billing/plans'
import type { ActionResponse } from '@/types/action-response'

const addSchema = z.object({ accountId: z.string().min(1), email: z.string().email(), role: z.enum(['ADMIN', 'EDITOR']) })

export async function addBusinessMemberAction(input: unknown): Promise<ActionResponse<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Inicia sesión para gestionar el equipo.' }
  const parsed = addSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }
  try {
    const member = await addBusinessMember({ actorId: session.user.id, ...parsed.data, isGlobalAdmin: session.user.role === 'ADMIN' })
    return { success: true, data: { id: member.id } }
  } catch (error) {
    return { success: false, error: error instanceof BillingEntitlementError ? error.message : error instanceof Error ? error.message : 'No se pudo actualizar el equipo.' }
  }
}

export async function removeBusinessMemberAction(accountId: string, userId: string): Promise<ActionResponse<{ removed: true }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Inicia sesión para gestionar el equipo.' }
  try {
    return { success: true, data: await removeBusinessMember({ actorId: session.user.id, accountId, userId, isGlobalAdmin: session.user.role === 'ADMIN' }) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'No se pudo retirar el miembro.' }
  }
}
