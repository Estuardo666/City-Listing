import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess, withMobileErrors } from '@/lib/mobile-response'
import { listOrganizerPayphoneAccounts, saveOrganizerPayphoneAccount } from '@/lib/ticketing'
import { z } from 'zod'

const schema = z.object({ storeId: z.string().trim().min(1).max(120), token: z.string().trim().min(12).max(2000), displayName: z.string().trim().max(120).optional().nullable(), merchantReference: z.string().trim().max(160).optional().nullable() })

export const GET = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para consultar tus cuentas de pago.', 401)
  return mobileSuccess(await listOrganizerPayphoneAccounts(principal.userId))
})

export const POST = withMobileErrors(async (request: Request) => {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para conectar PayPhone.', 401)
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('INVALID_INPUT', parsed.error.issues[0]?.message ?? 'Datos inválidos.', 400)
  return mobileSuccess(await saveOrganizerPayphoneAccount({ actorId: principal.userId, ...parsed.data }))
})
