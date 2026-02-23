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
  categoryId: z.string().optional(), // opcional porque ahora viene dentro de cada importItem
  imports: z.array(
    z.object({
      placeId: z.string(),
      categoryId: z.string(),
      customName: z.string().optional(),
      customDescription: z.string().optional(),
    })
  ),
  options: z.object({
    overwriteExisting: z.boolean().default(false),
    importDetails: z.boolean().default(true),
    importPhotos: z.boolean().default(true),
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
    console.log('Searching Google Places for:', query, options);
    const places = await googlePlacesService.searchPlaces(query, options);
    console.log('Found places:', places.length);

    // 1. Filtrar los que ya existen
    const placeIds = places.map((p: any) => p.id).filter(Boolean);
    const existingVenues = await prisma.venue.findMany({
      where: {
        googlePlaceId: {
          in: placeIds,
        }
      } as any,
      select: {
        googlePlaceId: true,
        id: true,
        name: true,
      } as any,
    });
    console.log('Existing venues found:', existingVenues.length);

    const existingPlaceIds = new Set(existingVenues.map((v: any) => v.googlePlaceId));

    // 2. Importar los nuevos
    const placesToImport = places.filter((p: any) => !existingPlaceIds.has(p.id));

    // Marcar lugares ya importados
    const placesWithStatus = places.map(place => ({
      ...place,
      placeId: place.id, // Mapeamos para compatibilidad con el front
      alreadyImported: existingPlaceIds.has(place.id),
      existingVenue: existingVenues.find(v => (v as any).googlePlaceId === place.id),
    }));

    return NextResponse.json({
      success: true,
      data: placesWithStatus,
      total: places.length,
      alreadyImported: existingPlaceIds.size,
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

    const { place, categoryId, importOptions } = await request.json();

    if (!place || !place.id || !categoryId) {
      return NextResponse.json(
        { error: 'Datos incompletos para la importación' },
        { status: 400 }
      );
    }

    // 1. Verificar si ya existe por googlePlaceId
    console.log('Checking if venue exists:', place.id);
    const existingVenue = await prisma.venue.findFirst({
      where: { googlePlaceId: place.id } as any,
    });

    if (existingVenue) {
      return NextResponse.json(
        { error: 'El lugar ya ha sido importado', existingVenue },
        { status: 409 }
      );
    }

    // Obtener detalles adicionales si se solicita
    let placeDetails = place;
    if (importOptions?.importDetails) {
      try {
        placeDetails = await googlePlacesService.getPlaceDetails(place.id);
      } catch (error) {
        console.warn('No se pudieron obtener detalles adicionales:', error);
      }
    }

    // Mapear a nuestro modelo
    console.log('session.user.email:', session.user.email);
    console.log('session.user:', session.user);
    
    // Verificar si el usuario existe en la base de datos por email
    let user = await prisma.user.findUnique({
      where: { email: session.user.email || undefined },
      select: { id: true, email: true, name: true }
    });
    
    console.log('User exists in DB:', user);
    
    if (!user) {
      console.log('User not found, available users:');
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, name: true }
      });
      console.log(allUsers);
      
      return NextResponse.json(
        { error: 'Usuario no encontrado en la base de datos. Por favor, contacta al administrador.' },
        { status: 400 }
      );
    }
    
    const venueData = googlePlacesService.mapToVenue(
      placeDetails,
      categoryId,
      user.id  // Usar el ID del usuario encontrado por email
    );
    
    console.log('Venue data to create:', venueData);

    // Guardar en base de datos
    const venue = await prisma.venue.create({
      data: venueData as any,
    });

    // Procesar fotos si se solicita
    if (importOptions?.importPhotos && placeDetails.photos) {
      try {
        const photoUrls = await Promise.all(
          placeDetails.photos.slice(0, importOptions.maxPhotos || 3).map(async (photo: any) => {
              try {
                const photoUri = await googlePlacesService.getPlacePhoto(
                  photo.name,
                  800,
                  600
                );
                return photoUri;
              } catch (photoError) {
                console.warn('Failed to fetch photo:', photo.name, photoError);
                return null;
              }
            })
        );
        
        // Filtrar fotos nulas y actualizar el venue
        const validPhotoUrls = photoUrls.filter(url => url !== null);
        if (validPhotoUrls.length > 0) {
          await prisma.venue.update({
            where: { id: venue.id },
            data: { image: validPhotoUrls[0] } // Guardar la primera imagen como imagen principal
          });
        }
      } catch (error) {
        console.warn('Error processing photos:', error);
        // No fallar la importación si hay error en las fotos
      }
    }

    return NextResponse.json({ 
      success: true, 
      venue,
    });

  } catch (error) {
    console.error('Error importing place:', error);
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = BulkImportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validated.error.errors },
        { status: 400 }
      );
    }

    const { categoryId, imports, options } = validated.data;
    
    // Resultados de la importación
    const results = [];
    const errors = [];

    for (const importItem of imports) {
      try {
        // Verificar si existe
        const existingVenue = await prisma.venue.findFirst({
          where: { googlePlaceId: importItem.placeId } as any,
          select: { id: true },
        });

        if (existingVenue && !options?.overwriteExisting) {
          errors.push({
            id: importItem.placeId,
            error: 'El lugar ya existe',
            venueId: existingVenue.id,
          });
          continue;
        }

        // Obtener detalles completos
        const placeDetails = await googlePlacesService.getPlaceDetails(importItem.placeId);

        let venue;
        const targetCategoryId = importItem.categoryId || categoryId;

        if (!targetCategoryId) {
          throw new Error('Categoría no especificada');
        }

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
              name: importItem.customName || placeDetails.displayName?.text || '',
              description: importItem.customDescription || placeDetails.editorialSummary?.text || `Local importado de Google Places.`,
              location: placeDetails.formattedAddress || '',
              lat: placeDetails.location?.latitude,
              lng: placeDetails.location?.longitude,
              address: placeDetails.formattedAddress,
              phone: placeDetails.nationalPhoneNumber || placeDetails.phoneNumber,
              website: placeDetails.websiteUri,
              status: 'APPROVED',
              categoryId: targetCategoryId,
            },
          });
          
          // Asignar googlePlaceId por separado si TS se queja
          await prisma.$executeRaw`UPDATE "Venue" SET "googlePlaceId" = ${importItem.placeId} WHERE id = ${venueIdToUpdate}`;
          
          venue = updatedVenue;
        } else {
          // Crear nuevo local
          const name = importItem.customName || placeDetails.displayName?.text || '';
          const newVenue = await prisma.venue.create({
            data: {
              name: name,
              slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`,
              description: importItem.customDescription || placeDetails.editorialSummary?.text || `Local importado de Google Places.`,
              location: placeDetails.formattedAddress || 'Ubicación no especificada',
              lat: placeDetails.location?.latitude,
              lng: placeDetails.location?.longitude,
              address: placeDetails.formattedAddress,
              phone: placeDetails.nationalPhoneNumber || placeDetails.phoneNumber,
              website: placeDetails.websiteUri,
              status: 'APPROVED',
              categoryId: targetCategoryId,
              userId: session.user.id,
            },
          });
          
          // Asignar googlePlaceId por separado
          await prisma.$executeRaw`UPDATE "Venue" SET "googlePlaceId" = ${importItem.placeId} WHERE id = ${newVenue.id}`;
          
          venue = newVenue;
        }

        results.push({
          id: importItem.placeId,
          venueId: venue.id,
          action: existingVenue ? 'updated' : 'created',
        });
      } catch (error) {
        console.error(`Error importing ${importItem.placeId}:`, error);
        errors.push({
          id: importItem.placeId,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    return NextResponse.json({
      message: 'Importación completada',
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
