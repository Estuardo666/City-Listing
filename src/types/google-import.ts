export interface GooglePlaceNormalized {
  google_place_id: string
  name: string
  category: string
  address: string
  phone: string | null
  lat: number
  lng: number
  rating?: number | null
  userRatingCount?: number
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
  business: { label: 'Negocios y servicios', googleType: 'business', icon: 'Store' },
  store: { label: 'Tiendas', googleType: 'store', icon: 'Store' },
  bakery: { label: 'Panaderías', googleType: 'bakery', icon: 'Store' },
  fast_food_restaurant: { label: 'Comida rápida', googleType: 'fast_food_restaurant', icon: 'Store' },
  pizza_restaurant: { label: 'Pizzerías', googleType: 'pizza_restaurant', icon: 'Store' },
  seafood_restaurant: { label: 'Marisquerías', googleType: 'seafood_restaurant', icon: 'Store' },
  ice_cream_shop: { label: 'Heladerías', googleType: 'ice_cream_shop', icon: 'Store' },
  meal_takeaway: { label: 'Comida para llevar', googleType: 'meal_takeaway', icon: 'Store' },
  hostel: { label: 'Hostales', googleType: 'hostel', icon: 'Store' },
  bed_and_breakfast: { label: 'Hosterías', googleType: 'bed_and_breakfast', icon: 'Store' },
  campground: { label: 'Campamentos', googleType: 'campground', icon: 'Store' },
  clothing_store: { label: 'Tiendas de ropa', googleType: 'clothing_store', icon: 'Store' },
  shoe_store: { label: 'Zapaterías', googleType: 'shoe_store', icon: 'Store' },
  jewelry_store: { label: 'Joyerías', googleType: 'jewelry_store', icon: 'Store' },
  electronics_store: { label: 'Electrónica y tecnología', googleType: 'electronics_store', icon: 'Store' },
  cell_phone_store: { label: 'Tiendas de celulares', googleType: 'cell_phone_store', icon: 'Store' },
  hardware_store: { label: 'Ferreterías', googleType: 'hardware_store', icon: 'Store' },
  home_goods_store: { label: 'Artículos para el hogar', googleType: 'home_goods_store', icon: 'Store' },
  furniture_store: { label: 'Mueblerías', googleType: 'furniture_store', icon: 'Store' },
  book_store: { label: 'Librerías', googleType: 'book_store', icon: 'Store' },
  stationery_store: { label: 'Papelerías', googleType: 'stationery_store', icon: 'Store' },
  florist: { label: 'Florerías', googleType: 'florist', icon: 'Store' },
  pet_store: { label: 'Tiendas de mascotas', googleType: 'pet_store', icon: 'Store' },
  toy_store: { label: 'Jugueterías', googleType: 'toy_store', icon: 'Store' },
  sporting_goods_store: { label: 'Artículos deportivos', googleType: 'sporting_goods_store', icon: 'Store' },
  auto_parts_store: { label: 'Repuestos de vehículos', googleType: 'auto_parts_store', icon: 'Store' },
  convenience_store: { label: 'Tiendas de barrio', googleType: 'convenience_store', icon: 'Store' },
  grocery_store: { label: 'Tiendas de alimentos', googleType: 'grocery_store', icon: 'Store' },
  market: { label: 'Mercados', googleType: 'market', icon: 'Store' },
  liquor_store: { label: 'Licorerías', googleType: 'liquor_store', icon: 'Store' },
  department_store: { label: 'Almacenes', googleType: 'department_store', icon: 'Store' },
  doctor: { label: 'Consultorios médicos', googleType: 'doctor', icon: 'Store' },
  dentist: { label: 'Dentistas', googleType: 'dentist', icon: 'Store' },
  physiotherapist: { label: 'Fisioterapia', googleType: 'physiotherapist', icon: 'Store' },
  medical_lab: { label: 'Laboratorios clínicos', googleType: 'medical_lab', icon: 'Store' },
  optician: { label: 'Ópticas', googleType: 'optician', icon: 'Store' },
  veterinary_care: { label: 'Veterinarias', googleType: 'veterinary_care', icon: 'Store' },
  beauty_salon: { label: 'Salones de belleza', googleType: 'beauty_salon', icon: 'Store' },
  hair_salon: { label: 'Peluquerías', googleType: 'hair_salon', icon: 'Store' },
  barber_shop: { label: 'Barberías', googleType: 'barber_shop', icon: 'Store' },
  nail_salon: { label: 'Salones de uñas', googleType: 'nail_salon', icon: 'Store' },
  spa: { label: 'Spa', googleType: 'spa', icon: 'Store' },
  car_repair: { label: 'Talleres mecánicos', googleType: 'car_repair', icon: 'Store' },
  car_wash: { label: 'Lavadoras de autos', googleType: 'car_wash', icon: 'Store' },
  car_dealer: { label: 'Concesionarios', googleType: 'car_dealer', icon: 'Store' },
  car_rental: { label: 'Alquiler de vehículos', googleType: 'car_rental', icon: 'Store' },
  parking: { label: 'Estacionamientos', googleType: 'parking', icon: 'Store' },
  laundry: { label: 'Lavanderías', googleType: 'laundry', icon: 'Store' },
  locksmith: { label: 'Cerrajerías', googleType: 'locksmith', icon: 'Store' },
  electrician: { label: 'Electricistas', googleType: 'electrician', icon: 'Store' },
  plumber: { label: 'Plomeros', googleType: 'plumber', icon: 'Store' },
  roofing_contractor: { label: 'Servicios de techos', googleType: 'roofing_contractor', icon: 'Store' },
  painter: { label: 'Pintores', googleType: 'painter', icon: 'Store' },
  moving_company: { label: 'Mudanzas', googleType: 'moving_company', icon: 'Store' },
  storage: { label: 'Bodegas', googleType: 'storage', icon: 'Store' },
  real_estate_agency: { label: 'Inmobiliarias', googleType: 'real_estate_agency', icon: 'Store' },
  insurance_agency: { label: 'Agencias de seguros', googleType: 'insurance_agency', icon: 'Store' },
  lawyer: { label: 'Abogados', googleType: 'lawyer', icon: 'Store' },
  accounting: { label: 'Contadores', googleType: 'accounting', icon: 'Store' },
  travel_agency: { label: 'Agencias de viaje', googleType: 'travel_agency', icon: 'Store' },
  funeral_home: { label: 'Funerarias', googleType: 'funeral_home', icon: 'Store' },
  post_office: { label: 'Oficinas de correos', googleType: 'post_office', icon: 'Store' },
  courier_service: { label: 'Mensajería y encomiendas', googleType: 'courier_service', icon: 'Store' },
  print_shop: { label: 'Imprentas', googleType: 'print_shop', icon: 'Store' },
  university: { label: 'Universidades', googleType: 'university', icon: 'Store' },
  preschool: { label: 'Preescolares', googleType: 'preschool', icon: 'Store' },
  language_school: { label: 'Escuelas de idiomas', googleType: 'language_school', icon: 'Store' },
  library: { label: 'Bibliotecas', googleType: 'library', icon: 'Store' },
  museum: { label: 'Museos', googleType: 'museum', icon: 'Store' },
  art_gallery: { label: 'Galerías de arte', googleType: 'art_gallery', icon: 'Store' },
  performing_arts_theater: { label: 'Teatros', googleType: 'performing_arts_theater', icon: 'Store' },
  movie_theater: { label: 'Cines', googleType: 'movie_theater', icon: 'Store' },
  night_club: { label: 'Discotecas', googleType: 'night_club', icon: 'Store' },
  amusement_center: { label: 'Centros recreativos', googleType: 'amusement_center', icon: 'Store' },
  bowling_alley: { label: 'Boleras', googleType: 'bowling_alley', icon: 'Store' },
  stadium: { label: 'Estadios', googleType: 'stadium', icon: 'Store' },
  sports_club: { label: 'Clubes deportivos', googleType: 'sports_club', icon: 'Store' },
  swimming_pool: { label: 'Piscinas', googleType: 'swimming_pool', icon: 'Store' },
  event_venue: { label: 'Salones de eventos', googleType: 'event_venue', icon: 'Store' },
  tourist_attraction: { label: 'Atracciones turísticas', googleType: 'tourist_attraction', icon: 'Store' },
  park: { label: 'Parques', googleType: 'park', icon: 'Store' },
  church: { label: 'Iglesias', googleType: 'church', icon: 'Store' },
  local_government_office: { label: 'Oficinas públicas', googleType: 'local_government_office', icon: 'Store' },
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
