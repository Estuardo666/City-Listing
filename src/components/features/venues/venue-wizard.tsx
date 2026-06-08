'use client'

import { useState, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Wizard, type WizardStep } from '@/components/wizard'
import { WizardTooltip } from '@/components/wizard'
import { createVenueCompleteAction, type VenueCompleteInput } from '@/actions/venues'
import { PREDEFINED_SERVICES, GASTRONOMIC_CATEGORY_SLUGS } from '@/lib/constants/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { TimePicker } from '@/components/ui/time-picker'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus, Trash2, Check, MapPin, Clock, Utensils, Package, Info,
  Tag, FileText, ImageIcon, Phone, Mail, Globe, DollarSign,
  Building2, Star, Image as LucideImage,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import type { VenueCategory } from '@/types/venue'

const LocationPickerMap = dynamic(
  () => import('@/components/features/map/location-picker-map').then((mod) => mod.LocationPickerMap),
  { ssr: false }
)

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_LABELS_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

interface TimeSlot {
  openTime: string
  closeTime: string
}

interface DaySchedule {
  dayOfWeek: number
  isClosed: boolean
  slots: TimeSlot[]
}

interface MenuItemData {
  name: string
  description: string
  price: string
  image: string
}

interface MenuCategoryData {
  name: string
  items: MenuItemData[]
}

interface ProductData {
  name: string
  description: string
  price: string
  image: string
}

interface VenueWizardData {
  name: string
  description: string
  content: string
  image: string
  categoryIds: string[]
  priceRange: string
  location: string
  address: string
  phone: string
  email: string
  website: string
  lat: number | null
  lng: number | null
  businessHours: DaySchedule[]
  selectedServices: Set<string>
  customServices: { name: string; description: string; icon: string }[]
  menuCategories: MenuCategoryData[]
  products: ProductData[]
}

const EMPTY_DAY_SCHEDULE: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isClosed: false,
  slots: i === 0 ? [] : [{ openTime: '09:00', closeTime: '18:00' }],
}))

function createEmptyMenuItem(): MenuItemData {
  return { name: '', description: '', price: '', image: '' }
}

function createEmptyMenuCategory(): MenuCategoryData {
  return { name: '', items: [] }
}

function createEmptyProduct(): ProductData {
  return { name: '', description: '', price: '', image: '' }
}

interface VenueWizardProps {
  categories: VenueCategory[]
}

