'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function RatingStars({ 
  rating, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  className 
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(newRating)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent, newRating: number) => {
    if (interactive && onRatingChange && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      onRatingChange(newRating)
    }
  }

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const rounded = Math.round(rating)
        const isFilled = star <= rounded

        return (
          <button
            key={star}
            type="button"
            className={cn(
              'relative transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            onClick={() => handleClick(star)}
            onKeyDown={(e) => handleKeyDown(e, star)}
            tabIndex={interactive ? 0 : -1}
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
            disabled={!interactive}
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                isFilled
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}