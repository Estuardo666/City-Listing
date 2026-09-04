import { lojaDay } from './loja-day'

export const agendaPeriods = ['today', 'tomorrow', 'weekend', 'upcoming'] as const
export type AgendaPeriod = typeof agendaPeriods[number]

export function agendaWindow(period: AgendaPeriod, now = new Date()) {
  const day = lojaDay(now)
  const offset = period === 'tomorrow' ? 1 : period === 'weekend'
    ? day.weekday === 0 ? 0 : day.weekday === 6 ? 0 : 6 - day.weekday : 0
  const start = new Date(day.start.getTime() + offset * 86400_000)
  const days = period === 'upcoming' ? 30 : period === 'weekend' && day.weekday !== 0 ? 2 : 1
  return { start: new Date(Math.max(start.getTime(), now.getTime())), end: new Date(start.getTime() + days * 86400_000) }
}
