'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Music, MapPin, Calendar, Coffee, Utensils, Heart, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchChip {
  id: string
  label: string
  query: string
  icon: React.ReactNode
  color: string
}

// Búsquedas populares y sugeridas con UI mejorada para modo claro y oscuro
const SEARCH_CHIPS: SearchChip[] = [
  {
    id: '1',
    label: 'Restaurante',
    query: 'restaurante',
    icon: <Utensils className="h-3.5 w-3.5" />,
    color: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 dark:hover:bg-orange-500/20'
  },
  {
    id: '2',
    label: 'Concierto',
    query: 'concierto',
    icon: <Music className="h-3.5 w-3.5" />,
    color: 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20 dark:hover:bg-purple-500/20'
  },
  {
    id: '3',
    label: 'Discoteca',
    query: 'discoteca',
    icon: <Star className="h-3.5 w-3.5" />,
    color: 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20 dark:hover:bg-pink-500/20'
  },
  {
    id: '4',
    label: 'Cafetería',
    query: 'cafetería',
    icon: <Coffee className="h-3.5 w-3.5" />,
    color: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20'
  },
  {
    id: '5',
    label: 'Festival',
    query: 'festival',
    icon: <Calendar className="h-3.5 w-3.5" />,
    color: 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/20'
  },
  {
    id: '6',
    label: 'Centro',
    query: 'centro',
    icon: <MapPin className="h-3.5 w-3.5" />,
    color: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 dark:hover:bg-blue-500/20'
  },
  {
    id: '7',
    label: 'Bar',
    query: 'bar',
    icon: <Heart className="h-3.5 w-3.5" />,
    color: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20'
  },
  {
    id: '8',
    label: 'Hotel',
    query: 'hotel',
    icon: <TrendingUp className="h-3.5 w-3.5" />,
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20'
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
      
      <div className="flex flex-wrap gap-2">
        {SEARCH_CHIPS.map((chip, index) => (
          <motion.button
            key={chip.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelectQuery(chip.query)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95",
              chip.color
            )}
          >
            {chip.icon}
            <span>{chip.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
