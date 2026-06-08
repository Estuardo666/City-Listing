'use client'

import { Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  price: number | null
  image: string | null
  isAvailable: boolean
  isFeatured: boolean
}

interface ProductsDisplayProps {
  products: Product[]
  className?: string
}

export function ProductsDisplay({ products, className = '' }: ProductsDisplayProps) {
  if (products.length === 0) return null

  const availableProducts = products.filter((p) => p.isAvailable)
  const unavailableProducts = products.filter((p) => !p.isAvailable)

  return (
    <div className={className}>
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <h2 className="text-lg font-medium text-foreground flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary" /> Productos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availableProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-background p-3 transition-colors hover:bg-accent/40"
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  {product.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
                )}
              </div>
              {product.price !== null && (
                <span className="text-sm font-semibold text-foreground shrink-0">${product.price.toFixed(2)}</span>
              )}
            </div>
          ))}
        </div>

        {unavailableProducts.length > 0 && (
          <div className="mt-4 space-y-2 opacity-50">
            {unavailableProducts.map((product) => (
              <div key={product.id} className="flex items-start justify-between gap-3 line-through">
                <p className="text-sm text-muted-foreground">{product.name}</p>
                {product.price !== null && (
                  <span className="text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
