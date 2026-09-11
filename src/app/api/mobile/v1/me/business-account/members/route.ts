import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { getBusinessAccountForUser } from '@/lib/billing/plans'
import { addBusinessMember, removeBusinessMember } from '@/lib/billing/members'

const addSchema = z.object({ email: z.string().email(), role: z.enum(['ADMIN', 'EDITOR']) })
const removeSchema = z.object({ userId: z.string().min(1) })

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para gestionar colaboradores.', 401)
  const parsed = addSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'Los datos del colaborador no son válidos.', 422, parsed.error.flatten().fieldErrors)
  const account = await getBusinessAccountForUser(principal.userId)
  if (!account) return mobileError('NOT_FOUND', 'No tienes una cuenta empresarial.', 404)
  const member = await addBusinessMember({ actorId: principal.userId, accountId: account.id, ...parsed.data, isGlobalAdmin: principal.role === 'ADMIN' })
  return mobileSuccess(member, { status: 201 })
})

export const DELETE = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para gestionar colaboradores.', 401)
  const parsed = removeSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El colaborador no es válido.', 422, parsed.error.flatten().fieldErrors)
  const account = await getBusinessAccountForUser(principal.userId)
  if (!account) return mobileError('NOT_FOUND', 'No tienes una cuenta empresarial.', 404)
  return mobileSuccess(await removeBusinessMember({ actorId: principal.userId, accountId: account.id, userId: parsed.data.userId, isGlobalAdmin: principal.role === 'ADMIN' }))
})
