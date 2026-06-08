'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { GoogleSearchSchema, type GoogleSearchInput } from '@/schemas/google-import'
import { GOOGLE_CATEGORIES, type GoogleCategoryKey } from '@/types/google-import'
import { Search, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GoogleImportFormProps {
  onSearch: (data: GoogleSearchInput) => void
  isSearching: boolean
}

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
]

export function GoogleImportForm({ onSearch, isSearching }: GoogleImportFormProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['restaurant'])

  const form = useForm<GoogleSearchInput>({
    resolver: zodResolver(GoogleSearchSchema),
    defaultValues: {
      country: 'Ecuador',
      province: '',
      city: '',
      categories: ['restaurant'],
      radius: 5000,
    },
  })

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      form.setValue('categories', next)
      return next
    })
  }

  const handleSubmit = (data: GoogleSearchInput) => {
    onSearch({ ...data, categories: selectedCategories })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Importador Google Places
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">País</Label>
              <Input id="country" placeholder="Ecuador" {...form.register('country')} />
              {form.formState.errors.country && (
                <p className="text-sm text-red-500">{form.formState.errors.country.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" placeholder="Loja" {...form.register('province')} />
              {form.formState.errors.province && (
                <p className="text-sm text-red-500">{form.formState.errors.province.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" placeholder="Loja" {...form.register('city')} />
              {form.formState.errors.city && (
                <p className="text-sm text-red-500">{form.formState.errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Categorías</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(GOOGLE_CATEGORIES).map(([key, cat]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`cat-${key}`}
                    checked={selectedCategories.includes(key)}
                    onCheckedChange={() => toggleCategory(key)}
                  />
                  <Label htmlFor={`cat-${key}`} className="text-sm font-normal cursor-pointer">
                    {cat.label}
                  </Label>
                </div>
              ))}
            </div>
            {form.formState.errors.categories && (
              <p className="text-sm text-red-500">{form.formState.errors.categories.message}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Radio de búsqueda</Label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={form.watch('radius') === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => form.setValue('radius', opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {form.formState.errors.radius && (
              <p className="text-sm text-red-500">{form.formState.errors.radius.message}</p>
            )}
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
                Buscar negocios
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
