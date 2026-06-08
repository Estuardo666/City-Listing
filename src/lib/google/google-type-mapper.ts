import 'server-only'
import { prisma } from '@/lib/prisma'

export type CategoryMappingResult = {
  categorySlugs: string[]
  subcategorySlugs: string[]
  confidence: number
  source: 'database' | 'fallback' | 'ai'
}

export async function getCategoriesFromGoogleType(
  googleType: string
): Promise<CategoryMappingResult> {
  const mapping = await prisma.googlePlaceTypeMapping.findUnique({
    where: { googleType },
  })

  if (mapping && mapping.approved) {
    return {
      categorySlugs: mapping.categorySlugs,
      subcategorySlugs: mapping.subcategorySlugs,
      confidence: mapping.confidence,
      source: 'database',
    }
  }

  const fallback = getFallbackCategories(googleType)
  if (fallback.categorySlugs.length > 0) {
    return { ...fallback, source: 'fallback' }
  }

  return {
    categorySlugs: [],
    subcategorySlugs: [],
    confidence: 0,
    source: 'fallback',
  }
}

export async function getCategoriesFromGoogleTypes(
  googleTypes: string[]
): Promise<CategoryMappingResult> {
  if (googleTypes.length === 0) {
    return { categorySlugs: [], subcategorySlugs: [], confidence: 0, source: 'fallback' }
  }

  const primaryResult = await getCategoriesFromGoogleType(googleTypes[0])
  if (primaryResult.confidence >= 80) {
    return primaryResult
  }

  const allCategorySlugs = new Set<string>()
  const allSubcategorySlugs = new Set<string>()
  let maxConfidence = 0

  for (const googleType of googleTypes) {
    const result = await getCategoriesFromGoogleType(googleType)
    result.categorySlugs.forEach((s) => allCategorySlugs.add(s))
    result.subcategorySlugs.forEach((s) => allSubcategorySlugs.add(s))
    maxConfidence = Math.max(maxConfidence, result.confidence)
  }

  return {
    categorySlugs: Array.from(allCategorySlugs),
    subcategorySlugs: Array.from(allSubcategorySlugs),
    confidence: maxConfidence,
    source: primaryResult.source,
  }
}

export function getFallbackCategories(googleType: string): {
  categorySlugs: string[]
  subcategorySlugs: string[]
  confidence: number
} {
  const normalized = googleType.toLowerCase().replace(/_/g, '-')

  const KEYWORD_MAP: Record<string, { categories: string[]; subcategories: string[] }> = {
    restaurant: { categories: ['gastronomia'], subcategories: ['restaurantes'] },
    cafe: { categories: ['gastronomia'], subcategories: ['cafeterias'] },
    bar: { categories: ['gastronomia'], subcategories: ['bares'] },
    food: { categories: ['gastronomia'], subcategories: ['restaurantes'] },
    hotel: { categories: ['alojamiento'], subcategories: ['hoteles'] },
    lodging: { categories: ['alojamiento'], subcategories: ['hoteles'] },
    shop: { categories: ['compras'], subcategories: ['tiendas'] },
    store: { categories: ['compras'], subcategories: ['tiendas'] },
    market: { categories: ['compras'], subcategories: ['mercados'] },
    hospital: { categories: ['salud-bienestar'], subcategories: ['hospitales'] },
    clinic: { categories: ['salud-bienestar'], subcategories: ['clinicas'] },
    doctor: { categories: ['salud-bienestar'], subcategories: ['medicos'] },
    pharmacy: { categories: ['salud-bienestar'], subcategories: ['farmacias'] },
    gym: { categories: ['deportes', 'salud-bienestar'], subcategories: ['gimnasios'] },
    school: { categories: ['educacion'], subcategories: ['escuelas'] },
    university: { categories: ['educacion'], subcategories: ['universidades'] },
    museum: { categories: ['cultura'], subcategories: ['museos'] },
    theater: { categories: ['cultura'], subcategories: ['teatros'] },
    cinema: { categories: ['entretenimiento'], subcategories: ['cines'] },
    park: { categories: ['turismo'], subcategories: ['parques'] },
    bank: { categories: ['finanzas'], subcategories: ['bancos'] },
    gas: { categories: ['automotriz-transporte'], subcategories: ['gasolineras'] },
    car: { categories: ['automotriz-transporte'], subcategories: ['concesionarios'] },
    pet: { categories: ['mascotas'], subcategories: ['pet-shops'] },
    beauty: { categories: ['belleza'], subcategories: ['peluquerias'] },
    salon: { categories: ['belleza'], subcategories: ['peluquerias'] },
    real: { categories: ['inmobiliaria'], subcategories: ['bienes-raices'] },
  }

  for (const [keyword, mapping] of Object.entries(KEYWORD_MAP)) {
    if (normalized.includes(keyword)) {
      return {
        categorySlugs: mapping.categories,
        subcategorySlugs: mapping.subcategories || [],
        confidence: 60,
      }
    }
  }

  return { categorySlugs: [], subcategorySlugs: [], confidence: 0 }
}

export async function saveSuggestedMapping(
  googleType: string,
  categorySlugs: string[],
  subcategorySlugs: string[],
  confidence: number
) {
  return prisma.googlePlaceTypeMapping.upsert({
    where: { googleType },
    update: {
      categorySlugs,
      subcategorySlugs,
      confidence,
      approved: confidence >= 100,
    },
    create: {
      googleType,
      categorySlugs,
      subcategorySlugs,
      confidence,
      approved: confidence >= 100,
    },
  })
}

export async function approveMapping(googleType: string) {
  return prisma.googlePlaceTypeMapping.update({
    where: { googleType },
    data: { approved: true, confidence: 100 },
  })
}

export async function getPendingMappings() {
  return prisma.googlePlaceTypeMapping.findMany({
    where: { approved: false },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getAllMappings() {
  return prisma.googlePlaceTypeMapping.findMany({
    orderBy: { googleType: 'asc' },
  })
}
