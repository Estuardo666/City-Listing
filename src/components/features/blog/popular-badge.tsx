import { TrendingUp } from 'lucide-react'

type PopularBadgeProps = {
  viewCount?: number | null
  threshold?: number
}

export function PopularBadge({ viewCount, threshold = 100 }: PopularBadgeProps) {
  if (!viewCount || viewCount < threshold) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 px-2.5 py-1 text-xs font-semibold">
      <TrendingUp className="h-3 w-3" />
      Popular
    </span>
  )
}
