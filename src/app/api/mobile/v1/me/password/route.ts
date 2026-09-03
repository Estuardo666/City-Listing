import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
})

export async function PATCH(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para cambiar tu contraseña.', 401)
  const parsed = passwordSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La contraseña no es válida.', 422, parsed.error.flatten().fieldErrors)

  const user = await prisma.user.findUnique({ where: { id: principal.userId }, select: { password: true } })
  if (!user) return mobileError('NOT_FOUND', 'Usuario no encontrado.', 404)
  if (!user.password) return mobileError('PASSWORD_NOT_CONFIGURED', 'Esta cuenta no tiene contraseña configurada.', 409)
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    return mobileError('INVALID_PASSWORD', 'La contraseña actual es incorrecta.', 401)
  }

  await prisma.user.update({ where: { id: principal.userId }, data: { password: await bcrypt.hash(parsed.data.newPassword, 12) } })
  return mobileSuccess({ updated: true })
}
