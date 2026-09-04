type Schedule = { title: string; startDate: Date; endDate: Date | null; status: string }
const date = (value: Date) => new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' }).format(value)
export function eventUpdateMessage(before: Schedule, after: Schedule) {
  if (before.status !== 'CANCELLED' && after.status === 'CANCELLED') {
    return { title: 'Evento cancelado', body: `${after.title} ha sido cancelado. Consulta al organizador si ya compraste entradas.` }
  }
  if (before.startDate.getTime() !== after.startDate.getTime() || before.endDate?.getTime() !== after.endDate?.getTime()) {
    return { title: 'Cambio de fecha u horario', body: `${after.title}: antes ${date(before.startDate)}; ahora ${date(after.startDate)}${after.endDate ? `, hasta ${date(after.endDate)}` : ''}.` }
  }
  return null
}
