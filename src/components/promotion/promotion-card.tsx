'use client'

import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface PromotionData {
  id: string
  title: string
  description: string
  image: string | null
  discount: string | null
  validFrom: Date
  validUntil: Date
  terms: string | null
  status: string
  featured: boolean
}

interface PromotionCardProps {
  promotion: PromotionData
}

export function PromotionCard({ promotion }: PromotionCardProps) {
  const now = new Date()
  const isActive = promotion.status === 'ACTIVE' && new Date(promotion.validUntil) >= now

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card">
      {promotion.image && (
        <div className="aspect-[2/1] overflow-hidden">
          <img
            src={promotion.image}
            alt={promotion.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {promotion.discount && (
              <Badge variant="secondary" className="mb-2 text-xs font-medium">
                {promotion.discount}
              </Badge>
            )}
            <h3 className="font-semibold text-sm">{promotion.title}</h3>
          </div>
          {isActive && (
            <Badge variant="default" className="shrink-0 text-[10px] bg-emerald-600">
              Activa
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {promotion.description}
        </p>
        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
          <span>{formatDate(promotion.validFrom)}</span>
          <span>-</span>
          <span>{formatDate(promotion.validUntil)}</span>
        </div>
        {promotion.terms && (
          <p className="text-[10px] text-muted-foreground mt-1 italic">
            {promotion.terms}
          </p>
        )}
      </div>
    </div>
  )
}
