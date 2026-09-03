import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})
