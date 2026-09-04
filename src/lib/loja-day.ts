/** Loja uses UTC-5 year-round. All day boundaries are independent of server TZ. */
export const LOJA_UTC_OFFSET_MINUTES = -300

export function lojaDay(now = new Date()) {
  const local = new Date(now.getTime() - 5 * 3600_000)
  const date = local.toISOString().slice(0, 10)
  return { date, start: new Date(`${date}T05:00:00Z`),
    end: new Date(new Date(`${date}T05:00:00Z`).getTime() + 86400_000),
    weekday: local.getUTCDay(), minute: local.getUTCHours() * 60 + local.getUTCMinutes() }
}

/** Current Loja weekday, previous weekday and minute-of-day. */
export function lojaNowParts(now = new Date()) {
  const day = lojaDay(now)
  return {
    date: day.date,
    weekday: day.weekday,
    prevWeekday: (day.weekday + 6) % 7,
    minute: day.minute,
    /** UTC midnight of the previous Loja day, matching how SpecialHours.date is stored. */
    prevDate: new Date(new Date(`${day.date}T00:00:00Z`).getTime() - 86400_000).toISOString().slice(0, 10),
  }
}

/** "HH:MM" -> minutes since midnight, or null when malformed. */
export function parseHHMM(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3))
}

export function formatHHMM(minute: number): string {
  const m = ((minute % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export type HoursRow = { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }
export type SpecialHoursRow = { openTime: string | null; closeTime: string | null; isClosed: boolean }

/** [open, close) in minutes. close may exceed 1440 when the window crosses midnight. */
type Window = { open: number; close: number }

function rowsToWindows(rows: Array<{ openTime: string; closeTime: string; isClosed: boolean }>): Window[] {
  const windows: Window[] = []
  for (const row of rows) {
    if (row.isClosed) continue
    const open = parseHHMM(row.openTime)
    const close = parseHHMM(row.closeTime)
    if (open === null || close === null) continue
    // open === close means "open 24 hours"
    if (open === close) windows.push({ open: 0, close: 1440 })
    else if (open < close) windows.push({ open, close })
    else windows.push({ open, close: close + 1440 })
  }
  return windows
}

/**
 * Windows for one weekday. A SpecialHours record for that date fully replaces the
 * regular schedule: isClosed -> no windows, times -> that single window, and a
 * record without usable times means the venue is treated as closed that day.
 */
function windowsForDay(hours: HoursRow[], weekday: number, special?: SpecialHoursRow | null): Window[] {
  if (special) {
    if (special.isClosed) return []
    return rowsToWindows([{ openTime: special.openTime ?? '', closeTime: special.closeTime ?? '', isClosed: false }])
  }
  return rowsToWindows(hours.filter(h => h.dayOfWeek === weekday))
}

export type OpenState = {
  isOpen: boolean
  /** "HH:MM" when currently open and the window ends within the next 24 h. */
  closesAt?: string
  /** "HH:MM" of the next opening when currently closed. */
  opensAt?: string
}

export function openStatus(
  hours: HoursRow[],
  opts: { specialToday?: SpecialHoursRow | null; specialYesterday?: SpecialHoursRow | null; now?: Date } = {}
): OpenState {
  const { weekday, prevWeekday, minute } = lojaNowParts(opts.now)

  const today = windowsForDay(hours, weekday, opts.specialToday)
  const yesterday = windowsForDay(hours, prevWeekday, opts.specialYesterday)

  const current =
    today.find(w => minute >= w.open && minute < w.close) ??
    yesterday.filter(w => w.close > 1440).find(w => minute + 1440 >= w.open && minute + 1440 < w.close)

  if (current) return { isOpen: true, closesAt: formatHHMM(current.close) }

  const laterToday = today.filter(w => w.open > minute).sort((a, b) => a.open - b.open)[0]
  if (laterToday) return { isOpen: false, opensAt: formatHHMM(laterToday.open) }

  // Regular schedule only: special hours for future days are not loaded here.
  for (let ahead = 1; ahead <= 7; ahead++) {
    const next = rowsToWindows(hours.filter(h => h.dayOfWeek === (weekday + ahead) % 7))
      .sort((a, b) => a.open - b.open)[0]
    if (next) return { isOpen: false, opensAt: formatHHMM(next.open) }
  }
  return { isOpen: false }
}

/** Formato legacy OperatingHours: { mon: "08:00-13:00,15:00-19:00", ... } */
export type OperatingHoursMap = Partial<Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', string | null>>

const OPERATING_DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

/** Convierte el formato legacy a filas normales para reusar openStatus(). */
export function operatingHoursToRows(hours: OperatingHoursMap | null | undefined): HoursRow[] {
  if (!hours) return []
  const rows: HoursRow[] = []
  OPERATING_DAY_KEYS.forEach((key, dayOfWeek) => {
    const schedule = hours[key]
    if (!schedule) return
    for (const range of schedule.split(',')) {
      const [openTime, closeTime] = range.trim().split('-')
      if (!openTime || !closeTime) continue
      rows.push({ dayOfWeek, openTime: openTime.trim(), closeTime: closeTime.trim(), isClosed: false })
    }
  })
  return rows
}

export function isOpenInLoja(hours: HoursRow[], now = new Date()) {
  return openStatus(hours, { now }).isOpen
}
