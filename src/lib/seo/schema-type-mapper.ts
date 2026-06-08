const CATEGORY_SCHEMA_MAP: Record<string, string> = {
  restaurantes: 'Restaurant',
  restaurante: 'Restaurant',
  pizzerias: 'Restaurant',
  pizzeria: 'Restaurant',
  heladerias: 'Restaurant',
  heladeria: 'Restaurant',
  hoteles: 'Hotel',
  hotel: 'Hotel',
  hosteria: 'Hotel',
  hosterias: 'Hotel',
  hostal: 'Hotel',
  hostales: 'Hotel',
  farmacias: 'Pharmacy',
  farmacia: 'Pharmacy',
  hospitales: 'Hospital',
  hospital: 'Hospital',
  clinicas: 'Hospital',
  clinica: 'Hospital',
  gimnasios: 'ExerciseGym',
  gimnasio: 'ExerciseGym',
  bancos: 'BankOrCreditUnion',
  banco: 'BankOrCreditUnion',
  tiendas: 'Store',
  tienda: 'Store',
  compras: 'Store',
  supermercados: 'Store',
  supermercado: 'Store',
  librerias: 'Store',
  libreria: 'Store',
  cafeteria: 'CafeOrCoffeeShop',
  cafeterias: 'CafeOrCoffeeShop',
  cafe: 'CafeOrCoffeeShop',
  bares: 'BarOrPub',
  bar: 'BarOrPub',
  discotecas: 'BarOrPub',
  discoteca: 'BarOrPub',
  salones: 'HealthAndBeautyBusiness',
  salon: 'HealthAndBeautyBusiness',
  belleza: 'HealthAndBeautyBusiness',
  dentistas: 'Dentist',
  dentista: 'Dentist',
  veterinarias: 'VeterinaryCare',
  veterinaria: 'VeterinaryCare',
  gasolineras: 'GasStation',
  gasolinera: 'GasStation',
  estacionamientos: 'ParkingFacility',
  estacionamiento: 'ParkingFacility',
  lavanderias: 'DryCleaningOrLaundry',
  lavanderia: 'DryCleaningOrLaundry',
  floristerias: 'Store',
  floristeria: 'Store',
  cines: 'MovieTheater',
  cine: 'MovieTheater',
  museos: 'Museum',
  museo: 'Museum',
  iglesias: 'Church',
  iglesia: 'Church',
  parques: 'Park',
  parque: 'Park',
  galerias: 'ArtGallery',
  galeria: 'ArtGallery',
}

const GOOGLE_TYPE_SCHEMA_MAP: Record<string, string> = {
  restaurant: 'Restaurant',
  food: 'Restaurant',
  meal_takeaway: 'Restaurant',
  meal_delivery: 'Restaurant',
  bakery: 'Bakery',
  bar: 'BarOrPub',
  night_club: 'BarOrPub',
  cafe: 'CafeOrCoffeeShop',
  lodging: 'Hotel',
  hospital: 'Hospital',
  pharmacy: 'Pharmacy',
  doctor: 'MedicalBusiness',
  dentist: 'Dentist',
  veterinary_care: 'VeterinaryCare',
  gym: 'ExerciseGym',
  bank: 'BankOrCreditUnion',
  atm: 'BankOrCreditUnion',
  store: 'Store',
  clothing_store: 'Store',
  electronics_store: 'Store',
  furniture_store: 'Store',
  grocery_or_supermarket: 'Store',
  supermarket: 'Store',
  convenience_store: 'Store',
  book_store: 'Store',
  jewelry_store: 'Store',
  shoe_store: 'Store',
  florist: 'Store',
  gas_station: 'GasStation',
  parking: 'ParkingFacility',
  laundry: 'DryCleaningOrLaundry',
  movie_theater: 'MovieTheater',
  museum: 'Museum',
  church: 'Church',
  park: 'Park',
  art_gallery: 'ArtGallery',
  school: 'School',
  university: 'CollegeOrUniversity',
  beauty_salon: 'HealthAndBeautyBusiness',
  hair_care: 'HealthAndBeautyBusiness',
  spa: 'HealthAndBeautyBusiness',
  car_repair: 'AutomotiveBusiness',
  car_dealer: 'AutomotiveBusiness',
  real_estate_agency: 'RealEstateAgent',
  lawyer: 'Attorney',
  accountant: 'AccountingService',
  insurance_agency: 'InsuranceAgency',
  travel_agency: 'TravelAgency',
  airport: 'Airport',
  bus_station: 'BusStation',
  train_station: 'TrainStation',
  taxi_stand: 'TaxiStand',
}

type VenueWithTypeData = {
  venueCategories: Array<{ category: { slug: string } }>
  googlePlaceId?: string | null
}

export function getSchemaOrgType(venue: VenueWithTypeData): string {
  for (const vc of venue.venueCategories) {
    const slug = vc.category.slug.toLowerCase()
    if (CATEGORY_SCHEMA_MAP[slug]) {
      return CATEGORY_SCHEMA_MAP[slug]
    }
  }
  return 'LocalBusiness'
}

export function getSchemaOrgTypeFromGoogleType(googleType: string): string | null {
  const normalized = googleType.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return GOOGLE_TYPE_SCHEMA_MAP[normalized] ?? null
}

export function getAllSchemaOrgTypes(): Record<string, string> {
  return { ...CATEGORY_SCHEMA_MAP }
}
