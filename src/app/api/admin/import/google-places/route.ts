import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { googlePlacesService } from '@/lib/google-places';
import { auth } from '@/lib/auth';

// Esquemas de validación
const ImportRequestSchema = z.object({
  query: z.string().min(1, 'La consulta es requerida'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  options: z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    radius: z.number().optional(),
    minRating: z.number().min(0).max(5).optional(),
    isOpenNow: z.boolean().optional(),
    priceLevels: z.array(z.number().min(1).max(4)).optional(),
    includedTypes: z.array(z.string()).optional(),
    excludedTypes: z.array(z.string()).optional(),
    maxResults: z.number().min(1).max(20).default(10),
    importDetails: z.boolean().default(false),
    importPhotos: z.boolean().default(false),
  }).optional(),
});

const BulkImportSchema = z.object({
  imports: z.array(z.object({
    placeId: z.string(),
    categoryId: z.string(),
    customName: z.string().optional(),
    customDescription: z.string().optional(),
  })),
  options: z.object({
    importDetails: z.boolean().default(false),
    importPhotos: z.boolean().default(false),
    overwriteExisting: z.boolean().default(false),
  }).optional(),
});

// GET - Buscar lugares en Google Places
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const categoryId = searchParams.get('categoryId');

    if (!query || !categoryId) {
      return NextResponse.json(
        { error: 'Query y categoryId son requeridos' },
        { status: 400 }
      );
    }

    // Parsear opciones adicionales
    const options: any = {};
    const location = searchParams.get('location');
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        options.location = { lat, lng };
      }
    }

    const radius = searchParams.get('radius');
    if (radius) {
      options.radius = Number(radius);
    }

    const minRating = searchParams.get('minRating');
    if (minRating) {
      options.minRating = Number(minRating);
    }

    const maxResults = searchParams.get('maxResults');
    if (maxResults) {
      options.maxResults = Number(maxResults);
    }

    // Buscar lugares en Google Places
    const places = await googlePlacesService.searchPlaces(query, options);

    // Verificar cuáles ya existen
    const existingVenues = await prisma.venue.findMany({
      where: {
        googlePlaceId: {
          in: places.map(p => p.placeId),
        }
      },
      select: {
        id: true,
        googlePlaceId: true,
      },
    });

    const existingMap = new Map(existingVenues.map(v => [(v as any).googlePlaceId as string, v.id]));

    // Marcar lugares ya importados
    const placesWithStatus = places.map(place => ({
      ...place,
      alreadyImported: existingMap.has(place.placeId),
      existingVenue: existingVenues.find(v => (v as any).googlePlaceId === place.placeId),
    }));

    return NextResponse.json({
      success: true,
      data: placesWithStatus,
      total: places.length,
      alreadyImported: existingMap.size,
    });
  } catch (error) {
    console.error('Error searching Google Places:', error);
    return NextResponse.json(
      { error: 'Error al buscar lugares en Google Places' },
      { status: 500 }
    );
  }
}

// POST - Importar un lugar específico
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { query, categoryId, options } = ImportRequestSchema.parse(body);

    // Buscar lugares
    const places = await googlePlacesService.searchPlaces(query, {
      ...options,
      maxResultCount: options?.maxResults || 1,
    });

    if (places.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron lugares' },
        { status: 404 }
      );
    }

    const place = places[0];

    // Verificar si ya existe
    const existingVenue = await prisma.venue.findFirst({
      where: { googlePlaceId: place.placeId } as any,
    });

    if (existingVenue) {
      return NextResponse.json(
        { error: 'El lugar ya ha sido importado', existingVenue },
        { status: 409 }
      );
    }

    // Obtener detalles adicionales si se solicita
    let placeDetails = place;
    if (options?.importDetails) {
      try {
        placeDetails = await googlePlacesService.getPlaceDetails(place.placeId);
      } catch (error) {
        console.warn('No se pudieron obtener detalles adicionales:', error);
      }
    }

    // Mapear a nuestro modelo
    const venueData = googlePlacesService.mapToVenue(
      placeDetails,
      categoryId,
      session.user.id
    );

    // Crear el venue
    const venue = await prisma.venue.create({
      data: venueData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Importar fotos si se solicita
    let photos: string[] = [];
    if (options?.importPhotos && placeDetails.photos) {
      try {
        photos = await Promise.all(
          placeDetails.photos.slice(0, 5).map(async (photo) => {
            const photoUri = await googlePlacesService.getPlacePhoto(
              photo.name,
              800,
              600
            );
            return photoUri;
          })
        );

        // Aquí podrías guardar las fotos en tu storage (R2, S3, etc.)
        // y actualizar el venue con la URL principal
        if (photos.length > 0) {
          await prisma.venue.update({
            where: { id: venue.id },
            data: { image: photos[0] },
          });
        }
      } catch (error) {
        console.warn('No se pudieron importar las fotos:', error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        venue,
        photos,
      },
    });
  } catch (error) {
    console.error('Error importing place:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al importar el lugar' },
      { status: 500 }
    );
  }
}