export function VenueWizard({ categories }: VenueWizardProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<VenueWizardData>({
    name: '',
    description: '',
    content: '',
    image: '',
    categoryIds: [],
    priceRange: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    lat: null,
    lng: null,
    businessHours: EMPTY_DAY_SCHEDULE,
    selectedServices: new Set(),
    customServices: [],
    menuCategories: [],
    products: [],
  })

  const updateField = useCallback(<K extends keyof VenueWizardData>(key: K, value: VenueWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }, [])

  const selectedCategories = useMemo(
    () => categories.filter((c) => data.categoryIds.includes(c.id)),
    [categories, data.categoryIds]
  )

  const isGastronomic = useMemo(() => {
    return selectedCategories.some((c) => GASTRONOMIC_CATEGORY_SLUGS.includes(c.slug))
  }, [selectedCategories])

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const input: VenueCompleteInput = {
        basic: {
          name: data.name,
          description: data.description,
          content: data.content || null,
          image: data.image || null,
          categoryIds: data.categoryIds,
          priceRange: data.priceRange || null,
        },
        location: {
          location: data.location || data.address,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          website: data.website || null,
          lat: data.lat,
          lng: data.lng,
        },
        businessHours: data.businessHours
          .filter((day) => !day.isClosed && day.slots.length > 0)
          .flatMap((day) =>
            day.slots.map((slot) => ({
              dayOfWeek: day.dayOfWeek,
              openTime: slot.openTime,
              closeTime: slot.closeTime,
              isClosed: false,
            }))
          )
          .concat(
            data.businessHours
              .filter((day) => day.isClosed)
              .map((day) => ({
                dayOfWeek: day.dayOfWeek,
                openTime: '00:00',
                closeTime: '00:00',
                isClosed: true,
              }))
          ),
        services: [
          ...Array.from(data.selectedServices).map((name) => ({
            name,
            isCustom: false,
          })),
          ...data.customServices.map((s) => ({
            name: s.name,
            description: s.description || null,
            icon: s.icon || '✨',
            isCustom: true,
          })),
        ],
        menuCategories: data.menuCategories
          .filter((cat) => cat.name.trim() !== '')
          .map((cat) => ({
            name: cat.name,
            items: cat.items.filter((item) => item.name.trim() !== '').map((item) => ({
              name: item.name,
              description: item.description || null,
              price: item.price ? parseFloat(item.price) : null,
              image: item.image || null,
            })),
          })),
        products: data.products
          .filter((p) => p.name.trim() !== '')
          .map((p) => ({
            name: p.name,
            description: p.description || null,
            price: p.price ? parseFloat(p.price) : null,
            image: p.image || null,
          })),
      }

      const result = await createVenueCompleteAction(input)

      if (result.success) {
        toast.success('¡Local registrado correctamente! Será revisado antes de publicarse.')
        router.push('/dashboard/locales')
      } else {
        toast.error(result.error ?? 'Error al registrar el local')
      }
    } catch {
      toast.error('Error al registrar el local')
    } finally {
      setIsSubmitting(false)
    }
  }, [data, router])

  const steps: WizardStep[] = useMemo(() => [
    {
      id: 'basic',
      title: 'Información Básica',
      description: 'Datos principales e imagen de tu local',
      icon: <Info className="h-5 w-5" />,
      isValid: data.name.length >= 3 && data.description.length >= 10 && data.categoryIds.length > 0,
      content: (
        <StepBasicInfo data={data} categories={categories} onChange={updateField} />
      ),
    },
    {
      id: 'location',
      title: 'Ubicación y Horarios',
      description: 'Dirección, contacto y horarios de atención',
      icon: <MapPin className="h-5 w-5" />,
      isValid: data.lat !== null && data.lng !== null,
      content: (
        <StepLocationHours data={data} onChange={updateField} />
      ),
    },
    {
      id: 'services',
      title: 'Servicios y Amenities',
      description: '¿Qué ofrece tu local?',
      icon: <Star className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepServices data={data} onChange={updateField} />
      ),
    },
    {
      id: 'menu',
      title: isGastronomic ? 'Menú y Productos' : 'Productos',
      description: isGastronomic
        ? 'Categorías del menú y productos destacados'
        : 'Productos o servicios que ofreces',
      icon: <Utensils className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepMenuProducts data={data} isGastronomic={isGastronomic} onChange={updateField} />
      ),
    },
    {
      id: 'summary',
      title: 'Resumen',
      description: undefined,
      icon: <Package className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepSummary data={data} categories={categories} isGastronomic={isGastronomic} />
      ),
    },
  ], [data, categories, isGastronomic, updateField])

  return (
    <Wizard
      steps={steps}
      onComplete={handleComplete}
      isSubmitting={isSubmitting}
      submitLabel="Registrar local"
    />
  )
}

/* ─────────────────── STEP 1: INFO BÁSICA ─────────────────── */

