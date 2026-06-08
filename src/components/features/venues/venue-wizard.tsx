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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MediaUrlInput } from '@/components/features/media/media-url-input'
import { Plus, Trash2, Check, MapPin, Clock, Utensils, Package, Info } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { VenueCategory } from '@/types/venue'

const LocationPickerMap = dynamic(
  () => import('@/components/features/map/location-picker-map').then((mod) => mod.LocationPickerMap),
  { ssr: false }
)

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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
  categoryId: string
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
    categoryId: '',
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

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === data.categoryId),
    [categories, data.categoryId]
  )

  const isGastronomic = useMemo(() => {
    if (!selectedCategory) return false
    return GASTRONOMIC_CATEGORY_SLUGS.includes(selectedCategory.slug)
  }, [selectedCategory])

  const handleComplete = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const input: VenueCompleteInput = {
        basic: {
          name: data.name,
          description: data.description,
          content: data.content || null,
          image: data.image || null,
          categoryId: data.categoryId,
          priceRange: data.priceRange || null,
        },
        location: {
          location: data.location,
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
      description: 'Datos principales de tu local',
      icon: <Info className="h-5 w-5" />,
      isValid: data.name.length >= 3 && data.description.length >= 10 && data.categoryId !== '',
      content: (
        <StepBasicInfo
          data={data}
          categories={categories}
          onChange={updateField}
        />
      ),
    },
    {
      id: 'location',
      title: 'Ubicación y Horarios',
      description: 'Dirección, contacto y horarios de atención',
      icon: <MapPin className="h-5 w-5" />,
      isValid: data.location.length >= 3,
      content: (
        <StepLocationHours
          data={data}
          onChange={updateField}
        />
      ),
    },
    {
      id: 'services',
      title: 'Servicios y Amenities',
      description: '¿Qué ofrece tu local?',
      icon: <Clock className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepServices
          data={data}
          onChange={updateField}
        />
      ),
    },
    {
      id: 'menu',
      title: isGastronomic ? 'Menú y Productos' : 'Productos',
      description: isGastronomic
        ? 'Agrega las categorías de tu menú y productos destacados'
        : 'Agrega los productos o servicios que ofreces',
      icon: <Utensils className="h-5 w-5" />,
      isValid: true,
      content: (
        <StepMenuProducts
          data={data}
          isGastronomic={isGastronomic}
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
        <StepSummary
          data={data}
          categories={categories}
          isGastronomic={isGastronomic}
        />
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
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="name">Nombre del local *</Label>
          <WizardTooltip content="El nombre de tu negocio como lo conocen tus clientes. Aparecerá en búsquedas y en la ficha pública." />
        </div>
        <Input
          id="name"
          placeholder="Ej: Café Loja"
          value={data.name}
          onChange={(e) => onChange('name', e.target.value)}
          maxLength={120}
        />
        {data.name.length > 0 && data.name.length < 3 && (
          <p className="text-xs text-destructive">El nombre debe tener al menos 3 caracteres</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="category">Categoría *</Label>
            <WizardTooltip content="Selecciona la categoría que mejor describe tu negocio. Esto ayuda a los clientes a encontrarte." />
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
            <Label htmlFor="priceRange">Rango de precios</Label>
            <WizardTooltip content="Indica el nivel de precios de tu local. Esto ayuda a los clientes a saber qué esperar." />
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

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="description">Descripción corta *</Label>
          <WizardTooltip content="Una descripción breve de tu local que aparecerá en las tarjetas de búsqueda. Máximo 800 caracteres." />
        </div>
        <Textarea
          id="description"
          placeholder="Describe tu local en pocas palabras..."
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          maxLength={800}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">{data.description.length}/800 caracteres</p>
        {data.description.length > 0 && data.description.length < 10 && (
          <p className="text-xs text-destructive">La descripción debe tener al menos 10 caracteres</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="content">Contenido detallado (opcional)</Label>
          <WizardTooltip content="Información adicional sobre tu local: historia, filosofía, especialidades, etc. Aparecerá en la página de detalle." />
        </div>
        <Textarea
          id="content"
          placeholder="Cuenta la historia de tu local, qué lo hace especial..."
          value={data.content}
          onChange={(e) => onChange('content', e.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label>Imagen destacada</Label>
          <WizardTooltip content="URL de la imagen principal de tu local. Esta imagen aparecerá en las tarjetas de búsqueda y en la parte superior de tu ficha." />
        </div>
        <MediaUrlInput
          label=""
          value={data.image}
          onChange={(v) => onChange('image', v)}
          onBlur={() => {}}
          name="image"
          placeholder="https://..."
        />
      </div>
    </div>
  )
}

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
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Ubicación y contacto</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="location">Ubicación / Barrio *</Label>
            <WizardTooltip content="El barrio o zona donde se encuentra tu local. Ej: Centro histórico de Loja" />
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
            <WizardTooltip content="La dirección completa de tu local: calle, número, referencias." />
          </div>
          <Input
            id="address"
            placeholder="Ej: Calle Bolívar 10-25, Loja"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              placeholder="Ej: +593 7 2571234"
              value={data.phone}
              onChange={(e) => onChange('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contacto@local.com"
              value={data.email}
              onChange={(e) => onChange('email', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            placeholder="https://misitio.com"
            value={data.website}
            onChange={(e) => onChange('website', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Ubicación en el mapa</Label>
            <WizardTooltip content="Haz clic en el mapa para marcar la ubicación exacta de tu local. Esto ayuda a los clientes a encontrarte fácilmente." />
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Horarios de atención</h3>
          <WizardTooltip content="Configura los horarios de tu local. Puedes agregar múltiples franjas horarias por día (ej: mañana y tarde). Si algún día está cerrado, márcalo como cerrado." />
        </div>

        <div className="space-y-3">
          {data.businessHours.map((day, dayIdx) => (
            <div key={dayIdx} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm w-24">{DAY_LABELS[dayIdx]}</span>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`closed-${dayIdx}`}
                      checked={day.isClosed}
                      onCheckedChange={() => toggleClosed(dayIdx)}
                    />
                    <Label htmlFor={`closed-${dayIdx}`} className="text-xs text-muted-foreground cursor-pointer">
                      Cerrado
                    </Label>
                  </div>
                </div>
                <div className="flex gap-1">
                  {!day.isClosed && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => addSlot(dayIdx)}>
                      <Plus className="h-3 w-3 mr-1" /> Horario
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => applyToAll(dayIdx)}>
                    Aplicar a todos
                  </Button>
                </div>
              </div>

              {!day.isClosed && day.slots.length > 0 && (
                <div className="p-3 space-y-2">
                  {day.slots.map((slot, slotIdx) => (
                    <div key={slotIdx} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.openTime}
                        onChange={(e) => updateSlot(dayIdx, slotIdx, 'openTime', e.target.value)}
                        className="w-28 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">a</span>
                      <Input
                        type="time"
                        value={slot.closeTime}
                        onChange={(e) => updateSlot(dayIdx, slotIdx, 'closeTime', e.target.value)}
                        className="w-28 text-sm"
                      />
                      {day.slots.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => removeSlot(dayIdx, slotIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!day.isClosed && day.slots.length === 0 && (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  Sin horarios definidos. Agrega uno o marca como cerrado.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

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
          Selecciona los servicios que ofrece tu local. Esto ayuda a los clientes a saber qué esperar.
        </p>
        <div className="grid gap-2">
          {PREDEFINED_SERVICES.map((ps) => {
            const active = data.selectedServices.has(ps.name)
            return (
              <button
                key={ps.name}
                type="button"
                onClick={() => toggleService(ps.name)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
                  active
                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                    : 'bg-card border-border/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ps.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{ps.name}</p>
                    <p className="text-xs text-muted-foreground">{ps.description}</p>
                  </div>
                </div>
                {active && <Check className="h-5 w-5 text-emerald-600" />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Servicios personalizados</h3>
        {data.customServices.length > 0 && (
          <div className="grid gap-2">
            {data.customServices.map((cs, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cs.icon || '✨'}</span>
                  <div>
                    <p className="text-sm font-medium">{cs.name}</p>
                    {cs.description && <p className="text-xs text-muted-foreground">{cs.description}</p>}
                  </div>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => removeCustomService(idx)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {showCustomForm ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border/60 p-4">
            <div className="grid grid-cols-[56px_1fr] gap-2">
              <Input
                placeholder="✨"
                value={customForm.icon}
                onChange={(e) => setCustomForm((p) => ({ ...p, icon: e.target.value }))}
                className="text-center text-sm"
                maxLength={4}
              />
              <Input
                placeholder="Nombre del servicio *"
                value={customForm.name}
                onChange={(e) => setCustomForm((p) => ({ ...p, name: e.target.value }))}
                className="text-sm"
              />
            </div>
            <Input
              placeholder="Descripción (opcional)"
              value={customForm.description}
              onChange={(e) => setCustomForm((p) => ({ ...p, description: e.target.value }))}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addCustomService} disabled={!customForm.name.trim()}>
                <Check className="h-4 w-4 mr-1" /> Agregar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowCustomForm(false); setCustomForm({ name: '', description: '', icon: '' }) }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowCustomForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar servicio personalizado
          </Button>
        )}
      </div>
    </div>
  )
}

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
              <Utensils className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Menú / Carta</h3>
              <WizardTooltip content="Organiza tu menú por categorías (Ej: Entradas, Platos fuertes, Bebidas). Cada categoría puede tener múltiples items con nombre, descripción, precio e imagen." />
            </div>
            <Button variant="outline" size="sm" onClick={addMenuCategory} className="gap-2">
              <Plus className="h-4 w-4" /> Categoría
            </Button>
          </div>

          {data.menuCategories.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
              <Utensils className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Aún no hay categorías en el menú</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Agrega categorías como &quot;Entradas&quot;, &quot;Platos fuertes&quot;, &quot;Bebidas&quot;</p>
            </div>
          )}

          {data.menuCategories.map((cat, catIdx) => (
            <div key={catIdx} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/30">
                <button type="button" onClick={() => toggleExpand(catIdx)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-sm">{expandedCats.has(catIdx) ? '▼' : '▶'}</span>
                  <Input
                    placeholder="Nombre de la categoría (ej: Platos fuertes)"
                    value={cat.name}
                    onChange={(e) => updateMenuCategory(catIdx, 'name', e.target.value)}
                    className="max-w-xs text-sm font-medium bg-transparent border-none p-0 h-auto focus-visible:ring-0"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs text-muted-foreground">({cat.items.length})</span>
                </button>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => addMenuItem(catIdx)}>
                    <Plus className="h-3 w-3 mr-1" /> Item
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => removeMenuCategory(catIdx)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>

              {expandedCats.has(catIdx) && (
                <div className="p-3 space-y-3">
                  {cat.items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Sin items. Agrega platos, bebidas, etc.
                    </p>
                  )}
                  {cat.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="rounded-lg border border-border/40 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Nombre del item *"
                            value={item.name}
                            onChange={(e) => updateMenuItem(catIdx, itemIdx, 'name', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Descripción (opcional)"
                            value={item.description}
                            onChange={(e) => updateMenuItem(catIdx, itemIdx, 'description', e.target.value)}
                            className="text-sm"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Precio"
                              type="number"
                              value={item.price}
                              onChange={(e) => updateMenuItem(catIdx, itemIdx, 'price', e.target.value)}
                              className="text-sm"
                              min="0"
                              step="0.01"
                            />
                            <Input
                              placeholder="URL imagen (opcional)"
                              value={item.image}
                              onChange={(e) => updateMenuItem(catIdx, itemIdx, 'image', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={() => removeMenuItem(catIdx, itemIdx)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{isGastronomic ? 'Productos destacados' : 'Productos'}</h3>
            <WizardTooltip content="Agrega los productos o servicios principales que ofreces. Cada producto puede tener nombre, descripción, precio e imagen." />
          </div>
          <Button variant="outline" size="sm" onClick={addProduct} className="gap-2">
            <Plus className="h-4 w-4" /> Producto
          </Button>
        </div>

        {data.products.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
            <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Aún no hay productos</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Agrega los productos o servicios que ofreces</p>
          </div>
        )}

        {data.products.map((product, idx) => (
          <div key={idx} className="rounded-lg border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-xs font-medium text-muted-foreground">Producto {idx + 1}</span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => removeProduct(idx)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
            <Input
              placeholder="Nombre del producto *"
              value={product.name}
              onChange={(e) => updateProduct(idx, 'name', e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Descripción (opcional)"
              value={product.description}
              onChange={(e) => updateProduct(idx, 'description', e.target.value)}
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Precio"
                type="number"
                value={product.price}
                onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                className="text-sm"
                min="0"
                step="0.01"
              />
              <Input
                placeholder="URL imagen (opcional)"
                value={product.image}
                onChange={(e) => updateProduct(idx, 'image', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepSummary({
  data,
  categories,
  isGastronomic,
}: {
  data: VenueWizardData
  categories: VenueCategory[]
  isGastronomic: boolean
}) {
  const category = categories.find((c) => c.id === data.categoryId)
  const selectedServiceNames = Array.from(data.selectedServices)
  const activeHours = data.businessHours.filter((d) => !d.isClosed && d.slots.length > 0)
  const closedDays = data.businessHours.filter((d) => d.isClosed)

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          Revisa la información antes de enviar. Una vez registrado, tu local será revisado antes de publicarse.
        </p>
      </div>

      <SummarySection title="Información Básica">
        <SummaryItem label="Nombre" value={data.name} />
        <SummaryItem label="Categoría" value={category ? `${category.icon} ${category.name}` : '-'} />
        <SummaryItem label="Rango de precios" value={data.priceRange || 'No especificado'} />
        <SummaryItem label="Descripción" value={data.description} />
        {data.content && <SummaryItem label="Contenido" value={data.content} />}
        {data.image && <SummaryItem label="Imagen" value="Configurada ✓" />}
      </SummarySection>

      <SummarySection title="Ubicación y Contacto">
        <SummaryItem label="Ubicación" value={data.location} />
        {data.address && <SummaryItem label="Dirección" value={data.address} />}
        {data.phone && <SummaryItem label="Teléfono" value={data.phone} />}
        {data.email && <SummaryItem label="Email" value={data.email} />}
        {data.website && <SummaryItem label="Web" value={data.website} />}
        {data.lat && data.lng && <SummaryItem label="Mapa" value={`${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`} />}
      </SummarySection>

      <SummarySection title="Horarios de Atención">
        {activeHours.length > 0 ? (
          <div className="space-y-1">
            {activeHours.map((day) => (
              <div key={day.dayOfWeek} className="flex items-center gap-2 text-sm">
                <span className="font-medium w-24">{DAY_LABELS[day.dayOfWeek]}</span>
                <span className="text-muted-foreground">
                  {day.slots.map((s) => `${s.openTime} - ${s.closeTime}`).join(', ')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No configurados</p>
        )}
        {closedDays.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Cerrado: {closedDays.map((d) => DAY_LABELS[d.dayOfWeek]).join(', ')}
          </p>
        )}
      </SummarySection>

      <SummarySection title="Servicios">
        {selectedServiceNames.length > 0 || data.customServices.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedServiceNames.map((name) => {
              const ps = PREDEFINED_SERVICES.find((s) => s.name === name)
              return (
                <span key={name} className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium">
                  {ps?.icon} {name}
                </span>
              )
            })}
            {data.customServices.map((cs, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium">
                {cs.icon || '✨'} {cs.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Ninguno seleccionado</p>
        )}
      </SummarySection>

      {isGastronomic && data.menuCategories.length > 0 && (
        <SummarySection title="Menú">
          {data.menuCategories.map((cat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-sm font-medium">{cat.name || `Categoría ${idx + 1}`}</p>
              {cat.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-center gap-2 text-sm text-muted-foreground pl-4">
                  <span>{item.name}</span>
                  {item.price && <span className="font-medium">${parseFloat(item.price).toFixed(2)}</span>}
                </div>
              ))}
            </div>
          ))}
        </SummarySection>
      )}

      {data.products.length > 0 && (
        <SummarySection title="Productos">
          <div className="space-y-1">
            {data.products.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{p.name}</span>
                {p.price && <span className="text-muted-foreground">${parseFloat(p.price).toFixed(2)}</span>}
              </div>
            ))}
          </div>
        </SummarySection>
      )}
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
