/** Loja uses UTC-5 year-round. All day boundaries are independent of server TZ. */
export function lojaDay(now = new Date()) {
  const local = new Date(now.getTime() - 5 * 3600_000)
  const date = local.toISOString().slice(0, 10)
  return { date, start: new Date(`${date}T05:00:00Z`),
    end: new Date(new Date(`${date}T05:00:00Z`).getTime() + 86400_000),
    weekday: local.getUTCDay(), minute: local.getUTCHours() * 60 + local.getUTCMinutes() }
}

export function isOpenInLoja(hours: Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>, now = new Date()) {
  const { weekday, minute } = lojaDay(now)
  const parse = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
    ? Number(value.slice(0, 2)) * 60 + Number(value.slice(3)) : null
  return hours.some(h => {
    if (h.isClosed) return false
    const open = parse(h.openTime), close = parse(h.closeTime)
    if (open === null || close === null || open === close) return false
    if (open < close) return h.dayOfWeek === weekday && minute >= open && minute < close
    return (h.dayOfWeek === weekday && minute >= open) || (h.dayOfWeek === (weekday + 6) % 7 && minute < close)
  })
}
