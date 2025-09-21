'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductWithDetails } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { useWishlist } from '@/contexts/WishlistContext'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface ProductCardProps {
  product: ProductWithDetails
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isProductInWishlist = isInWishlist(product.id)

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if session is still loading
    if (status === 'loading') {
      return
    }
    
    // Check if user is authenticated
    if (status === 'unauthenticated' || !session) {
      toast.info('Please sign in to add items to wishlist', {
        description: 'You will be redirected to the login page',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/login')
        },
        duration: 4000,
      })
      
      // Redirect to login with return URL
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }
    
    setIsAddingToWishlist(true)
    try {
      if (isProductInWishlist) {
        const success = await removeFromWishlist(product.id)
        if (success) {
          toast.success('Removed from wishlist')
        } else {
          toast.error('Failed to remove from wishlist')
        }
      } else {
        const success = await addToWishlist(product.id)
        if (success) {
          toast.success('Added to wishlist')
        } else {
          toast.error('Failed to add to wishlist')
        }
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsAddingToWishlist(false)
    }
  }

  return (
    <div className={cn('group relative bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden', className)}>
      <Link href={`/products/${product.slug}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="absolute top-0 left-0 z-10">
              <span className="bg-red-500 text-white text-sm font-normal px-2 py-2 rounded-br-lg">
                -{discountPercentage}%
              </span>
            </div>
          )}

          {/* Wishlist Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/90 hover:bg-white shadow-sm rounded-full transition-all"
            onClick={handleWishlistToggle}
          >
            <Heart 
              className={cn(
                'h-4 w-4 transition-colors',
                isProductInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-500'
              )} 
            />
          </Button>

          {/* Stock Badge */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-normal bg-black/60 px-3 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          {/* Category */}
          <span className="text-xs font-normal text-gray-500 uppercase tracking-wide">
            {product.category?.name || 'General'}
          </span>
          
          {/* Product Name */}
          <h3 className="font-normal text-gray-900 text-sm leading-snug line-clamp-2 text-wrap group-hover:text-astro-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < Math.round((product.averageRating ?? 0)!) 
                      ? 'fill-yellow-400 text-yellow-400' 
                      : 'text-gray-200'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400">
              ({product.reviewCount ?? 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg text-gray-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-400 line-through font-normal">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock > 0 && product.stock <= 5 && (
            <p className="text-xs text-orange-600 font-normal">
              Only {product.stock} left
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}