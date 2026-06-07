import type { Venue } from '@prisma/client'

export interface OsmPlace {
  id: string
  type: 'node' | 'way' | 'relation'
  osmId: number
  name: string
  category: string
  address?: string
  phone?: string
  website?: string
  email?: string
  openingHours?: string
  lat: number
  lon: number
  tags: Record<string, string>
}

export interface OsmImportStats {
  totalImports: number
  totalVenues: number
  lastImport: Date | null
  pendingReview: number
  activeVenues: number
  disabledVenues: number
  importsToday: number
  importsThisWeek: number
  newPlacesDetected: number
  duplicatesFound: number
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingVenue?: { id: string; name: string; slug: string }
  similarity: number
  matchType: 'osm_id' | 'name_location' | 'website' | 'phone' | 'none'
}

export interface ImportResult {
  placeId: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  venueId?: string
  error?: string
}

export interface BulkImportResult {
  total: number
  imported: number
  updated: number
  duplicates: number
  errors: number
  results: ImportResult[]
}

export interface OverpassResponse {
  version: number
  generator: string
  osm3s?: {
    timestamp_osm_base: string
    copyright: string
  }
  elements: OverpassElement[]
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export const OSM_CATEGORIES: Record<string, { label: string; overpassTag: string; icon: string }> = {
  restaurant: { label: 'Restaurantes', overpassTag: 'amenity=restaurant', icon: 'UtensilsCrossed' },
  cafe: { label: 'Cafés', overpassTag: 'amenity=cafe', icon: 'Coffee' },
  hotel: { label: 'Hoteles', overpassTag: 'tourism=hotel', icon: 'Hotel' },
  bar: { label: 'Bares', overpassTag: 'amenity=bar', icon: 'Beer' },
  pharmacy: { label: 'Farmacias', overpassTag: 'amenity=pharmacy', icon: 'Pill' },
  hospital: { label: 'Hospitales', overpassTag: 'amenity=hospital', icon: 'Hospital' },
  gym: { label: 'Gimnasios', overpassTag: 'leisure=fitness_center', icon: 'Dumbbell' },
  bank: { label: 'Bancos', overpassTag: 'amenity=bank', icon: 'Landmark' },
  supermarket: { label: 'Supermercados', overpassTag: 'shop=supermarket', icon: 'ShoppingCart' },
  school: { label: 'Escuelas', overpassTag: 'amenity=school', icon: 'GraduationCap' },
  mall: { label: 'Centros comerciales', overpassTag: 'shop=mall', icon: 'Store' },
  gas_station: { label: 'Gasolineras', overpassTag: 'amenity=fuel', icon: 'Fuel' },
}

export const OSM_CATEGORY_KEYS = Object.keys(OSM_CATEGORIES)

export function getOsmCategoryLabel(key: string): string {
  return OSM_CATEGORIES[key]?.label ?? key
}

export function getOsmCategoryOverpassTag(key: string): string {
  return OSM_CATEGORIES[key]?.overpassTag ?? ''
}