// PUT - Importación masiva
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imports, options } = BulkImportSchema.parse(body);

    const results = [];
    const errors = [];

    for (const importItem of imports) {
      try {
        // Verificar si ya existe
        const existingVenue = await prisma.venue.findFirst({
          where: { googlePlaceId: importItem.placeId } as any,
          select: { id: true, googlePlaceId: true } as any,
        });

        if (existingVenue && !options?.overwriteExisting) {
          errors.push({
            placeId: importItem.placeId,
            error: 'El lugar ya existe',
            venueId: existingVenue.id,
          });
          continue;
        }

        // Obtener detalles completos
        const placeDetails = await googlePlacesService.getPlaceDetails(importItem.placeId);

        let venue;

        if (existingVenue) {
          // Obtener el ID correctamente del objeto o array que retorna findFirst
          const venueIdToUpdate = Array.isArray(existingVenue.id) 
            ? String(existingVenue.id[0]) 
            : typeof existingVenue.id === 'string' 
              ? existingVenue.id 
              : String((existingVenue.id as any).id || existingVenue.id);
          
          // Actualizar local existente
          const updatedVenue = await prisma.venue.update({
            where: { id: venueIdToUpdate },
            data: {
              name: importItem.customName || placeDetails.name,
              description: importItem.customDescription || placeDetails.editorialSummary?.text || `Local importado de Google Places.`,
              location: placeDetails.formattedAddress,
              lat: placeDetails.location?.latitude,
              lng: placeDetails.location?.longitude,
              address: placeDetails.formattedAddress,
              phone: placeDetails.phoneNumber,
              website: placeDetails.websiteUri,
              status: 'APPROVED',
            },
          });
          
          // Asignar googlePlaceId por separado si TS se queja
          await prisma.$executeRaw`UPDATE "Venue" SET "googlePlaceId" = ${importItem.placeId} WHERE id = ${venueIdToUpdate}`;
          
          venue = updatedVenue;
        } else {
          // Crear nuevo local
          const newVenue = await prisma.venue.create({
            data: {
              name: importItem.customName || placeDetails.name,
              slug: `${(importItem.customName || placeDetails.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
              description: importItem.customDescription || placeDetails.editorialSummary?.text || `Local importado de Google Places.`,
              location: placeDetails.formattedAddress || 'Ubicación no especificada',
              lat: placeDetails.location?.latitude,
              lng: placeDetails.location?.longitude,
              address: placeDetails.formattedAddress,
              phone: placeDetails.phoneNumber,
              website: placeDetails.websiteUri,
              status: 'APPROVED',
              categoryId: importItem.categoryId,
              userId: session.user.id,
            },
          });
          
          // Asignar googlePlaceId por separado
          await prisma.$executeRaw`UPDATE "Venue" SET "googlePlaceId" = ${importItem.placeId} WHERE id = ${newVenue.id}`;
          
          venue = newVenue;
        }

        results.push({
          placeId: importItem.placeId,
          venueId: venue.id,
          action: existingVenue ? 'updated' : 'created',
        });
      } catch (error) {
        console.error(`Error importing ${importItem.placeId}:`, error);
        errors.push({
          placeId: importItem.placeId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return NextResponse.json({
      message: 'Importación completada con errores',
      stats: {
        total: imports.length,
        success: results.length,
        errorsCount: errors.length,
        results,
        errors,
      },
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error en la importación masiva' },
      { status: 500 }
    );
  }
}
