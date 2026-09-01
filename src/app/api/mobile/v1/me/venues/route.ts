import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { getMobilePrincipal } from '@/lib/mobile-auth'
import { mobileError, mobileSuccess } from '@/lib/mobile-response'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/utils'

const venueSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5_000),
  location: z.string().trim().min(2).max(180),
  address: z.string().trim().max(250).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().email().max(160).optional(),
  website: z.string().url().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  priceRange: z.string().trim().max(20).optional(),
  image: z.string().url().max(2_000).optional(),
  categoryIds: z.array(z.string().trim().min(1)).max(10).optional(),
}).superRefine((value, context) => {
  if ((value.lat == null) !== (value.lng == null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['lat'], message: 'Latitud y longitud deben ir juntas.' })
})

const venueSelect = {
  id: true, name: true, slug: true, description: true, image: true, location: true, address: true,
  phone: true, email: true, website: true, lat: true, lng: true, priceRange: true, status: true, createdAt: true,
} as const

export async function GET(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para ver tus locales.', 401)
  const venues = await prisma.venue.findMany({ where: { userId: principal.userId }, orderBy: { createdAt: 'desc' }, take: 100, select: venueSelect })
  return mobileSuccess(venues)
}

export async function POST(request: Request) {
  const principal = await getMobilePrincipal(request)
  if (!principal) return mobileError('UNAUTHORIZED', 'Inicia sesión para publicar un local.', 401)
  const parsed = venueSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return mobileError('VALIDATION_ERROR', 'El local no es válido.', 422, parsed.error.flatten().fieldErrors)
  const categoryIds = parsed.data.categoryIds ?? []
  if (categoryIds.length) {
    const count = await prisma.category.count({ where: { id: { in: categoryIds } } })
    if (count !== categoryIds.length) return mobileError('NOT_FOUND', 'Una categoría no está disponible.', 404)
  }
  const baseSlug = slugify(parsed.data.name) || 'local'
  const venue = await prisma.venue.create({
    data: {
      userId: principal.userId, name: parsed.data.name, slug: `${baseSlug}-${randomBytes(3).toString('hex')}`,
      description: parsed.data.description, location: parsed.data.location, address: parsed.data.address,
      phone: parsed.data.phone, email: parsed.data.email, website: parsed.data.website, lat: parsed.data.lat, lng: parsed.data.lng,
      priceRange: parsed.data.priceRange, image: parsed.data.image, status: 'PENDING',
      venueCategories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
    select: venueSelect,
  })
  return mobileSuccess(venue, { moderation: 'PENDING' })
}
