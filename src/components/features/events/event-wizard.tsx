'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wizard, type WizardStep } from '@/components/wizard'
import { WizardTooltip } from '@/components/wizard'
import { createEventAction } from '@/actions/events'
import { type EventInput } from '@/schemas/event.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUrlInputSimple } from '@/components/features/media/media-url-input-simple'
import {
  Calendar, MapPin, Info, Package, Tag, FileText, ImageIcon,
  DollarSign, Clock, Star,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { EventCategory } from '@/types/event'
import type { VenueSelectOption } from '@/types/venue'

const LocationPickerMap = dynamic(
  () => import('@/components/features/map/location-picker-map').then((mod) => mod.LocationPickerMap),
  { ssr: false }
)

interface EventWizardData {
  title: string
  description: string
  content: string
  image: string
  categoryId: string
  startDate: string
  endDate: string
  price: string
  location: string
  address: string
  lat: number | null
  lng: number | null
  venueId: string
}

function toDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function getDefaultStartDate(): string {
  const now = new Date()
  now.setHours(now.getHours() + 1, 0, 0, 0)
  return toDateTimeLocalValue(now)
}

interface EventWizardProps {
  categories: EventCategory[]
  venues: VenueSelectOption[]
}

export function EventWizard({ categories, venues }: EventWizardProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<EventWizardData>({
    title: '',
    description: '',
    content: '',
    image: '',
    categoryId: '',
    startDate: getDefaultStartDate(),
    endDate: '',
    price: '',
    location: '',
    address: '',
    lat: null,
    lng: null,
    venueId: '',
  })

  const updateField = useCallback(<K extends keyof EventWizardData>(key: K, value: EventWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const isStep1Valid = useMemo(() => {
    return data.title.length >= 3 && data.description.length >= 10 && data.categoryId !== ''
  }, [data.title, data.description, data.categoryId])

  const isStep2Valid = useMemo(() => {
    if (!data.startDate) return false
    if (data.location.length < 3) return false
    if (data.endDate && new Date(data.endDate) < new Date(data.startDate)) return false
    return true
  }, [data.startDate, data.location, data.endDate])

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const input: EventInput = {
        title: data.title,
        description: data.description,
        content: data.content || null,
        image: data.image || null,
        categoryId: data.categoryId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        price: data.price ? parseFloat(data.price) : null,
        location: data.location,
        address: data.address || null,
        lat: data.lat,
        lng: data.lng,
        venueId: data.venueId || null,
        featured: false,
      }

      const result = await createEventAction(input)

      if (result.success) {
        toast.success('¡Evento creado correctamente!')
        router.push('/eventos')
      } else {
        toast.error(result.error ?? 'Error al crear el evento')
      }
    } catch {
      toast.error('Error al crear el evento')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, router])

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'info',
      title: 'Información del Evento',
      description: 'Datos principales e imagen',
      icon: <Info className="h-5 w-5" />,
      isValid: isStep1Valid,
      content: (
        <StepEventInfo data={data} categories={categories} onChange={updateField} />
      ),
    },
    {
      id: 'location',
      title: 'Fecha, Lugar y Precio',
      description: 'Cuándo y dónde se realiza',
      icon: <MapPin className="h-5 w-5" />,
      isValid: isStep2Valid,
      content: (
        <StepEventLocation data={data} venues={venues} onChange={updateField} />
      ),
    },
    {
      id: 'summary',
      title: 'Resumen',
      description: 'Así se verá tu evento',
      icon: <Package className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepEventSummary data={data} categories={categories} venues={venues} />
      ),
    },
  ], [data, categories, venues, isStep1Valid, isStep2Valid, updateField])

  return (
    <Wizard
      steps={steps}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitLabel="Crear evento"
    />
  )
}

/* ─────────────────── STEP 1: INFO ─────────────────── */

