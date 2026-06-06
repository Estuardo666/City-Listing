import { z } from 'zod'

export const recurrenceSchema = z.object({
  frequency: z.enum(['WEEKLY', 'MONTHLY']),
  interval: z.coerce.number().int().min(1, 'Mínimo 1').max(12, 'Máximo 12').default(1),
  daysOfWeek: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return value
  }, z.string().nullable()),
  dayOfMonth: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return Number(value)
  }, z.coerce.number().int().min(1).max(31).nullable()),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  count: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return Number(value)
  }, z.coerce.number().int().min(1).max(100).nullable()),
})

export type RecurrenceInput = z.infer<typeof recurrenceSchema>
