import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { assertMemberCapacity } from './plans'

const MANAGER_ROLES = new Set(['OWNER', 'ADMIN'])

async function canManageTeam(actorId: string, accountId: string, isGlobalAdmin = false) {
  if (isGlobalAdmin) return true
  const member = await prisma.businessMembership.findUnique({ where: { accountId_userId: { accountId, userId: actorId } }, select: { role: true } })
  return !!member && MANAGER_ROLES.has(member.role)
}

export async function addBusinessMember(input: { actorId: string; accountId: string; email: string; role: 'ADMIN' | 'EDITOR'; isGlobalAdmin?: boolean }) {
  if (!await canManageTeam(input.actorId, input.accountId, input.isGlobalAdmin)) throw new Error('No tienes permiso para gestionar el equipo.')
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() }, select: { id: true, name: true, email: true } })
  if (!user) throw new Error('No encontramos una cuenta con ese correo.')
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.businessMembership.findUnique({ where: { accountId_userId: { accountId: input.accountId, userId: user.id } }, select: { role: true } })
        if (existing?.role === 'OWNER') throw new Error('El rol del propietario no puede modificarse desde colaboradores.')
        if (!existing) await assertMemberCapacity(input.accountId, tx)
        const member = await tx.businessMembership.upsert({ where: { accountId_userId: { accountId: input.accountId, userId: user.id } }, update: { role: input.role }, create: { accountId: input.accountId, userId: user.id, role: input.role }, include: { user: { select: { id: true, name: true, email: true, role: true } } } })
        await tx.billingAuditLog.create({ data: { actorId: input.actorId, accountId: input.accountId, action: 'MEMBER_ADDED_OR_UPDATED', reason: `Rol ${input.role}`, metadata: { userId: user.id, role: input.role } } })
        return member
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034' && attempt < 2) continue
      throw error
    }
  }
  throw new Error('No se pudo actualizar el equipo.')
}

export async function removeBusinessMember(input: { actorId: string; accountId: string; userId: string; isGlobalAdmin?: boolean }) {
  if (!await canManageTeam(input.actorId, input.accountId, input.isGlobalAdmin)) throw new Error('No tienes permiso para gestionar el equipo.')
  const member = await prisma.businessMembership.findUnique({ where: { accountId_userId: { accountId: input.accountId, userId: input.userId } }, select: { id: true, role: true } })
  if (!member) throw new Error('El miembro no pertenece a esta cuenta.')
  if (member.role === 'OWNER') throw new Error('No puedes retirar al propietario de la cuenta.')
  await prisma.businessMembership.delete({ where: { id: member.id } })
  await prisma.billingAuditLog.create({ data: { actorId: input.actorId, accountId: input.accountId, action: 'MEMBER_REMOVED', metadata: { userId: input.userId } } })
  return { removed: true as const }
}
