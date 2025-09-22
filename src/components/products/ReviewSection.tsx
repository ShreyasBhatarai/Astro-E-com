'use client'

import React, { useState } from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ReviewWithUser } from '@/types'
import { RatingStars } from './RatingStars'
import { ReviewForm } from './ReviewForm'
import { cn } from '@/lib/utils'

interface ReviewSectionProps {
  reviews: ReviewWithUser[]
  averageRating: number
  totalReviews: number
  productId: string
  className?: string
}

export function ReviewSection({ reviews, averageRating, totalReviews, productId, className }: ReviewSectionProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReviewSubmitted = () => {
    setRefreshKey(prev => prev + 1)
    // Trigger a page refresh to show the new review
    window.location.reload()
  }

  // Calculate adaptive scroll area height based on number of reviews
  const getScrollAreaHeight = () => {
    const reviewCount = displayedReviews.length
    const maxHeight = 400 // Maximum height in pixels
    const minHeight = 120 // Minimum height for empty state
    const reviewCardHeight = 120 // Approximate height per review card
    
    if (reviewCount === 0) return minHeight
    
    const calculatedHeight = reviewCount * reviewCardHeight
    return Math.min(calculatedHeight, maxHeight)
  }

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter(review => review.rating === rating).length / totalReviews) * 100 : 0
  }))

  // Show reviews in newest first order
  const displayedReviews = reviews.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (reviews.length === 0) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No reviews yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Be the first to review this product!
          </p>
        </div>
        
        {/* Review Form */}
        <div className="mt-8">
          <ReviewForm productId={productId} onReviewSubmitted={handleReviewSubmitted} />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Review Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Customer Reviews</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <RatingStars rating={averageRating} size="lg" />
                <p className="text-sm text-muted-foreground mt-2">
                  Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Reviews List */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Reviews ({totalReviews})</h3>
        </CardHeader>
        <CardContent>
          <ScrollArea 
            className="pr-4" 
            style={{ height: `${getScrollAreaHeight()}px` }}
          >
            <div className="space-y-4">
              {displayedReviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                  <div className="space-y-4">
                    {/* Review Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {getInitials(review.user.name || 'User')}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{review.user.name}</p>
                          <div className="flex items-center gap-2">
                            <RatingStars rating={review.rating} size="sm" />
                            <span className="text-sm text-muted-foreground">
                              {formatDate(review.createdAt.toString())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review Content */}
                    {review.comment && (
                      <p className="text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {displayedReviews.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Review Form */}
      <div className="mt-8">
        <ReviewForm productId={productId} onReviewSubmitted={handleReviewSubmitted} />
      </div>

      {/* Load More Reviews */}
      {displayedReviews.length < reviews.length && (
        <div className="text-center mt-8">
          <Button variant="outline">
            Load More Reviews
          </Button>
        </div>
      )}
    </div>
  )
}