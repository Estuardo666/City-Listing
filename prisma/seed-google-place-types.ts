import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type GoogleTypeMapping = {
  googleType: string
  categorySlugs: string[]
  subcategorySlugs: string[]
  confidence?: number
}

const GOOGLE_TYPE_MAPPINGS: GoogleTypeMapping[] = [
  // Gastronomía
  { googleType: 'restaurant', categorySlugs: ['gastronomia'], subcategorySlugs: ['restaurantes'] },
  { googleType: 'cafe', categorySlugs: ['gastronomia'], subcategorySlugs: ['cafeterias'] },
  { googleType: 'bar', categorySlugs: ['gastronomia', 'entretenimiento'], subcategorySlugs: ['bares'] },
  { googleType: 'bakery', categorySlugs: ['gastronomia'], subcategorySlugs: ['panaderias'] },
  { googleType: 'meal_delivery', categorySlugs: ['gastronomia'], subcategorySlugs: ['delivery'] },
  { googleType: 'meal_takeaway', categorySlugs: ['gastronomia'], subcategorySlugs: ['take-away'] },
  { googleType: 'food', categorySlugs: ['gastronomia'], subcategorySlugs: ['restaurantes'], confidence: 80 },
  { googleType: 'pizza_restaurant', categorySlugs: ['gastronomia'], subcategorySlugs: ['pizzerias'] },
  { googleType: 'seafood_restaurant', categorySlugs: ['gastronomia'], subcategorySlugs: ['mariscos'] },
  { googleType: 'steak_house', categorySlugs: ['gastronomia'], subcategorySlugs: ['parrillas'] },
  { googleType: 'fast_food_restaurant', categorySlugs: ['gastronomia'], subcategorySlugs: ['comida-rapida'] },
  { googleType: 'ice_cream_shop', categorySlugs: ['gastronomia'], subcategorySlugs: ['heladerias'] },
  { googleType: 'coffee_shop', categorySlugs: ['gastronomia'], subcategorySlugs: ['cafeterias'] },
  { googleType: 'brewery', categorySlugs: ['gastronomia'], subcategorySlugs: ['cervecerias'] },
  { googleType: 'wine_bar', categorySlugs: ['gastronomia'], subcategorySlugs: ['wine-bar'] },
  { googleType: 'cocktail_bar', categorySlugs: ['gastronomia'], subcategorySlugs: ['coctelerias'] },
  { googleType: 'food_truck', categorySlugs: ['gastronomia'], subcategorySlugs: ['food-trucks'] },

  // Alojamiento
  { googleType: 'lodging', categorySlugs: ['alojamiento'], subcategorySlugs: ['hoteles'] },
  { googleType: 'hotel', categorySlugs: ['alojamiento'], subcategorySlugs: ['hoteles'] },
  { googleType: 'motel', categorySlugs: ['alojamiento'], subcategorySlugs: ['hoteles'] },
  { googleType: 'hostel', categorySlugs: ['alojamiento'], subcategorySlugs: ['hostales'] },
  { googleType: 'resort', categorySlugs: ['alojamiento'], subcategorySlugs: ['resorts'] },
  { googleType: 'campground', categorySlugs: ['alojamiento'], subcategorySlugs: ['camping'] },
  { googleType: 'rv_park', categorySlugs: ['alojamiento'], subcategorySlugs: ['camping'] },
  { googleType: 'bed_and_breakfast', categorySlugs: ['alojamiento'], subcategorySlugs: ['hosterias'] },
  { googleType: 'vacation_rental', categorySlugs: ['alojamiento'], subcategorySlugs: ['apartamentos-turisticos'] },

  // Turismo
  { googleType: 'tourist_attraction', categorySlugs: ['turismo'], subcategorySlugs: ['atracciones-turisticas'] },
  { googleType: 'travel_agency', categorySlugs: ['turismo'], subcategorySlugs: ['agencias-de-viaje'] },
  { googleType: 'visitor_center', categorySlugs: ['turismo'], subcategorySlugs: ['tours'] },
  { googleType: 'amusement_center', categorySlugs: ['turismo', 'entretenimiento'], subcategorySlugs: ['centros-recreativos'] },
  { googleType: 'national_park', categorySlugs: ['turismo'], subcategorySlugs: ['parques'] },
  { googleType: 'park', categorySlugs: ['turismo'], subcategorySlugs: ['parques'] },
  { googleType: 'scenic_point', categorySlugs: ['turismo'], subcategorySlugs: ['miradores'] },

  // Compras
  { googleType: 'shopping_mall', categorySlugs: ['compras'], subcategorySlugs: ['centros-comerciales'] },
  { googleType: 'department_store', categorySlugs: ['compras'], subcategorySlugs: ['tiendas'] },
  { googleType: 'clothing_store', categorySlugs: ['compras'], subcategorySlugs: ['moda-y-ropa'] },
  { googleType: 'electronics_store', categorySlugs: ['compras'], subcategorySlugs: ['tecnologia-tienda'] },
  { googleType: 'book_store', categorySlugs: ['compras'], subcategorySlugs: ['librerias'] },
  { googleType: 'jewelry_store', categorySlugs: ['compras'], subcategorySlugs: ['joyerias'] },
  { googleType: 'shoe_store', categorySlugs: ['compras'], subcategorySlugs: ['calzado'] },
  { googleType: 'florist', categorySlugs: ['compras'], subcategorySlugs: ['flores-y-regalos'] },
  { googleType: 'furniture_store', categorySlugs: ['compras'], subcategorySlugs: ['mueblerias'] },
  { googleType: 'home_goods_store', categorySlugs: ['compras'], subcategorySlugs: ['decoracion'] },
  { googleType: 'pet_store', categorySlugs: ['mascotas'], subcategorySlugs: ['pet-shops'] },
  { googleType: 'grocery_or_supermarket', categorySlugs: ['compras'], subcategorySlugs: ['supermercados'] },
  { googleType: 'convenience_store', categorySlugs: ['compras'], subcategorySlugs: ['tiendas'] },
  { googleType: 'hardware_store', categorySlugs: ['compras'], subcategorySlugs: ['ferreterias'] },
  { googleType: 'toy_store', categorySlugs: ['compras'], subcategorySlugs: ['jugueterias'] },
  { googleType: 'market', categorySlugs: ['compras'], subcategorySlugs: ['mercados'] },

  // Salud y Bienestar
  { googleType: 'hospital', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['hospitales'] },
  { googleType: 'doctor', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['medicos'] },
  { googleType: 'dentist', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['dentistas'] },
  { googleType: 'pharmacy', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['farmacias'] },
  { googleType: 'physiotherapist', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['fisioterapia'] },
  { googleType: 'veterinary_care', categorySlugs: ['mascotas'], subcategorySlugs: ['veterinarias'] },
  { googleType: 'spa', categorySlugs: ['salud-bienestar', 'belleza'], subcategorySlugs: ['spa'] },
  { googleType: 'gym', categorySlugs: ['salud-bienestar', 'deportes'], subcategorySlugs: ['gimnasios'] },
  { googleType: 'beauty_salon', categorySlugs: ['belleza'], subcategorySlugs: ['peluquerias'] },
  { googleType: 'hair_care', categorySlugs: ['belleza'], subcategorySlugs: ['peluquerias'] },
  { googleType: 'barber_shop', categorySlugs: ['belleza'], subcategorySlugs: ['barberias'] },
  { googleType: 'nail_salon', categorySlugs: ['belleza'], subcategorySlugs: ['unas'] },
  { googleType: 'optician', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['opticas'] },
  { googleType: 'medical_lab', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['laboratorios'] },
  { googleType: 'clinic', categorySlugs: ['salud-bienestar'], subcategorySlugs: ['clinicas'] },

  // Educación
  { googleType: 'school', categorySlugs: ['educacion'], subcategorySlugs: ['escuelas'] },
  { googleType: 'primary_school', categorySlugs: ['educacion'], subcategorySlugs: ['escuelas'] },
  { googleType: 'secondary_school', categorySlugs: ['educacion'], subcategorySlugs: ['colegios'] },
  { googleType: 'university', categorySlugs: ['educacion'], subcategorySlugs: ['universidades'] },
  { googleType: 'library', categorySlugs: ['educacion'], subcategorySlugs: ['bibliotecas'] },
  { googleType: 'preschool', categorySlugs: ['educacion'], subcategorySlugs: ['escuelas'] },
  { googleType: 'language_school', categorySlugs: ['educacion'], subcategorySlugs: ['idiomas'] },

  // Cultura
  { googleType: 'museum', categorySlugs: ['cultura'], subcategorySlugs: ['museos'] },
  { googleType: 'art_gallery', categorySlugs: ['cultura'], subcategorySlugs: ['galerias'] },
  { googleType: 'performing_arts_theater', categorySlugs: ['cultura'], subcategorySlugs: ['teatros'] },
  { googleType: 'cultural_center', categorySlugs: ['cultura'], subcategorySlugs: ['centros-culturales'] },

  // Entretenimiento
  { googleType: 'movie_theater', categorySlugs: ['entretenimiento'], subcategorySlugs: ['cines'] },
  { googleType: 'night_club', categorySlugs: ['entretenimiento'], subcategorySlugs: ['night-clubs'] },
  { googleType: 'amusement_park', categorySlugs: ['entretenimiento', 'turismo'], subcategorySlugs: ['parques-tematicos'] },
  { googleType: 'zoo', categorySlugs: ['entretenimiento', 'turismo'], subcategorySlugs: ['zoologicos'] },
  { googleType: 'aquarium', categorySlugs: ['entretenimiento', 'turismo'], subcategorySlugs: ['acuarios'] },
  { googleType: 'bowling_alley', categorySlugs: ['entretenimiento'], subcategorySlugs: ['salas-de-juegos'] },
  { googleType: 'casino', categorySlugs: ['entretenimiento'], subcategorySlugs: ['salas-de-juegos'] },
  { googleType: 'karaoke', categorySlugs: ['entretenimiento'], subcategorySlugs: ['karaoke'] },
  { googleType: 'live_music_venue', categorySlugs: ['entretenimiento', 'gastronomia'], subcategorySlugs: ['musica-en-vivo'] },
  { googleType: 'dance_hall', categorySlugs: ['entretenimiento'], subcategorySlugs: ['discotecas'] },
  { googleType: 'event_venue', categorySlugs: ['entretenimiento'], subcategorySlugs: ['eventos-sociales'] },
  { googleType: 'game_room', categorySlugs: ['entretenimiento'], subcategorySlugs: ['salas-de-juegos'] },

  // Deportes
  { googleType: 'stadium', categorySlugs: ['deportes'], subcategorySlugs: ['complejos-deportivos'] },
  { googleType: 'sports_complex', categorySlugs: ['deportes'], subcategorySlugs: ['complejos-deportivos'] },
  { googleType: 'sports_club', categorySlugs: ['deportes'], subcategorySlugs: ['complejos-deportivos'] },
  { googleType: 'swimming_pool', categorySlugs: ['deportes'], subcategorySlugs: ['natacion'] },
  { googleType: 'tenis_court', categorySlugs: ['deportes'], subcategorySlugs: ['tenis'] },
  { googleType: 'soccer_field', categorySlugs: ['deportes'], subcategorySlugs: ['futbol'] },
  { googleType: 'basketball_court', categorySlugs: ['deportes'], subcategorySlugs: ['basket'] },
  { googleType: 'martial_arts_school', categorySlugs: ['deportes'], subcategorySlugs: ['artes-marciales'] },
  { googleType: 'cycling_track', categorySlugs: ['deportes'], subcategorySlugs: ['ciclismo'] },
  { googleType: 'padel_court', categorySlugs: ['deportes'], subcategorySlugs: ['padel'] },
  { googleType: 'fitness_center', categorySlugs: ['deportes', 'salud-bienestar'], subcategorySlugs: ['gimnasios'] },

  // Automotriz y Transporte
  { googleType: 'car_dealer', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['concesionarios'] },
  { googleType: 'car_repair', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['mecanica'] },
  { googleType: 'car_rental', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['alquiler-de-vehiculos'] },
  { googleType: 'car_wash', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['lavado'] },
  { googleType: 'gas_station', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['gasolineras'] },
  { googleType: 'parking', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['transporte'], confidence: 80 },
  { googleType: 'ev_charging_station', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['carga-electrica'] },
  { googleType: 'auto_parts_store', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['repuestos'] },
  { googleType: 'motorcycle_dealer', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['motos'] },
  { googleType: 'taxi_stand', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['taxis'] },
  { googleType: 'bus_station', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['transporte'] },
  { googleType: 'transit_station', categorySlugs: ['automotriz-transporte'], subcategorySlugs: ['transporte'] },

  // Gobierno e Instituciones
  { googleType: 'city_hall', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['municipios'] },
  { googleType: 'courthouse', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['justicia'] },
  { googleType: 'police', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['instituciones-publicas'] },
  { googleType: 'fire_station', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['instituciones-publicas'] },
  { googleType: 'local_government_office', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['gobierno'] },
  { googleType: 'embassy', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['embajadas'] },
  { googleType: 'post_office', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['servicios-publicos'] },
  { googleType: 'notary_public', categorySlugs: ['gobierno-instituciones', 'empresas-servicios'], subcategorySlugs: ['notarias'] },
  { googleType: 'registry_office', categorySlugs: ['gobierno-instituciones'], subcategorySlugs: ['registros'] },

  // Empresas y Servicios
  { googleType: 'corporate_office', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['servicios-profesionales'] },
  { googleType: 'business_center', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['centros-de-negocios'] },
  { googleType: 'coworking_space', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['coworking'] },
  { googleType: 'advertising_agency', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['publicidad'] },
  { googleType: 'lawyer', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['legal'] },
  { googleType: 'accounting', categorySlugs: ['finanzas', 'empresas-servicios'], subcategorySlugs: ['contabilidad'] },
  { googleType: 'insurance_agency', categorySlugs: ['finanzas', 'empresas-servicios'], subcategorySlugs: ['seguros'] },
  { googleType: 'real_estate_agency', categorySlugs: ['inmobiliaria'], subcategorySlugs: ['corredores'] },
  { googleType: 'telecommunications', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['telecomunicaciones'] },
  { googleType: 'construction_company', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['construccion'] },
  { googleType: 'funeral_home', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['funerarias'] },
  { googleType: 'consulting_firm', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['consultoria'] },
  { googleType: 'software_company', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['software'] },
  { googleType: 'web_design', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['desarrollo-web'] },
  { googleType: 'marketing_agency', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['marketing'] },
  { googleType: 'media_company', categorySlugs: ['empresas-servicios'], subcategorySlugs: ['medios-de-comunicacion'] },

  // Finanzas
  { googleType: 'bank', categorySlugs: ['finanzas'], subcategorySlugs: ['bancos'] },
  { googleType: 'atm', categorySlugs: ['finanzas'], subcategorySlugs: ['atm'] },
  { googleType: 'credit_union', categorySlugs: ['finanzas'], subcategorySlugs: ['cooperativas'] },
  { googleType: 'money_transfer', categorySlugs: ['finanzas'], subcategorySlugs: ['casas-de-cambio'] },
  { googleType: 'investment_firm', categorySlugs: ['finanzas'], subcategorySlugs: ['inversiones'] },

  // Mascotas
  { googleType: 'pet_grooming', categorySlugs: ['mascotas'], subcategorySlugs: ['grooming'] },
  { googleType: 'dog_training', categorySlugs: ['mascotas'], subcategorySlugs: ['adiestramiento'] },
  { googleType: 'pet_boarding', categorySlugs: ['mascotas'], subcategorySlugs: ['guarderias'] },
  { googleType: 'animal_shelter', categorySlugs: ['mascotas'], subcategorySlugs: ['veterinarias'] },

  // Belleza
  { googleType: 'cosmetics_store', categorySlugs: ['belleza', 'compras'], subcategorySlugs: ['maquillaje'] },
  { googleType: 'day_spa', categorySlugs: ['belleza', 'salud-bienestar'], subcategorySlugs: ['spa-belleza'] },
  { googleType: 'aesthetic_clinic', categorySlugs: ['belleza'], subcategorySlugs: ['centros-esteticos-belleza'] },

  // Inmobiliaria
  { googleType: 'home_builder', categorySlugs: ['inmobiliaria'], subcategorySlugs: ['constructoras'] },
  { googleType: 'property_management', categorySlugs: ['inmobiliaria'], subcategorySlugs: ['alquileres'] },
  { googleType: 'apartment_complex', categorySlugs: ['inmobiliaria'], subcategorySlugs: ['alquileres'] },
]

export async function seedGooglePlaceTypes() {
  console.log('Seeding Google Place Type mappings...')

  let created = 0
  let updated = 0

  for (const mapping of GOOGLE_TYPE_MAPPINGS) {
    const existing = await prisma.googlePlaceTypeMapping.findUnique({
      where: { googleType: mapping.googleType },
    })

    if (existing) {
      await prisma.googlePlaceTypeMapping.update({
        where: { googleType: mapping.googleType },
        data: {
          categorySlugs: mapping.categorySlugs,
          subcategorySlugs: mapping.subcategorySlugs,
          confidence: mapping.confidence ?? 100,
          approved: true,
        },
      })
      updated++
    } else {
      await prisma.googlePlaceTypeMapping.create({
        data: {
          googleType: mapping.googleType,
          categorySlugs: mapping.categorySlugs,
          subcategorySlugs: mapping.subcategorySlugs,
          confidence: mapping.confidence ?? 100,
          approved: true,
        },
      })
      created++
    }
  }

  console.log(`  Created: ${created}, Updated: ${updated}`)
  console.log(`  Total mappings: ${GOOGLE_TYPE_MAPPINGS.length}`)
}

seedGooglePlaceTypes()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