function StepBasicInfo({
  data,
  categories,
  onChange,
}: {
  data: VenueWizardData
  categories: VenueCategory[]
  onChange: <K extends keyof VenueWizardData>(key: K, value: VenueWizardData[K]) => void
}) {
  return (
    <div className="space-y-6">
      {/* Nombre - grande y jerárquico */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="name" className="text-base font-semibold">Nombre del local *</Label>
          <WizardTooltip content="El nombre de tu negocio como lo conocen tus clientes." />
        </div>
        <Input
          id="name"
          placeholder="Ej: Café Loja"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          maxLength={120}
          className="h-12 text-lg font-semibold"
        />
        {data.name.length > 0 && data.name.length < 3 && (
          <p className="text-xs text-destructive">Mínimo 3 caracteres</p>
        )}
      </div>

      {/* Categoría + Precio */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="category">Categorías *</Label>
            <WizardTooltip content="Selecciona una o más categorías para tu negocio." />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const active = data.categoryIds.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const next = active
                      ? data.categoryIds.filter((id) => id !== cat.id)
                      : [...data.categoryIds, cat.id]
                    onChange('categoryIds', next)
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600 dark:text-white'
                      : 'border-border bg-card text-foreground hover:bg-muted/50 hover:border-foreground/20'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-xs">{cat.name}</span>
                  {active && <Check className="h-3 w-3" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="priceRange">Rango de precios</Label>
          </div>
          <Select value={data.priceRange || 'none'} onValueChange={(v) => onChange('priceRange', v === 'none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No especificar</SelectItem>
              <SelectItem value="$">$ - Económico</SelectItem>
              <SelectItem value="$$">$$ - Moderado</SelectItem>
              <SelectItem value="$$$">$$$ - Premium</SelectItem>
              <SelectItem value="$$$$">$$$$ - Lujo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descripción + Contenido en 1 fila */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="description">Descripción corta *</Label>
            <WizardTooltip content="Breve descripción para tarjetas de búsqueda. Máx 800 caracteres." />
          </div>
          <Textarea
            id="description"
            placeholder="Describe tu local en pocas palabras..."
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            maxLength={800}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{data.description.length}/800</p>
          {data.description.length > 0 && data.description.length < 10 && (
            <p className="text-xs text-destructive">Mínimo 10 caracteres</p>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="content">Contenido detallado</Label>
            <WizardTooltip content="Historia, filosofía, especialidades. Aparece en la página de detalle." />
          </div>
          <Textarea
            id="content"
            placeholder="Cuenta la historia de tu local..."
            value={data.content}
            onChange={(e) => onChange('content', e.target.value)}
            rows={4}
          />
        </div>
      </div>

      {/* Imagen destacada con preview */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Label>Imagen destacada</Label>
          <WizardTooltip content="Imagen principal que aparecerá en tarjetas y en la parte superior de tu ficha." />
        </div>
        <ImageUpload
          value={data.image}
          onChange={(v) => onChange('image', v)}
        />
      </div>
    </div>
  )
}

/* ─────────────────── STEP 2: UBICACIÓN + HORARIOS ─────────────────── */

function StepLocationHours({
  data,
  onChange,
}: {
  data: VenueWizardData
  onChange: <K extends keyof VenueWizardData>(key: K, value: VenueWizardData[K]) => void
}) {
  function updateDaySchedule(dayIdx: number, updater: (day: DaySchedule) => DaySchedule) {
    onChange(
      'businessHours',
      data.businessHours.map((day, i) => (i === dayIdx ? updater(day) : day))
    )
  }

  function addSlot(dayIdx: number) {
    updateDaySchedule(dayIdx, (day) => ({
      ...day,
      isClosed: false,
      slots: [...day.slots, { openTime: '09:00', closeTime: '18:00' }],
    }))
  }

  function removeSlot(dayIdx: number, slotIdx: number) {
    updateDaySchedule(dayIdx, (day) => ({
      ...day,
      slots: day.slots.filter((_, i) => i !== slotIdx),
    }))
  }

  function updateSlot(dayIdx: number, slotIdx: number, field: 'openTime' | 'closeTime', value: string) {
    updateDaySchedule(dayIdx, (day) => ({
      ...day,
      slots: day.slots.map((slot, i) => (i === slotIdx ? { ...slot, [field]: value } : slot)),
    }))
  }

  function toggleClosed(dayIdx: number) {
    updateDaySchedule(dayIdx, (day) => ({
      ...day,
      isClosed: !day.isClosed,
      slots: !day.isClosed ? [] : [{ openTime: '09:00', closeTime: '18:00' }],
    }))
  }

  function applyToAll(dayIdx: number) {
    const sourceSlots = data.businessHours[dayIdx].slots
    const sourceClosed = data.businessHours[dayIdx].isClosed
    onChange(
      'businessHours',
      data.businessHours.map((day) => ({
        ...day,
        isClosed: sourceClosed,
        slots: sourceClosed ? [] : [...sourceSlots],
      }))
    )
    toast.success('Horario aplicado a todos los días')
  }

  return (
    <div className="space-y-6">
      {/* Contacto: ubicación + dirección en 1 fila */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="location">Ubicación / Barrio</Label>
            <WizardTooltip content="Barrio o zona. Ej: Centro histórico" />
          </div>
          <Input
            id="location"
            placeholder="Ej: Centro histórico"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="address">Dirección exacta</Label>
            <WizardTooltip content="Calle, número, referencias." />
          </div>
          <Input
            id="address"
            placeholder="Ej: Calle Bolívar 10-25"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>
      </div>

      {/* Teléfono + Email + Website en 1 fila */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="phone">Teléfono</Label>
          </div>
          <Input
            id="phone"
            placeholder="+593 7 2571234"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="email">Email</Label>
          </div>
          <Input
            id="email"
            type="email"
            placeholder="contacto@local.com"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="website">Sitio web</Label>
          </div>
          <Input
            id="website"
            placeholder="https://misitio.com"
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
          />
        </div>
      </div>

      {/* Mapa + Horarios en 1 fila 50/50 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Mapa */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Label>Ubicación en el mapa *</Label>
            <WizardTooltip content="Haz clic en el mapa para marcar la ubicación exacta. Obligatorio." />
          </div>
          {data.lat === null && (
            <p className="text-xs text-amber-600">Selecciona un punto en el mapa</p>
          )}
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
            className="h-80 rounded-lg"
          />
        </div>

        {/* Horarios */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label>Horarios de atención</Label>
            <WizardTooltip content="Configura los horarios por día. Puedes agregar múltiples franjas." />
          </div>
          <div className="space-y-1.5 pr-1">
            {data.businessHours.map((day, dayIdx) => (
              <div key={dayIdx} className="rounded-lg border border-border bg-card overflow-visible">
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium w-8">{DAY_LABELS[dayIdx]}</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <Checkbox
                        id={`closed-${dayIdx}`}
                        checked={day.isClosed}
                        onCheckedChange={() => toggleClosed(dayIdx)}
                        className="h-3 w-3"
                      />
                      <span className="text-[10px] text-muted-foreground">Cerrado</span>
                    </label>
                  </div>
                  <div className="flex gap-0.5">
                    {!day.isClosed && (
                      <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => addSlot(dayIdx)}>
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-5 px-1.5 text-[8px] leading-none" onClick={() => applyToAll(dayIdx)}>
                      Copiar
                    </Button>
                  </div>
                </div>

                {!day.isClosed && day.slots.length > 0 && (
                  <div className="px-2.5 py-1.5 space-y-1">
                    {day.slots.map((slot, slotIdx) => (
                      <div key={slotIdx} className="flex items-center gap-1">
                        <TimePicker
                          value={slot.openTime}
                          onChange={(v) => updateSlot(dayIdx, slotIdx, 'openTime', v)}
                          disabled={false}
                        />
                        <span className="text-[10px] text-muted-foreground">-</span>
                        <TimePicker
                          value={slot.closeTime}
                          onChange={(v) => updateSlot(dayIdx, slotIdx, 'closeTime', v)}
                          disabled={false}
                        />
                        {day.slots.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => removeSlot(dayIdx, slotIdx)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!day.isClosed && day.slots.length === 0 && (
                  <div className="px-2.5 py-1.5 text-[10px] text-muted-foreground text-center">
                    Sin horarios
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────── STEP 3: SERVICIOS ─────────────────── */

function StepServices({
  data,
  onChange,
}: {
  data: VenueWizardData
  onChange: <K extends keyof VenueWizardData>(key: K, value: VenueWizardData[K]) => void
}) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customForm, setCustomForm] = useState({ name: '', description: '', icon: '' })

  function toggleService(name: string) {
    const next = new Set(data.selectedServices)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    onChange('selectedServices', next)
  }

  function addCustomService() {
    if (!customForm.name.trim()) return
    onChange('customServices', [...data.customServices, { ...customForm }])
    setCustomForm({ name: '', description: '', icon: '' })
    setShowCustomForm(false)
    toast.success('Servicio personalizado agregado')
  }

  function removeCustomService(index: number) {
    onChange('customServices', data.customServices.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Servicios disponibles</h3>
        <p className="text-xs text-muted-foreground">
          Selecciona los servicios que ofrece tu local.
        </p>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_SERVICES.map((ps) => {
            const active = data.selectedServices.has(ps.name)
            return (
              <button
                key={ps.name}
                type="button"
                onClick={() => toggleService(ps.name)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600 dark:text-white'
                    : 'border-border bg-card text-foreground hover:bg-muted/50 hover:border-foreground/20'
                }`}
              >
                <span>{ps.icon}</span>
                <span className="text-xs">{ps.name}</span>
                {active && <Check className="h-3 w-3" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Servicios personalizados */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Servicios personalizados</h3>
        {data.customServices.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.customServices.map((cs, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-sm">
                <span>{cs.icon || '✨'}</span>
                <span className="text-xs font-medium">{cs.name}</span>
                <button type="button" onClick={() => removeCustomService(idx)} className="ml-0.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {showCustomForm ? (
          <div className="space-y-2 rounded-lg border border-dashed border-border/60 p-3">
            <div className="grid grid-cols-[48px_1fr] gap-2">
              <Input
                placeholder="✨"
                value={customForm.icon}
                onChange={(e) => setCustomForm((p) => ({ ...p, icon: e.target.value }))}
                className="text-center text-sm h-8"
                maxLength={4}
              />
              <Input
                placeholder="Nombre del servicio *"
                value={customForm.name}
                onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                className="text-sm h-8"
              />
            </div>
            <Input
              placeholder="Descripción (opcional)"
              value={customForm.description}
              onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
              className="text-sm h-8"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCustomService} disabled={!customForm.name.trim()} className="h-7 text-xs">
                <Check className="h-3 w-3 mr-1" /> Agregar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowCustomForm(false); setCustomForm({ name: '', description: '', icon: '' }) }} className="h-7 text-xs">
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowCustomForm(true)} className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" /> Agregar servicio personalizado
          </Button>
        )}
      </div>
    </div>
  )
}

/* ─────────────────── STEP 4: MENÚ + PRODUCTOS ─────────────────── */

function StepMenuProducts({
  data,
  isGastronomic,
  onChange,
}: {
  data: VenueWizardData
  isGastronomic: boolean
  onChange: <K extends keyof VenueWizardData>(key: K, value: VenueWizardData[K]) => void
}) {
  const [expandedCats, setExpandedCats] = useState<Set<number>>(new Set())

  function toggleExpand(idx: number) {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function addMenuCategory() {
    onChange('menuCategories', [...data.menuCategories, createEmptyMenuCategory()])
    setExpandedCats((prev) => new Set(prev).add(data.menuCategories.length))
  }

  function removeMenuCategory(idx: number) {
    onChange('menuCategories', data.menuCategories.filter((_, i) => i !== idx))
  }

  function updateMenuCategory(idx: number, field: keyof MenuCategoryData, value: string) {
    onChange(
      'menuCategories',
      data.menuCategories.map((cat, i) => (i === idx ? { ...cat, [field]: value } : cat))
    )
  }

  function addMenuItem(catIdx: number) {
    onChange(
      'menuCategories',
      data.menuCategories.map((cat, i) =>
        i === catIdx ? { ...cat, items: [...cat.items, createEmptyMenuItem()] } : cat
      )
    )
  }

  function removeMenuItem(catIdx: number, itemIdx: number) {
    onChange(
      'menuCategories',
      data.menuCategories.map((cat, i) =>
        i === catIdx ? { ...cat, items: cat.items.filter((_, j) => j !== itemIdx) } : cat
      )
    )
  }

  function updateMenuItem(catIdx: number, itemIdx: number, field: keyof MenuItemData, value: string) {
    onChange(
      'menuCategories',
      data.menuCategories.map((cat, i) =>
        i === catIdx
          ? { ...cat, items: cat.items.map((item, j) => (j === itemIdx ? { ...item, [field]: value } : item)) }
          : cat
      )
    )
  }

  function addProduct() {
    onChange('products', [...data.products, createEmptyProduct()])
  }

  function removeProduct(idx: number) {
    onChange('products', data.products.filter((_, i) => i !== idx))
  }

  function updateProduct(idx: number, field: keyof ProductData, value: string) {
    onChange(
      'products',
      data.products.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    )
  }

  return (
    <div className="space-y-8">
      {isGastronomic && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Menú / Carta</h3>
              <WizardTooltip content="Organiza tu menú por categorías." />
            </div>
            <Button variant="outline" size="sm" onClick={addMenuCategory} className="gap-1.5 text-xs h-7">
              <Plus className="h-3 w-3" /> Categoría
            </Button>
          </div>

          {data.menuCategories.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
              <Utensils className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Aún no hay categorías. Agrega &quot;Entradas&quot;, &quot;Platos fuertes&quot;, etc.</p>
            </div>
          )}

          {data.menuCategories.map((cat, catIdx) => (
            <div key={catIdx} className="rounded-lg border border-border/40 bg-card overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-muted/20">
                <button type="button" onClick={() => toggleExpand(catIdx)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-xs">{expandedCats.has(catIdx) ? '▼' : '▶'}</span>
                  <Input
                    placeholder="Nombre categoría (ej: Platos fuertes)"
                    value={cat.name}
                    onChange={(e) => updateMenuCategory(catIdx, 'name', e.target.value)}
                    className="max-w-xs text-xs font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-[10px] text-muted-foreground">({cat.items.length})</span>
                </button>
                <div className="flex gap-0.5">
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => addMenuItem(catIdx)}>
                    <Plus className="h-2.5 w-2.5 mr-0.5" /> Item
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6" onClick={() => removeMenuCategory(catIdx)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedCats.has(catIdx) && (
                <div className="p-2.5 space-y-2">
                  {cat.items.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-1">Sin items</p>
                  )}
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="rounded-md border border-border/30 p-2 space-y-1.5">
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 grid grid-cols-1 gap-1.5 lg:grid-cols-2">
                          <div className="space-y-1.5">
                            <Input
                              placeholder="Nombre *"
                              value={item.name}
                              onChange={(e) => updateMenuItem(catIdx, itemIdx, 'name', e.target.value)}
                              className="text-xs h-7"
                            />
                            <Textarea
                              placeholder="Descripción (doble tamaño)"
                              value={item.description}
                              onChange={(e) => updateMenuItem(catIdx, itemIdx, 'description', e.target.value)}
                              className="text-xs min-h-[56px]"
                              rows={2}
                            />
                            <Input
                              placeholder="Precio"
                              type="number"
                              value={item.price}
                              onChange={(e) => updateMenuItem(catIdx, itemIdx, 'price', e.target.value)}
                              className="text-xs h-7 w-24"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <ImageUpload
                            value={item.image}
                            onChange={(v) => updateMenuItem(catIdx, itemIdx, 'image', v)}
                          />
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => removeMenuItem(catIdx, itemIdx)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Productos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{isGastronomic ? 'Productos destacados' : 'Productos'}</h3>
            <WizardTooltip content="Productos o servicios principales." />
          </div>
          <Button variant="outline" size="sm" onClick={addProduct} className="gap-1.5 text-xs h-7">
            <Plus className="h-3 w-3" /> Producto
          </Button>
        </div>

        {data.products.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">Aún no hay productos</p>
          </div>
        )}

        {data.products.map((product, idx) => (
          <div key={idx} className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">Producto {idx + 1}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeProduct(idx)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="space-y-2">
                <Input
                  placeholder="Nombre *"
                  value={product.name}
                  onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                  className="text-xs h-7"
                />
                <Textarea
                  placeholder="Descripción (doble tamaño)"
                  value={product.description}
                  onChange={(e) => updateProduct(idx, 'description', e.target.value)}
                  className="text-xs min-h-[56px]"
                  rows={2}
                />
                <Input
                  placeholder="Precio"
                  type="number"
                  value={product.price}
                  onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                  className="text-xs h-7 w-24"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <ImageUpload
                  value={product.image}
                  onChange={(v) => updateProduct(idx, 'image', v)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────── STEP 5: RESUMEN (preview frontend) ─────────────────── */

function StepSummary({
  data,
  categories,
  isGastronomic,
}: {
  data: VenueWizardData
  categories: VenueCategory[]
  isGastronomic: boolean
}) {
  const category = categories.find((c) => c.id === data.categoryIds[0])
  const selectedServiceNames = Array.from(data.selectedServices)
  const activeHours = data.businessHours.filter((d) => !d.isClosed && d.slots.length > 0)
  const closedDays = data.businessHours.filter((d) => d.isClosed)
  const hasMenu = data.menuCategories.some((c) => c.name.trim() !== '' && c.items.some((i) => i.name.trim() !== ''))
  const hasProducts = data.products.some((p) => p.name.trim() !== '')

  return (
    <div className="space-y-4">
      {/* Alerta informativa */}
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-emerald-800">
          Tu local será revisado antes de publicarse. Revisa que toda la información sea correcta.
        </p>
      </div>

      {/* Preview: simulación de la card del frontend */}
      <div className="w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        {/* Hero image */}
        <div className="relative h-44 w-full overflow-hidden bg-accent">
          {data.image && data.image.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
              <span className="text-4xl font-bold text-emerald-300 dark:text-emerald-700">
                {data.name.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          {/* Price badge */}
          {data.priceRange && (
            <span className="absolute left-3 bottom-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              {data.priceRange}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Category badge */}
          {category && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {category.icon} {category.name}
            </span>
          )}

          {/* Name */}
          <h3 className="text-[1.35rem] font-semibold leading-snug text-foreground">
            {data.name || 'Nombre del local'}
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
          {data.location && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{data.location}</span>
            </div>
          )}

          {/* Address */}
          {data.address && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <span className="text-xs">📍</span>
              <span>{data.address}</span>
            </div>
          )}

          {/* Contact info: phone, email, website */}
          {(data.phone || data.email || data.website) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
              {data.phone && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{data.phone}</span>
                </div>
              )}
              {data.email && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>{data.email}</span>
                </div>
              )}
              {data.website && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[200px]">{data.website}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {data.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {data.description}
            </p>
          )}

          {/* Services pills - accesibles */}
          {selectedServiceNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedServiceNames.map((name) => {
                const ps = PREDEFINED_SERVICES.find((s) => s.name === name)
                return (
                  <span key={name} className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                    {ps?.icon} {name}
                  </span>
                )
              })}
              {data.customServices.map((cs, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-900">
                  {cs.icon || '✨'} {cs.name}
                </span>
              ))}
            </div>
          )}

          {/* Map + Hours en 50/50 */}
          {(data.lat !== null && data.lng !== null) || activeHours.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {/* Map */}
              {data.lat !== null && data.lng !== null && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Ubicación</span>
                  </div>
                  <LocationPickerMap
                    lat={data.lat}
                    lng={data.lng}
                    onChange={() => {}}
                    mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? ''}
                    className="h-32 rounded-lg"
                  />
                </div>
              )}

              {/* Hours */}
              {activeHours.length > 0 && (
                <div className="rounded-lg border border-border/40 p-3 space-y-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Horarios</span>
                  </div>
                  {activeHours.map((day) => (
                    <div key={day.dayOfWeek} className="flex items-center gap-2 text-xs">
                      <span className="font-medium w-8">{DAY_LABELS[day.dayOfWeek]}</span>
                      <span className="text-muted-foreground">
                        {day.slots.map((s) => `${s.openTime} - ${s.closeTime}`).join(', ')}
                      </span>
                    </div>
                  ))}
                  {closedDays.length > 0 && (
                    <p className="text-[10px] text-muted-foreground pt-0.5">
                      Cerrado: {closedDays.map((d) => DAY_LABELS_FULL[d.dayOfWeek]).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Menu preview */}
          {hasMenu && (
            <div className="rounded-lg border border-border/40 p-3 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Utensils className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Menú</span>
              </div>
              {data.menuCategories.filter((c) => c.name.trim() !== '').map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-xs font-medium text-foreground">{cat.name}</p>
                  {cat.items.filter((i) => i.name.trim() !== '').map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center justify-between pl-3">
                      <div className="flex items-center gap-2">
                        {item.image && item.image.startsWith('http') && (
                          <div className="h-6 w-6 shrink-0 overflow-hidden rounded">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.image} alt="" className="h-full w-full object-cover" />
                          </div>
                        )}
                        <span className="text-xs text-muted-foreground">{item.name}</span>
                      </div>
                      {item.price && (
                        <span className="text-xs font-semibold">${parseFloat(item.price).toFixed(2)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Products preview */}
          {hasProducts && (
            <div className="rounded-lg border border-border/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold">Productos</span>
              </div>
              {data.products.filter((p) => p.name.trim() !== '').map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.image && p.image.startsWith('http') && (
                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{p.name}</span>
                  </div>
                  {p.price && (
                    <span className="text-xs font-semibold">${parseFloat(p.price).toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
