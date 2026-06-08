'use client'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number | null
  image: string | null
  isAvailable: boolean
}

interface MenuCategory {
  id: string
  name: string
  items: MenuItem[]
}

interface MenuDisplayProps {
  menu: MenuCategory[]
}

export function MenuDisplay({ menu }: MenuDisplayProps) {
  if (menu.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5">
      <h2 className="text-lg font-medium text-foreground mb-4">🍽️ Menú</h2>
      <div className="space-y-6">
        {menu.map((cat) => (
          <div key={cat.id}>
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-3">{cat.name}</h3>
            <div className="space-y-3">
              {cat.items.filter((i) => i.isAvailable).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                  </div>
                  {item.price !== null && (
                    <span className="text-sm font-semibold text-foreground shrink-0">${item.price.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
