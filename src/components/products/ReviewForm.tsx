'use client'

import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReviewFormProps {
  productId: string
  onReviewSubmitted: () => void
}

export function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast.error('Please sign in to write a review')
      return
    }

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (!comment.trim()) {
      toast.error('Please write a comment')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating,
          comment: comment.trim(),
        }),
      })

      if (response.ok) {
        toast.success('Review submitted successfully!')
        setRating(0)
        setComment('')
        onReviewSubmitted()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to submit review')
      }
    } catch (error) {
      // console.error('Error submitting review:', error)
      toast.error('Failed to submit review')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!session) {
    return (
      <Card className="border-astro-gray-200">
        <CardContent className="py-8 text-center">
          <p className="text-astro-gray-600 mb-4">
            Please sign in to write a review for this product.
          </p>
          <Button asChild className="bg-astro-primary hover:bg-astro-primary-hover">
            <a href="/login">Sign In</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-astro-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-astro-gray-900">
          Write a Review
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="text-sm font-medium text-astro-gray-900 mb-2 block">
              Rating *
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 rounded-sm hover:bg-astro-gray-50 transition-colors"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-astro-gray-300 hover:text-yellow-200'
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-astro-gray-600">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>


          {/* Comment */}
          <div>
            <Label htmlFor="review-comment" className="text-sm font-medium text-astro-gray-900">
              Your Review *
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="mt-1 border-astro-gray-200 focus:border-astro-primary focus:ring-astro-primary min-h-[120px] resize-none"
              maxLength={1000}
              required
            />
            <div className="mt-1 text-xs text-astro-gray-500 text-right">
              {comment.length}/1000 characters
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || !comment.trim()}
            className="w-full bg-astro-primary hover:bg-astro-primary-hover text-white font-semibold py-2.5 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}