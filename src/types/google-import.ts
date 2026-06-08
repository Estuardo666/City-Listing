export interface GooglePlaceNormalized {
  google_place_id: string
  name: string
  category: string
  address: string
  phone: string | null
  lat: number
  lng: number
}

export interface GoogleSearchParams {
  country: string
  province: string
  city: string
  categories: string[]
  radius: number
  page?: number
  pageSize?: number
  pageToken?: string
}

export interface GoogleSearchResult {
  places: GooglePlaceNormalized[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  nextPageToken?: string
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingVenue?: {
    id: string
    name: string
    slug: string
    googlePlaceId?: string | null
  }
  similarity: number
  matchType: 'google_place_id' | 'phone' | 'name_location' | 'none'
}

export interface GoogleImportResult {
  placeId: string
  action: 'created' | 'updated' | 'skipped' | 'error'
  venueId?: string
  error?: string
}

export interface GoogleImportJobStatus {
  id: string
  status: string
  country: string
  province: string
  city: string
  categories: string
  radius: number
  totalRecords: number
  processedRecords: number
  importedRecords: number
  duplicateRecords: number
  errorRecords: number
  startedAt: Date | null
  finishedAt: Date | null
  progress: number
  elapsedTime: number
  estimatedTimeRemaining: number
  logs: GoogleImportLogEntry[]
}

export interface GoogleImportLogEntry {
  id: string
  level: string
  message: string
  metadata: string | null
  createdAt: Date
}

export const GOOGLE_CATEGORIES: Record<string, { label: string; googleType: string; icon: string }> = {
  restaurant: { label: 'Restaurantes', googleType: 'restaurant', icon: 'UtensilsCrossed' },
  cafe: { label: 'Cafeterías', googleType: 'cafe', icon: 'Coffee' },
  bar: { label: 'Bares', googleType: 'bar', icon: 'Beer' },
  hotel: { label: 'Hoteles', googleType: 'lodging', icon: 'Hotel' },
  pharmacy: { label: 'Farmacias', googleType: 'pharmacy', icon: 'Pill' },
  hospital: { label: 'Hospitales', googleType: 'hospital', icon: 'Hospital' },
  gym: { label: 'Gimnasios', googleType: 'gym', icon: 'Dumbbell' },
  bank: { label: 'Bancos', googleType: 'bank', icon: 'Landmark' },
  supermarket: { label: 'Supermercados', googleType: 'supermarket', icon: 'ShoppingCart' },
  school: { label: 'Escuelas', googleType: 'school', icon: 'GraduationCap' },
  mall: { label: 'Centros comerciales', googleType: 'shopping_mall', icon: 'Store' },
  gas_station: { label: 'Gasolineras', googleType: 'gas_station', icon: 'Fuel' },
}

export const GOOGLE_CATEGORY_KEYS = Object.keys(GOOGLE_CATEGORIES)

export type GoogleCategoryKey = keyof typeof GOOGLE_CATEGORIES

export function getGoogleCategoryLabel(key: string): string {
  return GOOGLE_CATEGORIES[key]?.label ?? key
}

export function getGoogleCategoryType(key: string): string {
  return GOOGLE_CATEGORIES[key]?.googleType ?? ''
}
