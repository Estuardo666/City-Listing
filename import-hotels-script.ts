import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const hotels = [
  {
    name: 'Hotel Loja Bella',
    slug: 'hotel-loja-bella',
    description: 'Hotel en el centro de Loja',
    content: 'Hotel cómodo y accesible en el corazón de Loja',
    phone: '+593 99 180 4800',
    email: null,
    website: 'hotellojabella/inicio',
    location: 'Los Ahorcados, Loja 110103',
    lat: -3.9942751,
    lng: -79.2072952,
    address: 'Los Ahorcados, Loja 110103',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b', // ID de categoría HOTEL
    userId: 'cmlys6wkp00012wj6vicazyzh', // ID de usuario estuarlito@gmail.com
    googlePlaceId: null
  },
  {
    name: 'Sonesta Hotel Loja',
    slug: 'sonesta-hotel-loja',
    description: 'Hotel sofisticado con habitaciones y suites refinadas, restaurante, bar y desayuno gratuito.',
    content: 'Hotel de lujo con servicios completos en Loja',
    phone: '+593 7-258-9000',
    email: null,
    website: 'sonestaloja.com',
    location: 'Av. Zoilo Rodriguez y Antisana, Calle Illiniza, Loja 110150',
    lat: -3.9933282,
    lng: -79.1974891,
    address: 'Av. Zoilo Rodriguez y Antisana, Calle Illiniza, Loja 110150',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hotel Saraguro Loja',
    slug: 'hotel-saraguro-loja',
    description: 'Hotel en Avenida universitaria',
    content: 'Hotel cómodo con buena ubicación en Loja',
    phone: '+593 98 000 4198',
    email: null,
    website: 'hotelsaraguro.com',
    location: 'Avenida universitaria 201-26 entre 10 De Agosto, Loja 110108',
    lat: -3.9970227,
    lng: -79.204889,
    address: 'Avenida universitaria 201-26 entre 10 De Agosto, Loja 110108',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hostal "CAMIL"',
    slug: 'hostal-camil',
    description: 'Hostal en 18 de Noviembre',
    content: 'Hostal acogedor en el centro de Loja',
    phone: '+593 7-258-5803',
    email: null,
    website: null,
    location: '18 de Noviembre, Loja',
    lat: -4.0085304,
    lng: -79.203012,
    address: '18 de Noviembre, Loja',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hotel Residencial "Miraflores"',
    slug: 'hotel-residencial-miraflores',
    description: 'Hotel residencial en 10 de Agosto',
    content: 'Hotel residencial con buena ubicación',
    phone: '+593 7-257-0059',
    email: null,
    website: null,
    location: '10 de Agosto, Loja',
    lat: -3.9973017,
    lng: -79.20471,
    address: '10 de Agosto, Loja',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hostal Los Lirios',
    slug: 'hostal-los-lirios',
    description: 'Hostal en Jose Maria Peña',
    content: 'Hostal con jardines y ambiente tranquilo',
    phone: '+593 7-258-8563',
    email: null,
    website: null,
    location: 'Jose Maria Peña 09-59, Loja 110104',
    lat: -3.9992513,
    lng: -79.2070979,
    address: 'Jose Maria Peña 09-59, Loja 110104',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hostal "Pucara"',
    slug: 'hostal-pucara',
    description: 'Hostal en Azuay y Lauro Guerrero',
    content: 'Hostal tradicional lojano',
    phone: '+593 97 945 2213',
    email: null,
    website: null,
    location: 'Azuay y Lauro Guerrero, Loja 110102',
    lat: -4.00055,
    lng: -79.2054843,
    address: 'Azuay y Lauro Guerrero, Loja 110102',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Real Hotel Jomaley',
    slug: 'real-hotel-jomaley',
    description: 'Hotel en Av. Pio Jaramillo Alvarado',
    content: 'Hotel con servicios completos en el centro',
    phone: '+593 99 551 7371',
    email: null,
    website: null,
    location: 'Av. Pio Jaramillo Alvarado, Loja 110101',
    lat: -4.0201209,
    lng: -79.203685,
    address: 'Av. Pio Jaramillo Alvarado, Loja 110101',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  },
  {
    name: 'Hostal Iruña',
    slug: 'hostal-iruna',
    description: 'Hostal en Calle Catacocha',
    content: 'Hostal con encanto en el centro histórico',
    phone: '+593 99 302 5320',
    email: null,
    website: null,
    location: 'Calle Catacocha Entre José Joaquín de Olmedo, Loja 110102',
    lat: -4.0034981,
    lng: -79.1994317,
    address: 'Calle Catacocha Entre José Joaquín de Olmedo, Loja 110102',
    status: 'APPROVED' as const,
    featured: false,
    categoryId: 'cmlt9wcfa000acdlokrf7yq7b',
    userId: 'cmlys6wkp00012wj6vicazyzh',
    googlePlaceId: null
  }
]

async function importHotels() {
  console.log('Importando hoteles...')
  
  try {
    for (const hotel of hotels) {
      // Verificar si ya existe
      const existing = await prisma.venue.findFirst({
        where: {
          OR: [
            { slug: hotel.slug },
            { name: hotel.name }
          ]
        }
      })
      
      if (existing) {
        console.log(`⚠️  El hotel "${hotel.name}" ya existe, omitiendo...`)
        continue
      }
      
      // Crear el hotel
      const created = await prisma.venue.create({
        data: hotel
      })
      
      console.log(`✅ Hotel "${hotel.name}" importado con ID: ${created.id}`)
    }
    
    console.log('🎉 Importación completada!')
  } catch (error) {
    console.error('❌ Error durante la importación:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importHotels()
