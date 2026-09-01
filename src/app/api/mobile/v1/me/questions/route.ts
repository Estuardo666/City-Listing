import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'

const questionSchema = z.object({
  venueId: z.string().trim().min(1).optional(),
  eventId: z.string().trim().min(1).optional(),
  content: z.string().trim().min(5).max(1_000),
}).superRefine((value, context) => {
  if ((value.venueId ? 1 : 0) + (value.eventId ? 1 : 0) !== 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['venueId'], message: 'Selecciona un local o evento.' })
  }
})

const questionSelect = {
  id: true, content: true, answer: true, answerBy: true, answeredAt: true, status: true, createdAt: true,
  user: { select: { id: true, name: true, image: true } },
} as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus preguntas.', 401)
  const url = new URL(request.url)
  const venueId = url.searchParams.get('venueId') ?? undefined
  const eventId = url.searchParams.get('eventId') ?? undefined
  if ((venueId ? 1 : 0) + (eventId ? 1 : 0) !== 1) return mobileError('VALIDATION_ERROR', 'Indica venueId o eventId.', 422)
  const questions = await prisma.question.findMany({
    where: { ...(venueId ? { venueId } : { eventId }), status: { in: ['APPROVED', 'PENDING'] } },
    orderBy: { createdAt: 'desc' }, take: 100, select: questionSelect,
  })
  return mobileSuccess(questions)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para preguntar.', 401)
  const parsed = questionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'La pregunta no es válida.', 422, parsed.error.flatten().fieldErrors)
  const target = parsed.data.venueId
    ? await prisma.venue.findFirst({ where: { id: parsed.data.venueId, status: 'APPROVED', isActive: true }, select: { id: true } })
    : await prisma.event.findFirst({ where: { id: parsed.data.eventId, status: 'APPROVED' }, select: { id: true } })
  if (!target) return mobileError('NOT_FOUND', 'El contenido no está disponible.', 404)
  const question = await prisma.question.create({
    data: { userId: principal.userId, venueId: parsed.data.venueId, eventId: parsed.data.eventId, content: parsed.data.content, status: 'PENDING' },
    select: questionSelect,
  })
  return mobileSuccess(question, { moderation: 'PENDING' })
}
