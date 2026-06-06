import { z } from 'zod'

const timeRangeRegex = /^(\d{2}:\d{2}-\d{2}:\d{2})(,\d{2}:\d{2}-\d{2}:\d{2})*$/

const dayScheduleSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim()
  return value
}, z.string().regex(timeRangeRegex, 'Formato inválido. Usa HH:MM-HH:MM').nullable())

export const operatingHoursSchema = z.object({
  mon: dayScheduleSchema,
  tue: dayScheduleSchema,
  wed: dayScheduleSchema,
  thu: dayScheduleSchema,
  fri: dayScheduleSchema,
  sat: dayScheduleSchema,
  sun: dayScheduleSchema,
  notes: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(500, 'Máximo 500 caracteres').nullable()),
})

export type OperatingHoursInput = z.infer<typeof operatingHoursSchema>
