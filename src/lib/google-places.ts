import { z } from 'zod';

// Esquemas de validación para las respuestas de la API
const GooglePlaceSchema = z.object({
  id: z.string(),
  displayName: z.object({
    text: z.string()
  }),
  formattedAddress: z.string().optional(),
  nationalPhoneNumber: z.string().optional(),
  websiteUri: z.string().optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  photos: z.array(z.object({
    name: z.string(),
    widthPx: z.number(),
    heightPx: z.number(),
  })).optional(),
  types: z.array(z.string()).optional(),
  primaryType: z.string().optional(),
  primaryTypeDisplayName: z.object({
    text: z.string(),
    languageCode: z.string()
  }).optional()
});

const GooglePlacesResponseSchema = z.object({
  places: z.array(GooglePlaceSchema).default([]),
});

const GooglePlaceDetailsSchema = z.object({
  place: z.object({
    id: z.string(),
    displayName: z.object({
      text: z.string()
    }),
    formattedAddress: z.string().optional(),
    nationalPhoneNumber: z.string().optional(),
    websiteUri: z.string().optional(),
    rating: z.number().optional(),
    userRatingCount: z.number().optional(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
    regularOpeningHours: z.object({
      weekdayDescriptions: z.array(z.string()),
    }).optional(),
    editorialSummary: z.object({
      text: z.string(),
    }).optional(),
    reviews: z.array(z.object({
      text: z.object({
        text: z.string(),
      }),
      authorAttribution: z.object({
        displayName: z.string(),
      }),
      rating: z.number(),
      relativePublishTimeDescription: z.string(),
    })).optional(),
    photos: z.array(z.object({
      name: z.string(),
      widthPx: z.number(),
      heightPx: z.number(),
    })).optional(),
    types: z.array(z.string()).optional(),
    primaryType: z.string().optional(),
    primaryTypeDisplayName: z.object({
      text: z.string(),
      languageCode: z.string()
    }).optional()
  }),
});

export interface GooglePlace {
  id: string; 
  displayName: {
    text: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  photos?: {
    name: string;
    widthPx: number;
    heightPx: number;
  }[];
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: {
    text: string;
    languageCode: string;
  };
  placeId?: string; 
  phoneNumber?: string;
}

export interface GooglePlaceDetails extends GooglePlace {
  regularOpeningHours?: {
    weekdayDescriptions: string[];
  };
  editorialSummary?: {
    text: string;
  };
  reviews?: {
    text: {
      text: string;
    };
    authorAttribution: {
      displayName: string;
    };
    rating: number;
    relativePublishTimeDescription: string;
  }[];
}

class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://places.googleapis.com/v1';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
    }
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
        'X-Goog-FieldMask': this.getFieldMask(options.body),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Places API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  private getFieldMask(body?: any): string {
    // Configuración base de la API
    const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
    const PLACES_API_URL = 'https://places.googleapis.com/v1';

    // Fields para la nueva Places API (v1)
    const PLACE_SEARCH_FIELDS = [
      'places.id',
      'places.displayName.text', // Cambiado de name a displayName.text
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.location.latitude',
      'places.location.longitude',
      'places.photos.name',
      'places.photos.widthPx',
      'places.photos.heightPx',
      'places.types',
      'places.primaryType',
      'places.primaryTypeDisplayName.text',
      'places.primaryTypeDisplayName.languageCode'
    ].join(',');

    const PLACE_DETAILS_FIELDS = [
      'id',
      'displayName.text', // Cambiado de name a displayName.text
      'formattedAddress',
      'nationalPhoneNumber',
      'websiteUri',
      'rating',
      'userRatingCount',
      'location.latitude',
      'location.longitude',
      'regularOpeningHours.weekdayDescriptions',
      'editorialSummary.text',
      'reviews.text.text',
      'reviews.authorAttribution.displayName',
      'reviews.rating',
      'reviews.relativePublishTimeDescription',
      'photos.name',
      'photos.widthPx',
      'photos.heightPx',
      'types',
      'primaryType',
      'primaryTypeDisplayName.text',
      'primaryTypeDisplayName.languageCode'
    ].join(',');

    // Campos que queremos obtener (optimización de costos)
    const fields = PLACE_SEARCH_FIELDS;

    // Para detalles del lugar
    if (body && body.includeDetails) {
      return PLACE_DETAILS_FIELDS;
    }

    return fields;
  }

  async searchPlaces(
    query: string,
    options: {
      location?: { lat: number; lng: number };
      radius?: number;
      minRating?: number;
      isOpenNow?: boolean;
      priceLevels?: number[];
      includedTypes?: string[];
      excludedTypes?: string[];
      language?: string;
      maxResultCount?: number;
    } = {}
  ): Promise<GooglePlace[]> {
    const searchParams = new URLSearchParams({
      textQuery: query,
      languageCode: 'es',
      maxResultCount: (options.maxResultCount || 20).toString(),
    });

    // Añadir filtros de ubicación si se proporcionan
    if (options.location) {
      searchParams.set('locationBias', `circle:${options.radius || 5000}@${options.location.lat},${options.location.lng}`);
    }

    // Construir el cuerpo de la solicitud para filtros avanzados
    const body: any = {};

    if (options.minRating) {
      body.minRating = options.minRating;
    }

    if (options.isOpenNow !== undefined) {
      body.isOpenNow = options.isOpenNow;
    }

    if (options.priceLevels && options.priceLevels.length > 0) {
      body.priceLevels = options.priceLevels;
    }

    if (options.includedTypes && options.includedTypes.length > 0) {
      body.includedTypes = options.includedTypes;
    }

    if (options.excludedTypes && options.excludedTypes.length > 0) {
      body.excludedTypes = options.excludedTypes;
    }

    const url = `${this.baseUrl}/places:searchText?${searchParams.toString()}`;
    
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      const validated = GooglePlacesResponseSchema.parse(response);
      return validated.places;
    } catch (error) {
      console.error('Error searching places:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string, language: string = 'es'): Promise<GooglePlaceDetails> {
    const fields = [
      'id',
      'displayName',
      'formattedAddress',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'websiteUri',
      'rating',
      'userRatingCount',
      'location',
      'photos',
      'types',
      'primaryType',
      'primaryTypeDisplayName',
      'editorialSummary'
    ].join(',');
    
    const url = `${this.baseUrl}/places/${placeId}?languageCode=${language}&fields=${fields}`;

    try {
      const response = await this.makeRequest<any>(url, {
        method: 'GET',
        // GET requests cannot have a body
      });

      const validated = GooglePlaceDetailsSchema.parse({
        place: {
          ...response,
          id: response.id || placeId
        }
      });
      
      // Mapear para que cumpla con GooglePlaceDetails
      return {
        ...validated.place,
        placeId: validated.place.id || placeId,
        phoneNumber: validated.place.nationalPhoneNumber
      };
    } catch (error) {
      console.error('Error getting place details:', error);
      throw error;
    }
  }

  async getPlacePhoto(
    photoName: string,
    maxWidthPx?: number,
    maxHeightPx?: number
  ): Promise<string> {
    const params = new URLSearchParams({
      name: photoName,
      skipHttpRedirect: 'true',
    });

    if (maxWidthPx) params.set('maxWidthPx', maxWidthPx.toString());
    if (maxHeightPx) params.set('maxHeightPx', maxHeightPx.toString());

    const url = `${this.baseUrl}/${photoName}/media?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: {
          'X-Goog-Api-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch photo: ${response.status}`);
      }

      const data = await response.json();
      return data.photoUri;
    } catch (error) {
      console.error('Error getting place photo:', error);
      throw error;
    }
  }

  // Mapear lugar de Google a nuestro modelo Venue
  mapToVenue(googlePlace: GooglePlace | GooglePlaceDetails, categoryId: string, userId: string) {
    const placeId = googlePlace.id || googlePlace.placeId;
    const name = googlePlace.displayName?.text || '';
    
    return {
      name: name,
      slug: this.generateSlug(name),
      description: ('editorialSummary' in googlePlace && googlePlace.editorialSummary?.text) || `Importado desde Google Places: ${name}`,
      content: this.generateContent(googlePlace),
      phone: googlePlace.nationalPhoneNumber || googlePlace.phoneNumber,
      email: null,
      website: googlePlace.websiteUri,
      location: googlePlace.formattedAddress || '',
      lat: googlePlace.location?.latitude,
      lng: googlePlace.location?.longitude,
      address: googlePlace.formattedAddress,
      status: 'APPROVED' as const,  // Cambiado de 'PENDING' a 'APPROVED'
      featured: false,
      categoryId,
      userId,
      googlePlaceId: placeId,
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private generateContent(place: GooglePlace | GooglePlaceDetails): string {
    const content = [];

    if (place.rating) {
      content.push(`**Calificación:** ${place.rating}/5`);
      if (place.userRatingCount) {
        content.push(`(${place.userRatingCount} reseñas)`);
      }
    }

    if (place.types && place.types.length > 0) {
      content.push(`\n**Categorías:** ${place.types.join(', ')}`);
    }

    if (place.phoneNumber) {
      content.push(`\n**Teléfono:** ${place.phoneNumber}`);
    }

    if (place.websiteUri) {
      content.push(`\n**Sitio web:** ${place.websiteUri}`);
    }

    if (place.formattedAddress) {
      content.push(`\n**Dirección:** ${place.formattedAddress}`);
    }

    if ('editorialSummary' in place && place.editorialSummary?.text) {
      content.push(`\n\n${place.editorialSummary.text}`);
    }

    return content.join('\n');
  }
}

export const googlePlacesService = new GooglePlacesService();
