export const RATING_OPTIONS = [
  { value: 4.5, label: '4.5+', stars: '★★★★★' },
  { value: 4, label: '4+', stars: '★★★★☆' },
  { value: 3, label: '3+', stars: '★★★☆☆' },
] as const

export const PRICE_RANGE_OPTIONS = [
  { value: '$', label: '$', description: 'Económico' },
  { value: '$$', label: '$$', description: 'Moderado' },
  { value: '$$$', label: '$$$', description: 'Premium' },
  { value: '$$$$', label: '$$$$', description: 'Lujo' },
] as const

export const FOOD_TYPE_OPTIONS = [
  'Comida tradicional lojana',
  'Comida rápida',
  'Italiana',
  'Mexicana',
  'Asiática',
  'Parrilladas',
  'Mariscos',
  'Cafetería',
] as const

export const EVENT_DATE_PRESETS = [
  { value: 'today', label: 'Hoy' },
  { value: 'tomorrow', label: 'Mañana' },
  { value: 'thisWeekend', label: 'Este fin de semana' },
  { value: 'thisWeek', label: 'Esta semana' },
  { value: 'thisMonth', label: 'Este mes' },
] as const

export const EVENT_TYPE_OPTIONS = [
  { value: 'conciertos', label: 'Conciertos', icon: '🎵' },
  { value: 'deportes', label: 'Deportes', icon: '⚽' },
  { value: 'cultura', label: 'Cultura', icon: '🎭' },
  { value: 'gastronomia', label: 'Gastronomía', icon: '🍽️' },
  { value: 'tecnologia', label: 'Tecnología', icon: '💻' },
  { value: 'negocios', label: 'Negocios', icon: '💼' },
] as const

export const FILTER_SERVICES = [
  'Delivery',
  'Reservaciones',
  'Parqueadero',
  'Pet Friendly',
  'Terraza',
  'WiFi',
  'Aire acondicionado',
  'Pago con tarjeta',
] as const
