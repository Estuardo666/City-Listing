'use server'

import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { ActionResponse } from '@/types/action-response'
import type { Question } from '@prisma/client'

const questionSchema = z.object({
  content: z.string().trim().min(5, 'Mínimo 5 caracteres').max(500, 'Máximo 500 caracteres'),
})

const answerSchema = z.object({
  answer: z.string().trim().min(5, 'Mínimo 5 caracteres').max(1000, 'Máximo 1000 caracteres'),
})

export async function createQuestionAction(
  entityType: 'venue' | 'event',
  entityId: string,
  input: unknown
): Promise<ActionResponse<Question>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = questionSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const created = await prisma.question.create({
      data: {
        content: parsed.data.content,
        userId: session.user.id,
        [`${entityType}Id`]: entityId,
      },
    })

    if (entityType === 'venue') {
      const v = await prisma.venue.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (v) revalidatePath(`/locales/${v.slug}`)
    } else {
      const e = await prisma.event.findUnique({ where: { id: entityId }, select: { slug: true } })
      if (e) revalidatePath(`/eventos/${e.slug}`)
    }

    return { success: true, data: created }
  } catch {
    return { success: false, error: 'No se pudo enviar la pregunta.' }
  }
}

export async function answerQuestionAction(
  questionId: string,
  input: unknown
): Promise<ActionResponse<Question>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const parsed = answerSchema.safeParse(input)
    if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        venue: { select: { userId: true, slug: true } },
        event: { select: { userId: true, slug: true } },
      },
    })
    if (!question) return { success: false, error: 'Pregunta no encontrada.' }

    const ownerId = question.venue?.userId ?? question.event?.userId
    if (session.user.role !== 'ADMIN' && ownerId !== session.user.id) {
      return { success: false, error: 'No tienes permiso para responder.' }
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        answer: parsed.data.answer,
        answerBy: session.user.name ?? session.user.email ?? 'Propietario',
        answeredAt: new Date(),
        status: 'ANSWERED',
      },
    })

    if (question.venueId) {
      const v = await prisma.venue.findUnique({ where: { id: question.venueId }, select: { slug: true } })
      if (v) revalidatePath(`/locales/${v.slug}`)
    }
    if (question.eventId) {
      const e = await prisma.event.findUnique({ where: { id: question.eventId }, select: { slug: true } })
      if (e) revalidatePath(`/eventos/${e.slug}`)
    }

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'No se pudo enviar la respuesta.' }
  }
}

export async function deleteQuestionAction(questionId: string): Promise<ActionResponse<void>> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return { success: false, error: 'No autorizado.' }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { userId: true, venueId: true, eventId: true },
    })
    if (!question) return { success: false, error: 'Pregunta no encontrada.' }
    if (session.user.role !== 'ADMIN' && question.userId !== session.user.id) return { success: false, error: 'No tienes permiso.' }

    await prisma.question.delete({ where: { id: questionId } })
    return { success: true }
  } catch {
    return { success: false, error: 'No se pudo eliminar.' }
  }
}
