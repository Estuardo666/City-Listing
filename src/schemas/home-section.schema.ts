import { z } from 'zod'

/**
 * The home screen is server-driven: every carousel is a `HomeSection` row whose
 * `type` selects a resolver and whose `params` carry that resolver's options.
 * The same type can be instantiated any number of times, which is how three
 * `venueList` rows become "Comer", "Bares" and "Café".
 *
 * This file is the single contract shared by the admin form, the server
 * actions, the mobile admin API and the resolver — add a section type here and
 * every consumer validates it the same way.
 */

export const homeSectionLayoutSchema = z.enum([
  'hero',
  'chips',
  'carousel',
  'ranked',
  'grid',
  'list',
])

export const homeSectionTypeSchema = z.enum([
  'hero',
  'todayInLoja',
  'categoryChips',
  'venueList',
  'eventList',
  'ranked',
  'collection',
  'promotions',
  'posts',
  'routes',
  'manual',
])

export const homeSectionPlatformSchema = z.enum(['all', 'ios', 'web'])

export type HomeSectionType = z.infer<typeof homeSectionTypeSchema>
export type HomeSectionLayout = z.infer<typeof homeSectionLayoutSchema>
export type HomeSectionPlatform = z.infer<typeof homeSectionPlatformSchema>

const slug = z.string().trim().min(1).max(120)
const limit = z.coerce.number().int().min(1).max(30).default(12)
const itemKindSchema = z.enum(['venue', 'event', 'post', 'route'])

const venueSortSchema = z.enum(['recent', 'popular', 'rating', 'featured'])
const eventSortSchema = z.enum(['soon', 'recent', 'popular', 'featured'])
const dateRangeSchema = z.enum(['today', 'week', 'month', 'all'])
const popularWindowSchema = z.enum(['24h', '7d'])

/** Per-type parameter shapes. Keys mirror the resolver switch. */
export const homeSectionParamsByType = {
  hero: z.object({
    body: z.string().trim().max(240).optional(),
    ctaLabel: z.string().trim().max(60).optional(),
    ctaDeeplink: z.string().trim().max(300).optional(),
    imageUrl: z.string().trim().url().optional(),
  }),
  todayInLoja: z.object({}),
  categoryChips: z.object({
    categorySlugs: z.array(slug).max(30).optional(),
    limit: z.coerce.number().int().min(1).max(30).default(12),
  }),
  venueList: z.object({
    categorySlug: slug.optional(),
    featured: z.boolean().optional(),
    verified: z.boolean().optional(),
    hasPromotion: z.boolean().optional(),
    sort: venueSortSchema.default('recent'),
    limit,
  }),
  eventList: z.object({
    categorySlug: slug.optional(),
    featured: z.boolean().optional(),
    dateRange: dateRangeSchema.default('all'),
    sort: eventSortSchema.default('soon'),
    limit,
  }),
  ranked: z.object({
    kind: z.enum(['venue', 'event']).default('venue'),
    window: popularWindowSchema.default('24h'),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  }),
  collection: z.object({
    slug,
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
  promotions: z.object({ limit }),
  posts: z.object({
    tagSlug: slug.optional(),
    featured: z.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(6),
  }),
  routes: z.object({
    featured: z.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(8),
  }),
  manual: z.object({
    items: z
      .array(z.object({ kind: itemKindSchema, id: z.string().trim().min(1) }))
      .min(1)
      .max(30),
  }),
} as const

export type HomeSectionParams = {
  [K in HomeSectionType]: z.infer<(typeof homeSectionParamsByType)[K]>
}

/** Layout the editor pre-selects when a type is chosen. */
export const defaultLayoutForType: Record<HomeSectionType, HomeSectionLayout> = {
  hero: 'hero',
  todayInLoja: 'list',
  categoryChips: 'chips',
  venueList: 'carousel',
  eventList: 'carousel',
  ranked: 'ranked',
  collection: 'carousel',
  promotions: 'carousel',
  posts: 'list',
  routes: 'carousel',
  manual: 'carousel',
}

const baseFields = {
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  subtitle: z.string().trim().max(200).optional().nullable(),
  actionLabel: z.string().trim().max(40).optional().nullable(),
  layout: homeSectionLayoutSchema.optional(),
  order: z.coerce.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
  platform: homeSectionPlatformSchema.optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
}

/**
 * Discriminated union so `params` is validated against the chosen `type`
 * instead of being accepted as free-form JSON.
 */
const sectionVariant = <T extends HomeSectionType>(type: T) =>
  z.object({
    ...baseFields,
    type: z.literal(type),
    params: homeSectionParamsByType[type],
  })

/**
 * Discriminated union so `params` is validated against the chosen `type`
 * instead of being accepted as free-form JSON.
 */
export const homeSectionInputSchema = z
  .discriminatedUnion('type', [
    sectionVariant('hero'),
    sectionVariant('todayInLoja'),
    sectionVariant('categoryChips'),
    sectionVariant('venueList'),
    sectionVariant('eventList'),
    sectionVariant('ranked'),
    sectionVariant('collection'),
    sectionVariant('promotions'),
    sectionVariant('posts'),
    sectionVariant('routes'),
    sectionVariant('manual'),
  ])
  .superRefine((value, ctx) => {
    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endsAt'],
        message: 'La fecha de fin debe ser posterior al inicio.',
      })
    }
  })

export type HomeSectionInput = z.infer<typeof homeSectionInputSchema>

/** PATCH accepts the same shape: `type` is always resent so `params` stays typed. */
export const homeSectionUpdateSchema = homeSectionInputSchema

export const homeSectionReorderSchema = z.object({
  ids: z.array(z.string().trim().min(1)).min(1).max(100),
})

/** Parses a stored row's `params` column, falling back to that type's defaults. */
export function parseSectionParams<T extends HomeSectionType>(
  type: T,
  raw: unknown,
): HomeSectionParams[T] | null {
  const schema = homeSectionParamsByType[type]
  if (!schema) return null
  const parsed = schema.safeParse(raw ?? {})
  if (parsed.success) return parsed.data as HomeSectionParams[T]
  const fallback = schema.safeParse({})
  return fallback.success ? (fallback.data as HomeSectionParams[T]) : null
}
