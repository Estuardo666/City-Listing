'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wizard, type WizardStep } from '@/components/wizard'
import { WizardTooltip } from '@/components/wizard'
import { createEventAction } from '@/actions/events'
import { eventSchema, type EventInput } from '@/schemas/event.schema'
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
import { Calendar, MapPin, Info, Package } from 'lucide-react'
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
        <StepEventInfo
          data={data}
          categories={categories}
          onChange={updateField}
        />
      ),
    },
    {
      id: 'location',
      title: 'Fecha, Lugar y Precio',
      description: 'Cuándo y dónde se realiza',
      icon: <MapPin className="h-5 w-5" />,
      isValid: isStep2Valid,
      content: (
        <StepEventLocation
          data={data}
          venues={venues}
          onChange={updateField}
        />
      ),
    },
    {
      id: 'summary',
      title: 'Resumen',
      description: 'Revisa la información antes de enviar',
      icon: <Package className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepEventSummary
          data={data}
          categories={categories}
          venues={venues}
        />
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="title">Título del evento *</Label>
          <WizardTooltip content="Un título claro y atractivo que describa tu evento. Aparecerá en las tarjetas de búsqueda y en la página de detalle." />
        </div>
        <Input
          id="title"
          placeholder="Ej: Festival de Música Loja 2024"
          value={data.title}
          onChange={(e) => onChange('title', e.target.value)}
          maxLength={120}
        />
        {data.title.length > 0 && data.title.length < 3 && (
          <p className="text-xs text-destructive">El título debe tener al menos 3 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="category">Categoría *</Label>
          <WizardTooltip content="Selecciona la categoría que mejor describe tu evento. Esto ayuda a los usuarios a encontrarlo." />
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="description">Descripción *</Label>
          <WizardTooltip content="Describe tu evento: qué actividades habrá, quiénes participan, qué incluye, etc. Máximo 1000 caracteres." />
        </div>
        <Textarea
          id="description"
          placeholder="Describe tu evento en detalle..."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          maxLength={1000}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">{data.description.length}/1000 caracteres</p>
        {data.description.length > 0 && data.description.length < 10 && (
          <p className="text-xs text-destructive">La descripción debe tener al menos 10 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="content">Contenido detallado (opcional)</Label>
          <WizardTooltip content="Información adicional: programa, artistas, reglas, etc. Aparecerá en la página de detalle del evento." />
        </div>
        <Textarea
          id="content"
          placeholder="Programa, artistas participantes, reglas..."
          value={data.content}
          onChange={(e) => onChange('content', e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Imagen destacada</Label>
          <WizardTooltip content="URL de la imagen de tu evento. Esta imagen aparecerá en las tarjetas y en la parte superior de la página del evento." />
        </div>
        <MediaUrlInputSimple
          value={data.image}
          onChange={(v) => onChange('image', v)}
          placeholder="https://..."
        />
      </div>
    </div>
  )
}

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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Fecha y hora</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="startDate">Fecha y hora de inicio *</Label>
              <WizardTooltip content="Selecciona cuándo comienza tu evento." />
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
              <Label htmlFor="endDate">Fecha y hora de fin (opcional)</Label>
              <WizardTooltip content="Si tu evento tiene una fecha de finalización definida. Deja vacío si es un evento de un solo día." />
            </div>
            <Input
              id="endDate"
              type="datetime-local"
              value={data.endDate}
              onChange={(e) => onChange('endDate', e.target.value)}
            />
            {data.endDate && data.startDate && new Date(data.endDate) < new Date(data.startDate) && (
              <p className="text-xs text-destructive">La fecha de fin no puede ser anterior al inicio</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Lugar</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="location">Ubicación / Zona *</Label>
            <WizardTooltip content="El barrio, parque o zona donde se realiza el evento. Ej: Centro histórico de Loja" />
          </div>
          <Input
            id="location"
            placeholder="Ej: Centro histórico de Loja"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
          />
          {data.location.length > 0 && data.location.length < 3 && (
            <p className="text-xs text-destructive">Debe tener al menos 3 caracteres</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="address">Dirección exacta</Label>
            <WizardTooltip content="La dirección completa del evento para que los asistentes lleguen fácilmente." />
          </div>
          <Input
            id="address"
            placeholder="Ej: Avenida 18 de Noviembre, Loja"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="venueId">Local asociado (opcional)</Label>
            <WizardTooltip content="Si el evento se realiza en un local registrado, selecciónalo para mostrar información adicional del lugar." />
          </div>
          <Select value={data.venueId || 'none'} onValueChange={(v) => onChange('venueId', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un local" />
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
            <Label>Ubicación en el mapa</Label>
            <WizardTooltip content="Haz clic en el mapa para marcar la ubicación exacta del evento." />
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="price">Precio de entrada (opcional)</Label>
          <WizardTooltip content="Si tu evento tiene un costo de entrada, ingrésalo aquí. Deja vacío si es gratuito." />
        </div>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          placeholder="Ej: 15.00 (dejar vacío si es gratis)"
          value={data.price}
          onChange={(e) => onChange('price', e.target.value)}
          className="max-w-xs"
        />
        <p className="text-xs text-muted-foreground">Deja vacío si el evento es gratuito</p>
      </div>
    </div>
  )
}

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
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          Revisa la información antes de crear el evento.
        </p>
      </div>

      <SummarySection title="Información del Evento">
        <SummaryItem label="Título" value={data.title} />
        <SummaryItem label="Categoría" value={category ? `${category.icon} ${category.name}` : '-'} />
        <SummaryItem label="Descripción" value={data.description} />
        {data.content && <SummaryItem label="Contenido" value={data.content} />}
        {data.image && <SummaryItem label="Imagen" value="Configurada ✓" />}
      </SummarySection>

      <SummarySection title="Fecha y Lugar">
        <SummaryItem label="Inicio" value={formatDate(data.startDate)} />
        {data.endDate && <SummaryItem label="Fin" value={formatDate(data.endDate)} />}
        <SummaryItem label="Ubicación" value={data.location} />
        {data.address && <SummaryItem label="Dirección" value={data.address} />}
        {venue && <SummaryItem label="Local" value={venue.name} />}
        {data.lat && data.lng && <SummaryItem label="Mapa" value={`${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`} />}
        <SummaryItem label="Precio" value={data.price ? `$${parseFloat(data.price).toFixed(2)}` : 'Gratuito'} />
      </SummarySection>
    </div>
  )
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="rounded-lg border border-border/50 bg-card p-4">{children}</div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
