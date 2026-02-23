"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, MapPin, Star, Phone, Globe, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { GooglePlace } from '@/lib/google-places';

// Esquema de validación
const importSchema = z.object({
  query: z.string().min(1, 'Ingresa un término de búsqueda'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  location: z.string().optional(),
  radius: z.number().min(100).max(50000).optional(),
  minRating: z.number().min(0).max(5).optional(),
  isOpenNow: z.boolean().optional(),
  maxResults: z.number().min(1).max(20).default(10),
  importDetails: z.boolean().default(false),
  importPhotos: z.boolean().default(false),
});

type ImportFormData = z.infer<typeof importSchema>;

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface GooglePlaceWithStatus extends GooglePlace {
  alreadyImported: boolean;
  existingVenue?: {
    id: string;
    name: string;
  };
}

export function GooglePlacesImport({ categories }: { categories: Category[] }) {
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchResults, setSearchResults] = useState<GooglePlaceWithStatus[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlaceWithStatus | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      query: '',
      categoryId: '',
      location: '',
      radius: 5000,
      minRating: 0,
      isOpenNow: false,
      maxResults: 10,
      importDetails: true,
      importPhotos: false,
    },
  });

  const handleSearch = async (data: ImportFormData) => {
    setIsSearching(true);
    setSearchResults([]);
    setSelectedPlace(null);

    try {
      const params = new URLSearchParams({
        query: data.query,
        categoryId: data.categoryId,
        maxResults: data.maxResults.toString(),
      });

      if (data.location) {
        params.append('location', data.location);
      }
      if (data.radius) {
        params.append('radius', data.radius.toString());
      }
      if (data.minRating && data.minRating > 0) {
        params.append('minRating', data.minRating.toString());
      }

      const response = await fetch(`/api/admin/import/google-places?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al buscar lugares');
      }

      const result = await response.json();
      setSearchResults(result.data);

      if (result.data.length === 0) {
        toast.info('No se encontraron lugares con esos criterios');
      } else {
        toast.success(`Se encontraron ${result.data.length} lugares`);
      }
    } catch (error) {
      console.error('Error searching places:', error);
      toast.error(error instanceof Error ? error.message : 'Error al buscar lugares');
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (place: GooglePlaceWithStatus) => {
    if (place.alreadyImported) {
      toast.error('Este lugar ya ha sido importado');
      return;
    }

    setIsImporting(true);
    setSelectedPlace(place);

    try {
      const data = form.getValues();
      const response = await fetch('/api/admin/import/google-places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          place: place,
          categoryId: data.categoryId,
          importOptions: {
            importDetails: data.importDetails,
            importPhotos: data.importPhotos,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al importar lugar');
      }

      const result = await response.json();
      toast.success('Lugar importado exitosamente');

      // Actualizar el estado del lugar en los resultados
      if (result.data && result.data.venue) {
        setSearchResults(prev =>
          prev.map(p =>
            p.placeId === place.placeId
              ? { ...p, alreadyImported: true, existingVenue: { id: result.data.venue.id, name: result.data.venue.name } }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error importing place:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar lugar');
    } finally {
      setIsImporting(false);
      setSelectedPlace(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importar desde Google Places</CardTitle>
          <CardDescription>
            Busca e importa locales directamente desde Google Places API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="query">Término de búsqueda</Label>
                <Input
                  id="query"
                  placeholder="Ej: restaurantes, cafeterías, hoteles..."
                  {...form.register('query')}
                />
                {form.formState.errors.query && (
                  <p className="text-sm text-red-500">{form.formState.errors.query.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoría</Label>
                <Select
                  value={form.watch('categoryId')}
                  onValueChange={(value) => form.setValue('categoryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm"
            >
              {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
            </Button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación (lat,lng)</Label>
                  <Input
                    id="location"
                    placeholder="-3.9931,-79.2042"
                    {...form.register('location')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="radius">Radio (metros)</Label>
                  <Input
                    id="radius"
                    type="number"
                    placeholder="5000"
                    {...form.register('radius', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minRating">Calificación mínima</Label>
                  <Input
                    id="minRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    placeholder="0"
                    {...form.register('minRating', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxResults">Máx. resultados</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    min="1"
                    max="20"
                    {...form.register('maxResults', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importDetails"
                  checked={form.watch('importDetails')}
                  onCheckedChange={(checked) => form.setValue('importDetails', checked as boolean)}
                />
                <Label htmlFor="importDetails">Importar detalles adicionales</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="importPhotos"
                  checked={form.watch('importPhotos')}
                  onCheckedChange={(checked) => form.setValue('importPhotos', checked as boolean)}
                />
                <Label htmlFor="importPhotos">Importar fotos</Label>
              </div>
            </div>

            <Button type="submit" disabled={isSearching} className="w-full md:w-auto">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar lugares
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de búsqueda</CardTitle>
            <CardDescription>
              Se encontraron {searchResults.length} lugares ({searchResults.filter(p => p.alreadyImported).length} ya importados)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchResults.map((place) => (
                <div
                  key={place.placeId}
                  className={`border rounded-lg p-4 ${place.alreadyImported ? 'bg-gray-50' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{place.displayName?.text || 'Sin nombre'}</h3>
                        {place.alreadyImported && (
                          <Badge variant="secondary" className="text-xs">
                            Ya importado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        {place.rating && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-3 h-3 fill-current" />
                            {place.rating} ({place.userRatingCount})
                          </span>
                        )}
                        {place.websiteUri && (
                          <a 
                            href={place.websiteUri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            Sitio web
                          </a>
                        )}
                      </div>

                      {place.primaryTypeDisplayName && (
                        <Badge variant="outline" className="mb-2 mt-2">
                          {place.primaryTypeDisplayName.text}
                        </Badge>
                      )}

                      {place.alreadyImported && place.existingVenue && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Este lugar ya fue importado como "{place.existingVenue.name}". 
                            Puedes encontrarlo en la lista de locales.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {place.alreadyImported ? (
                        <Button variant="outline" size="sm" disabled>
                          <X className="mr-2 h-4 w-4" />
                          Ya importado
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleImport(place)}
                          disabled={isImporting && selectedPlace?.placeId === place.placeId}
                        >
                          {isImporting && selectedPlace?.placeId === place.placeId ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Importando...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Importar
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
