import 'server-only'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError } from '@/lib/mobile-response'

/**
 * Guard for the in-app admin panel. Returns an error response when the caller
 * may not administer, or `null` when the request may proceed.
 *
 * Anonymous callers get 401 and signed-in non-admins get 403, so the app can
 * tell "log in again" apart from "you are not an admin".
 */
export async function requireMobileAdmin(request: Request): Promise<Response | null> {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para continuar.', 401)
  if (principal.role !== 'ADMIN') {
    return mobileError('FORBIDDEN', 'Necesitas permisos de administrador.', 403)
  }
  return null
}
