'use client'

import type { MenuItem as PrismaMenuItem } from '@prisma/client'

interface DisplayMenuItem extends Pick<PrismaMenuItem, 'id' | 'name' | 'description' | 'price' | 'image' | 'isAvailable' | 'isFeatured'> {}

interface MenuCategory {
  id: string
  name: string
  items: DisplayMenuItem[]
}

interface MenuDisplayV2Props {
  menu: MenuCategory[]
  className?: string
}

export function MenuDisplayV2({ menu, className = '' }: MenuDisplayV2Props) {
  if (menu.length === 0) return null

  return (
    <div className={className}>
      <h2 className="text-lg font-medium text-foreground mb-4">🍽️ Menú</h2>
      <div className="space-y-6">
        {menu.map((cat) => {
          const availableItems = cat.items.filter((i) => i.isAvailable)
          const unavailableItems = cat.items.filter((i) => !i.isAvailable)
          if (availableItems.length === 0 && unavailableItems.length === 0) return null

          return (
            <div key={cat.id}>
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat.name}</h3>
              <div className="space-y-3">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border/30 bg-card p-3">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        {item.isFeatured && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            ⭐ Popular
                          </span>
                        )}
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    </div>
                    {item.price !== null && (
                      <span className="text-sm font-semibold text-foreground shrink-0">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                ))}
                {unavailableItems.length > 0 && (
                  <div className="space-y-2 opacity-50">
                    {unavailableItems.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 line-through">
                        <p className="text-sm text-muted-foreground">{item.name}</p>
                        {item.price !== null && <span className="text-sm text-muted-foreground">${item.price.toFixed(2)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
