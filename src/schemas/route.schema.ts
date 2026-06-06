import { z } from 'zod'

export const routeSchema = z.object({
  title: z.string().trim().min(3, 'Mínimo 3 caracteres').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
  content: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(5000).nullable()),
  image: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().url('URL inválida').nullable()),
  duration: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(50).nullable()),
  difficulty: z.enum(['Fácil', 'Moderado', 'Difícil']).nullable().optional(),
  type: z.enum(['gastronomic', 'cultural', 'adventure', 'nightlife', 'nature']),
  featured: z.coerce.boolean().optional().default(false),
})

export const routeStopSchema = z.object({
  venueId: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return value
  }, z.string().nullable()),
  title: z.string().min(1, 'Título requerido').max(100),
  notes: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return value
  }, z.string().max(300).nullable()),
  duration: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    return value
  }, z.string().max(50).nullable()),
  order: z.coerce.number().int().min(0),
})

export const routeStatusUpdateSchema = z.object({
  routeId: z.string().min(1, 'ID inválido'),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
})

export type RouteInput = z.infer<typeof routeSchema>
export type RouteStopInput = z.infer<typeof routeStopSchema>
export type RouteStatusUpdateInput = z.infer<typeof routeStatusUpdateSchema>
