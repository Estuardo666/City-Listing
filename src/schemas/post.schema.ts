import { z } from 'zod'

export const postStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

const optionalNullableTextSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  if (typeof value === 'string') {
    return value.trim()
  }
  return value
}, z.string().nullable())

const optionalNullableUrlSchema = z.preprocess((value) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }
  return value
}, z.string().url('URL de imagen inválida').nullable())

export const postSchema = z.object({
  title: z.string().trim().min(5, 'Mínimo 5 caracteres').max(160, 'Máximo 160 caracteres'),
  excerpt: optionalNullableTextSchema,
  content: z.string().trim().min(20, 'El contenido debe tener al menos 20 caracteres'),
  image: optionalNullableUrlSchema,
  categoryId: z.string().trim().min(1, 'Selecciona una categoría'),
  featured: z.coerce.boolean().optional().default(false),
  tags: z.array(z.string().trim().min(1).max(32)).max(8, 'Máximo 8 etiquetas').optional().default([]),
})

export const postListFiltersSchema = z.object({
  q: z.string().trim().optional().default(''),
  category: z.string().trim().optional().default(''),
  tag: z.string().trim().optional().default(''),
  featured: z.enum(['all', 'true']).optional().default('all'),
  status: postStatusSchema.optional().default('APPROVED'),
})

export const postStatusUpdateSchema = z.object({
  postId: z.string().trim().min(1, 'ID inválido'),
  status: postStatusSchema,
})

export const adminPostStatusFilterSchema = z
  .enum(['ALL', 'PENDING', 'APPROVED', 'REJECTED'])
  .optional()
  .default('PENDING')

export type PostInput = z.infer<typeof postSchema>
export type PostListFiltersInput = z.infer<typeof postListFiltersSchema>
export type PostStatusUpdateInput = z.infer<typeof postStatusUpdateSchema>
export type AdminPostStatusFilterInput = z.infer<typeof adminPostStatusFilterSchema>
