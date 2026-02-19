'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

type Category = {
  name: string
  icon: string | null
  slug: string
  count: number
}

type HomeCategoriesGridProps = {
  categories: Category[]
}

const FALLBACK_EMOJIS: Record<string, string> = {
  restaurantes: '🍽️',
  cafeterías: '☕',
  cafeterias: '☕',
  bares: '🍺',
  conciertos: '🎵',
  música: '🎶',
  musica: '🎶',
  cultura: '🎭',
  hoteles: '🏨',
  tiendas: '🛍️',
  servicios: '🔧',
  deportes: '⚽',
  arte: '🎨',
  familia: '👨‍👩‍👧',
  naturaleza: '🌿',
  noche: '🌙',
  brunch: '🥞',
  rooftop: '🏙️',
}

function getCategoryEmoji(name: string, icon: string | null): string {
  if (icon && icon.length <= 4) return icon
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(FALLBACK_EMOJIS)) {
    if (key.includes(k)) return v
  }
  return '📍'
}

const BG_COLORS = [
  'bg-orange-100/80 dark:bg-orange-950/40 hover:bg-orange-200/70 dark:hover:bg-orange-900/50',
  'bg-sky-100/80 dark:bg-sky-950/40 hover:bg-sky-200/70 dark:hover:bg-sky-900/50',
  'bg-emerald-100/80 dark:bg-emerald-950/40 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/50',
  'bg-violet-100/80 dark:bg-violet-950/40 hover:bg-violet-200/70 dark:hover:bg-violet-900/50',
  'bg-rose-100/80 dark:bg-rose-950/40 hover:bg-rose-200/70 dark:hover:bg-rose-900/50',
  'bg-amber-100/80 dark:bg-amber-950/40 hover:bg-amber-200/70 dark:hover:bg-amber-900/50',
  'bg-teal-100/80 dark:bg-teal-950/40 hover:bg-teal-200/70 dark:hover:bg-teal-900/50',
  'bg-indigo-100/80 dark:bg-indigo-950/40 hover:bg-indigo-200/70 dark:hover:bg-indigo-900/50',
]

export function HomeCategoriesGrid({ categories }: HomeCategoriesGridProps) {
  if (categories.length === 0) return null

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">¿Qué buscas?</p>
          <h2 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">Explora por categoría</h2>
        </div>
        <Link
          href="/explorar"
          className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link
              href={`/explorar?q=${encodeURIComponent(cat.name)}`}
              className={`group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-200 hover:brightness-95 dark:hover:brightness-110 ${BG_COLORS[i % BG_COLORS.length]}`}
            >
              <span className="text-4xl leading-none sm:text-5xl">
                {getCategoryEmoji(cat.name, cat.icon)}
              </span>
              <span className="text-base font-bold text-foreground">{cat.name}</span>
              {cat.count > 0 && (
                <span className="text-xs font-medium text-foreground/50">{cat.count} lugares</span>
              )}
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="sm:hidden">
        <Link
          href="/explorar"
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground"
        >
          Ver todas las categorías <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}
