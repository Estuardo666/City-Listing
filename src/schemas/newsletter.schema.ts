import { z } from 'zod'

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return null
    if (typeof value === 'string') return value.trim()
    return value
  }, z.string().max(100).nullable()),
})

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>
