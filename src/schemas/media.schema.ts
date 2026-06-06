import { z } from 'zod'

export const mediaUploadSchema = z.object({
  url: z.string().url('URL inválida'),
  alt: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(200, 'Máximo 200 caracteres').nullable()),
  type: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
})

export const mediaReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    })
  ),
})

export const mediaEntityTypeSchema = z.enum(['venue', 'event', 'post'])

export type MediaUploadInput = z.infer<typeof mediaUploadSchema>
export type MediaReorderInput = z.infer<typeof mediaReorderSchema>
