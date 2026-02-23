import type { VenueCategory } from '@/types/venue'

type CategoryIconFallbackProps = {
  category: VenueCategory
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CategoryIconFallback({ 
  category, 
  size = 'md', 
  className = '' 
}: CategoryIconFallbackProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-lg',
    md: 'h-12 w-12 text-2xl',
    lg: 'h-16 w-16 text-3xl'
  }

  return (
    <div 
      className={`
        flex items-center justify-center rounded-full bg-gradient-to-br 
        from-accent to-secondary text-muted-foreground/40
        ${sizeClasses[size]} ${className}
      `}
    >
      <span className="font-bold">
        {category.icon || '🏬'}
      </span>
    </div>
  )
}
