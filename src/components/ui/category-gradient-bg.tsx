import { cn } from '@/lib/utils'

type CategoryGradientBgProps = {
  categorySlug?: string | null
  name?: string
  showInitials?: boolean
  className?: string
  initialsClassName?: string
}

const GRADIENT_MAP: Record<string, { from: string; via?: string; to: string }> = {
  // Food & Drink
  restaurante:     { from: '#f97316', via: '#ef4444', to: '#dc2626' },
  comida:          { from: '#f97316', via: '#ef4444', to: '#dc2626' },
  food:            { from: '#f97316', via: '#ef4444', to: '#dc2626' },
  cafe:            { from: '#92400e', via: '#a16207', to: '#ca8a04' },
  coffee:          { from: '#92400e', via: '#a16207', to: '#ca8a04' },
  cafeteria:       { from: '#92400e', via: '#a16207', to: '#ca8a04' },
  bar:             { from: '#7c3aed', via: '#6d28d9', to: '#4c1d95' },
  pub:             { from: '#7c3aed', via: '#6d28d9', to: '#4c1d95' },
  cerveza:         { from: '#d97706', via: '#b45309', to: '#92400e' },
  beer:            { from: '#d97706', via: '#b45309', to: '#92400e' },
  pizzeria:        { from: '#dc2626', via: '#b91c1c', to: '#991b1b' },
  pizza:           { from: '#dc2626', via: '#b91c1c', to: '#991b1b' },
  sushi:           { from: '#0891b2', via: '#0e7490', to: '#155e75' },
  heladeria:       { from: '#ec4899', via: '#db2777', to: '#be185d' },
  ice:             { from: '#ec4899', via: '#db2777', to: '#be185d' },
  panaderia:       { from: '#a16207', via: '#854d0e', to: '#713f12' },
  bakery:          { from: '#a16207', via: '#854d0e', to: '#713f12' },
  // Accommodation
  hotel:           { from: '#0d9488', via: '#0f766e', to: '#115e59' },
  hostal:          { from: '#0d9488', via: '#0f766e', to: '#115e59' },
  hospedaje:       { from: '#0d9488', via: '#0f766e', to: '#115e59' },
  // Health
  farmacia:        { from: '#16a34a', via: '#15803d', to: '#166534' },
  clinica:         { from: '#2563eb', via: '#1d4ed8', to: '#1e40af' },
  salud:           { from: '#2563eb', via: '#1d4ed8', to: '#1e40af' },
  health:          { from: '#2563eb', via: '#1d4ed8', to: '#1e40af' },
  hospital:        { from: '#dc2626', via: '#b91c1c', to: '#991b1b' },
  dentist:         { from: '#06b6d4', via: '#0891b2', to: '#0e7490' },
  dental:          { from: '#06b6d4', via: '#0891b2', to: '#0e7490' },
  veterinaria:     { from: '#059669', via: '#047857', to: '#065f46' },
  vet:             { from: '#059669', via: '#047857', to: '#065f46' },
  // Shopping
  tienda:          { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  shop:            { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  market:          { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  mercado:         { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  ropa:            { from: '#a855f7', via: '#9333ea', to: '#7e22ce' },
  clothes:         { from: '#a855f7', via: '#9333ea', to: '#7e22ce' },
  belleza:         { from: '#ec4899', via: '#db2777', to: '#be185d' },
  beauty:          { from: '#ec4899', via: '#db2777', to: '#be185d' },
  // Services
  banco:           { from: '#1e40af', via: '#1e3a8a', to: '#172554' },
  bank:            { from: '#1e40af', via: '#1e3a8a', to: '#172554' },
  gasolinera:      { from: '#ea580c', via: '#c2410c', to: '#9a3412' },
  gas:             { from: '#ea580c', via: '#c2410c', to: '#9a3412' },
  taller:          { from: '#57534e', via: '#44403c', to: '#292524' },
  auto:            { from: '#57534e', via: '#44403c', to: '#292524' },
  car:             { from: '#57534e', via: '#44403c', to: '#292524' },
  // Entertainment
  cine:            { from: '#dc2626', via: '#9333ea', to: '#4c1d95' },
  cinema:          { from: '#dc2626', via: '#9333ea', to: '#4c1d95' },
  teatro:          { from: '#9333ea', via: '#7c3aed', to: '#6d28d9' },
  theater:         { from: '#9333ea', via: '#7c3aed', to: '#6d28d9' },
  musica:          { from: '#e11d48', via: '#be123c', to: '#9f1239' },
  music:           { from: '#e11d48', via: '#be123c', to: '#9f1239' },
  concierto:       { from: '#e11d48', via: '#be123c', to: '#9f1239' },
  deporte:         { from: '#059669', via: '#047857', to: '#065f46' },
  sports:          { from: '#059669', via: '#047857', to: '#065f46' },
  gym:             { from: '#dc2626', via: '#b91c1c', to: '#991b1b' },
  // Culture & Education
  arte:            { from: '#d946ef', via: '#c026d3', to: '#a21caf' },
  art:             { from: '#d946ef', via: '#c026d3', to: '#a21caf' },
  cultura:         { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  libreria:        { from: '#0369a1', via: '#075985', to: '#0c4a6e' },
  book:            { from: '#0369a1', via: '#075985', to: '#0c4a6e' },
  escuela:         { from: '#0284c7', via: '#0369a1', to: '#075985' },
  school:          { from: '#0284c7', via: '#0369a1', to: '#075985' },
  // Nature & Outdoor
  parque:          { from: '#16a34a', via: '#15803d', to: '#166534' },
  park:            { from: '#16a34a', via: '#15803d', to: '#166534' },
  // Events
  evento:          { from: '#f97316', via: '#ea580c', to: '#c2410c' },
  festival:        { from: '#e11d48', via: '#f97316', to: '#eab308' },
  feria:           { from: '#0891b2', via: '#0284c7', to: '#0369a1' },
  expo:            { from: '#6366f1', via: '#4f46e5', to: '#4338ca' },
  taller_event:    { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  workshop:        { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },
  reunion:         { from: '#0ea5e9', via: '#0284c7', to: '#0369a1' },
  meet:            { from: '#0ea5e9', via: '#0284c7', to: '#0369a1' },
}

const FALLBACK_GRADIENTS = [
  { from: '#6366f1', via: '#4f46e5', to: '#4338ca' },  // indigo
  { from: '#8b5cf6', via: '#7c3aed', to: '#6d28d9' },  // violet
  { from: '#0ea5e9', via: '#0284c7', to: '#0369a1' },  // sky
  { from: '#14b8a6', via: '#0d9488', to: '#0f766e' },  // teal
  { from: '#f97316', via: '#ea580c', to: '#c2410c' },  // orange
  { from: '#e11d48', via: '#be123c', to: '#9f1239' },  // rose
]

function getGradient(slug?: string | null): { from: string; via?: string; to: string } {
  if (slug) {
    const normalized = slug.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    if (GRADIENT_MAP[normalized]) return GRADIENT_MAP[normalized]
    for (const [key, value] of Object.entries(GRADIENT_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) return value
    }
  }
  let hash = 0
  const s = slug ?? 'default'
  for (let i = 0; i < s.length; i++) hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0
  return FALLBACK_GRADIENTS[Math.abs(hash) % FALLBACK_GRADIENTS.length]
}

function getInitials(name?: string): string {
  if (!name) return ''
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ''
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

export function CategoryGradientBg({
  categorySlug,
  name,
  showInitials = false,
  className,
  initialsClassName,
}: CategoryGradientBgProps) {
  const g = getGradient(categorySlug)
  const via = g.via ? `, ${g.via}` : ''
  const initials = getInitials(name)

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ background: `linear-gradient(135deg, ${g.from}${via}, ${g.to})` }}
    >
      {showInitials && initials && (
        <span
          className={cn(
            'font-medium text-white/25 select-none',
            initialsClassName
          )}
        >
          {initials}
        </span>
      )}
    </div>
  )
}
