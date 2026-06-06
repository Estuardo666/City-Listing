'use client'

import { useState } from 'react'

interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}

const SIZES = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

export function StarRatingInput({ value, onChange, size = 'md', disabled = false }: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverValue || value)
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => !disabled && setHoverValue(0)}
            className={`${SIZES[size]} ${disabled ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
          >
            <svg
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className={`w-full h-full ${
                filled ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
              }`}
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </button>
        )
      })}
    </div>
  )
}

interface StarRatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export function StarRatingDisplay({ rating, count, size = 'sm', showCount = true }: StarRatingDisplayProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.round(rating)
          const half = !filled && star - 0.5 <= rating
          return (
            <svg
              key={star}
              viewBox="0 0 24 24"
              fill={filled ? 'currentColor' : half ? 'url(#half)' : 'none'}
              stroke="currentColor"
              strokeWidth={1.5}
              className={`${SIZES[size]} ${
                filled || half ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'
              }`}
            >
              {half && (
                <defs>
                  <linearGradient id="half">
                    <stop offset="50%" stopColor="currentColor" />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              )}
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          )
        })}
      </div>
      <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted-foreground">({count})</span>
      )}
    </div>
  )
}
