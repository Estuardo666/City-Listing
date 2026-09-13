import {
  Baby,
  Building2,
  Camera,
  Coffee,
  Dumbbell,
  Heart,
  Landmark,
  Laptop,
  Leaf,
  MapPin,
  Music2,
  Trees,
  Users,
  Utensils,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DiscoveryIconName = 'Baby' | 'Building2' | 'Camera' | 'Coffee' | 'Dumbbell' | 'Heart' | 'Landmark' | 'Laptop' | 'Leaf' | 'MapPin' | 'Music2' | 'Trees' | 'Users' | 'Utensils'

const categoryRules: Array<[RegExp, DiscoveryIconName]> = [
  [/cafe|café|panader/i, 'Coffee'],
  [/restaur|comida|gastronom|cocina/i, 'Utensils'],
  [/música|musica|concierto|festival|teatro|cultura|arte|museo/i, 'Landmark'],
  [/parque|naturaleza|sender|mirador|aire.libre/i, 'Trees'],
  [/deporte|fútbol|futbol|gimnasio|cancha/i, 'Dumbbell'],
  [/famil|niñ/i, 'Baby'],
  [/bar|discoteca|noche|coctel/i, 'Music2'],
  [/hotel|alojamiento|hostal/i, 'Building2'],
]

export function categoryIconFor(name: string, slug: string) {
  const value = `${name} ${slug}`
  return categoryRules.find(([pattern]) => pattern.test(value))?.[1] ?? 'MapPin'
}

export function DiscoveryIcon({
  lifestyleIcon,
  category,
  className,
}: {
  lifestyleIcon?: string
  category?: { name: string; slug: string }
  className?: string
}) {
  const iconName = lifestyleIcon
    ? lifestyleIcon
    : category
      ? categoryIconFor(category.name, category.slug)
      : 'MapPin'

  const props = { 'aria-hidden': true as const, className: cn('h-5 w-5', className), strokeWidth: 1.8 }
  switch (iconName) {
    case 'Baby': return <Baby {...props} />
    case 'Building2': return <Building2 {...props} />
    case 'Camera': return <Camera {...props} />
    case 'Coffee': return <Coffee {...props} />
    case 'Dumbbell': return <Dumbbell {...props} />
    case 'Heart': return <Heart {...props} />
    case 'Landmark': return <Landmark {...props} />
    case 'Laptop': return <Laptop {...props} />
    case 'Leaf': return <Leaf {...props} />
    case 'Music2': return <Music2 {...props} />
    case 'Trees': return <Trees {...props} />
    case 'Users': return <Users {...props} />
    case 'Utensils': return <Utensils {...props} />
    default: return <MapPin {...props} />
  }
}
