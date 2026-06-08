import { getBadgeInfo, type VenueBadgeType } from '@/lib/badges'
import { cn } from '@/lib/utils'

type VenueBadgeProps = {
  badge: VenueBadgeType
  className?: string
}

export function VenueBadge({ badge, className }: VenueBadgeProps) {
  const info = getBadgeInfo(badge)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        info.color,
        className
      )}
    >
      <span>{info.icon}</span>
      <span>{info.label}</span>
    </span>
  )
}

type VenueBadgesProps = {
  badges: VenueBadgeType[]
  className?: string
}

export function VenueBadges({ badges, className }: VenueBadgesProps) {
  if (badges.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map((badge) => (
        <VenueBadge key={badge} badge={badge} />
      ))}
    </div>
  )
}
