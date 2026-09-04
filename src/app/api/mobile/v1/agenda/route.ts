import { prisma } from '@/lib/prisma'
import { agendaPeriods, agendaWindow, type AgendaPeriod } from '@/lib/agenda-window'
import { mobileSuccess, mobileError } from '@/lib/mobile-response'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const period = new URL(request.url).searchParams.get('period') ?? 'today'
  if (!agendaPeriods.includes(period as AgendaPeriod)) return mobileError('VALIDATION_ERROR', 'Periodo inválido.', 422)
  const { start, end } = agendaWindow(period as AgendaPeriod)
  try {
    const events = await prisma.event.findMany({
      where: { status: 'APPROVED', startDate: { lt: end }, OR: [
        { endDate: { gt: start } }, { endDate: null, startDate: { gte: start } },
      ] },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }], take: 100,
      select: { id: true, title: true, slug: true, image: true, startDate: true, endDate: true,
        location: true, price: true, venue: { select: { name: true } } },
    })
    return mobileSuccess(events.map(e => ({ ...e, location: e.venue?.name ?? e.location })))
  } catch { return mobileError('INTERNAL_ERROR', 'No se pudo cargar la agenda.', 500) }
}
