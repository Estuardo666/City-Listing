'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Music, MapPin, Calendar, Coffee, Utensils, Heart, Star } from 'lucide-react'

interface SearchChip {
  id: string
  label: string
  query: string
  icon: React.ReactNode
  color: string
}

// Búsquedas populares y sugeridas
const SEARCH_CHIPS: SearchChip[] = [
  {
    id: '1',
    label: 'Música en vivo',
    query: 'música en vivo',
    icon: <Music className="h-3 w-3" />,
    color: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
  },
  {
    id: '2',
    label: 'Donde festejar',
    query: 'donde festejar',
    icon: <Calendar className="h-3 w-3" />,
    color: 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:hover:bg-pink-900/50'
  },
  {
    id: '3',
    label: 'Romántico',
    query: 'romántico',
    icon: <Heart className="h-3 w-3" />,
    color: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
  },
  {
    id: '4',
    label: 'Comida',
    query: 'donde comer',
    icon: <Utensils className="h-3 w-3" />,
    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:hover:bg-orange-900/50'
  },
  {
    id: '5',
    label: 'Café',
    query: 'cafetería',
    icon: <Coffee className="h-3 w-3" />,
    color: 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
  },
  {
    id: '6',
    label: 'Centro',
    query: 'centro ciudad',
    icon: <MapPin className="h-3 w-3" />,
    color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
  },
  {
    id: '7',
    label: 'Populares',
    query: 'populares',
    icon: <Star className="h-3 w-3" />,
    color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:hover:bg-yellow-900/50'
  },
  {
    id: '8',
    label: 'Trending',
    query: 'trending',
    icon: <TrendingUp className="h-3 w-3" />,
    color: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
  }
]

interface SearchChipsProps {
  onSelectQuery: (query: string) => void
}

export function SearchChips({ onSelectQuery }: SearchChipsProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Búsquedas populares</span>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {SEARCH_CHIPS.map((chip, index) => (
          <motion.button
            key={chip.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectQuery(chip.query)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${chip.color}`}
          >
            {chip.icon}
            <span>{chip.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
