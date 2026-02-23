'use client'

import Link from 'next/link'
import { ArrowRight, Utensils, Coffee, Beer, Music, Palette, Bed, ShoppingBag, Wrench, Dumbbell, TreePine, Moon, Users, MapPin, Tent, Ticket, Landmark, type LucideIcon } from 'lucide-react'
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

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  restaurantes: Utensils,
  gastronomía: Utensils,
  cafeterías: Coffee,
  cafeterias: Coffee,
  bares: Beer,
  conciertos: Music,
  música: Music,
  musica: Music,
  cultura: Landmark,
  hoteles: Bed,
  tiendas: ShoppingBag,
  servicios: Wrench,
  deportes: Dumbbell,
  arte: Palette,
  familia: Users,
  naturaleza: TreePine,
  noche: Moon,
  brunch: Coffee,
  rooftop: Tent,
}

function CategoryIcon({ name, icon }: { name: string; icon: string | null }) {
  const key = name.toLowerCase()
  let IconComponent = MapPin

  for (const [k, v] of Object.entries(FALLBACK_ICONS)) {
    if (key.includes(k)) {
      IconComponent = v
      break
    }
  }

  return <IconComponent className="h-10 w-10 sm:h-12 sm:w-12 stroke-[1.5]" />
}

const BG_COLORS = [
  'bg-orange-500/10 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 hover:bg-orange-500/20',
  'bg-sky-500/10 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 hover:bg-sky-500/20',
  'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-500/20',
  'bg-violet-500/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 hover:bg-violet-500/20',
  'bg-rose-500/10 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-500/20',
  'bg-amber-500/10 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-500/20',
  'bg-teal-500/10 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 hover:bg-teal-500/20',
  'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-500/20',
]

export function HomeCategoriesGrid({ categories }: HomeCategoriesGridProps) {
  if (categories.length === 0) return null

  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">¿Qué buscas?</p>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Explora por categoría</h2>
          <p className="text-sm text-muted-foreground sm:text-base">Descubre lugares y eventos organizados por tipo</p>
        </div>
        <Link
          href="/explorar"
          className="hidden items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex"
        >
          Ver todo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Link
              href={`/explorar?q=${encodeURIComponent(cat.name)}`}
              className={`group flex flex-col items-center justify-center gap-3 rounded-3xl p-4 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-transparent hover:border-current/10 ${BG_COLORS[i % BG_COLORS.length]}`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                <CategoryIcon name={cat.name} icon={cat.icon} />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold text-foreground sm:text-base">{cat.name}</span>
                {cat.count > 0 && (
                  <span className="text-xs font-medium text-foreground/60">{cat.count} lugares</span>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="sm:hidden">
        <Link
          href="/explorar"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
        >
          Ver todas las categorías <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