function StepEventInfo({
  data,
  categories,
  onChange,
}: {
  data: EventWizardData
  categories: EventCategory[]
  onChange: <K extends keyof EventWizardData>(key: K, value: EventWizardData[K]) => void
}) {
  return (
    <div className="space-y-6">
      {/* Título - grande y jerárquico */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="title" className="text-base font-semibold">Título del evento *</Label>
          <WizardTooltip content="Título claro y atractivo para tu evento." />
        </div>
        <Input
          id="title"
          placeholder="Ej: Festival de Música Loja 2024"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          maxLength={120}
          className="h-12 text-lg font-semibold"
        />
        {data.title.length > 0 && data.title.length < 3 && (
          <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
        )}
      </div>

      {/* Categoría */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="category">Categoría *</Label>
          <WizardTooltip content="Categoría que describe tu evento." />
        </div>
        <Select value={data.categoryId} onValueChange={(v) => onChange('categoryId', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Descripción + Contenido en 1 fila */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="description">Descripción *</Label>
            <WizardTooltip content="Describe tu evento: actividades, participantes, etc. Máx 1000 caracteres." />
          </div>
          <Textarea
            id="description"
            placeholder="Describe tu evento en detalle..."
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            maxLength={1000}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{data.description.length}/1000</p>
          {data.description.length > 0 && data.description.length < 10 && (
            <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="content">Contenido detallado</Label>
            <WizardTooltip content="Programa, artistas, reglas, etc." />
          </div>
          <Textarea
            id="content"
            placeholder="Programa, artistas participantes..."
            value={data.content}
            onChange={(e) => onChange('content', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* Imagen con preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label>Imagen destacada</Label>
          <WizardTooltip content="Imagen principal del evento." />
        </div>
        {data.image && data.image.startsWith('http') && (
          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.image} alt="Vista previa" className="h-full w-full object-cover" />
          </div>
        )}
        <MediaUrlInputSimple
          value={data.image}
          onChange={(v) => onChange('image', v)}
          placeholder="https://..."
        />
      </div>
    </div>
  )
}

/* ─────────────────── STEP 2: FECHA + LUGAR + PRECIO ─────────────────── */

function StepEventLocation({
  data,
  venues,
  onChange,
}: {
  data: EventWizardData
  venues: VenueSelectOption[]
  onChange: <K extends keyof EventWizardData>(key: K, value: EventWizardData[K]) => void
}) {
  return (
    <div className="space-y-6">
      {/* Fechas en 1 fila */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="startDate">Inicio *</Label>
          </div>
          <Input
            id="startDate"
            type="datetime-local"
            value={data.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="endDate">Fin (opcional)</Label>
            <WizardTooltip content="Deja vacío si es de un solo día." />
          </div>
          <Input
            id="endDate"
            type="datetime-local"
            value={data.endDate}
            onChange={(e) => onChange('endDate', e.target.value)}
          />
          {data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate) && (
            <p className="text-xs text-destructive">La fecha de fin no puede ser anterior</p>
          )}
        </div>
      </div>

      {/* Ubicación + Dirección en 1 fila */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="location">Ubicación *</Label>
            <WizardTooltip content="Zona o lugar del evento." />
          </div>
          <Input
            id="location"
            placeholder="Ej: Centro histórico de Loja"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
          />
          {data.location.length > 0 && data.location.length < 3 && (
            <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="address">Dirección exacta</Label>
          </div>
          <Input
            id="address"
            placeholder="Ej: Avenida 18 de Noviembre"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>
      </div>

      {/* Local + Precio en 1 fila */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="venueId">Local asociado</Label>
            <WizardTooltip content="Relaciona con un local registrado." />
          </div>
          <Select value={data.venueId || 'none'} onValueChange={(v) => onChange('venueId', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Sin local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin local asociado</SelectItem>
              {venues.map((venue) => (
                <SelectItem key={venue.id} value={venue.id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="price">Precio de entrada</Label>
            <WizardTooltip content="Vacío = gratuito." />
          </div>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00 (gratis)"
            value={data.price}
            onChange={(e) => onChange('price', e.target.value)}
          />
        </div>
      </div>

      {/* Mapa */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Label>Ubicación en el mapa</Label>
          <WizardTooltip content="Haz clic para marcar la ubicación exacta." />
        </div>
        <LocationPickerMap
          lat={data.lat}
          lng={data.lng}
          onChange={(lat, lng) => {
            onChange('lat', lat)
            onChange('lng', lng)
          }}
          onClear={() => {
            onChange('lat', null)
            onChange('lng', null)
          }}
          mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
          className="h-64 rounded-lg"
        />
      </div>
    </div>
  )
}

/* ─────────────────── STEP 3: RESUMEN (preview) ─────────────────── */

function StepEventSummary({
  data,
  categories,
  venues,
}: {
  data: EventWizardData
  categories: EventCategory[]
  venues: VenueSelectOption[]
}) {
  const category = categories.find((c) => c.id === data.categoryId)
  const venue = venues.find((v) => v.id === data.venueId)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleString('es-EC', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      {/* Alerta */}
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 p-3">
        <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
          Revisa la información antes de crear el evento.
        </p>
      </div>

      {/* Preview: simulación de card de evento */}
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* Hero image */}
        <div className="relative h-44 w-full overflow-hidden bg-accent">
          {data.image && data.image.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-pink-50 dark:from-purple-950 dark:to-pink-950">
              <Calendar className="h-12 w-12 text-purple-300 dark:text-purple-700" />
            </div>
          )}
          {/* Price badge */}
          {data.price && parseFloat(data.price) > 0 && (
            <span className="absolute left-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              ${parseFloat(data.price).toFixed(2)}
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-semibold text-white">
            Próximamente
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Category + Date */}
          <div className="flex items-center gap-2 flex-wrap">
            {category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                {category.icon} {category.name}
              </span>
            )}
            {data.startDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(data.startDate)}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[1.35rem] font-semibold leading-snug text-foreground">
            {data.title || 'Nombre del evento'}
          </h3>

          {/* Rating placeholder */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3 w-3 text-muted-foreground/30" />
              ))}
            </div>
            <span>Sin reseñas</span>
          </div>

          {/* Location */}
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{data.location || 'Ubicación no definida'}</span>
            {venue && <span className="text-xs text-muted-foreground/70">({venue.name})</span>}
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {data.description}
            </p>
          )}

          {/* Details */}
          <div className="rounded-lg border border-border/40 p-3 space-y-1.5">
            {data.startDate && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">Inicio:</span>
                <span className="text-muted-foreground">{formatDate(data.startDate)}</span>
              </div>
            )}
            {data.endDate && (
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">Fin:</span>
                <span className="text-muted-foreground">{formatDate(data.endDate)}</span>
              </div>
            )}
            {data.price && parseFloat(data.price) > 0 ? (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">Precio:</span>
                <span className="text-muted-foreground">${parseFloat(data.price).toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span className="font-medium text-emerald-600">Entrada gratuita</span>
              </div>
            )}
            {data.address && (
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{data.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
