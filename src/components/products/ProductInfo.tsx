'use client'

import React, { useState } from 'react'
import { Heart, ShoppingCart, Minus, Plus, Star, Truck, Shield, RotateCcw, Zap, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ProductWithDetails } from '@/types'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface ProductInfoProps {
  product: ProductWithDetails
  className?: string
}

export function ProductInfo({ product, className }: ProductInfoProps) {
  const { data: session } = useSession()
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false)
  
  const { addItem } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const router = useRouter()

  const isProductInWishlist = isInWishlist(product.id)

  const handleAddToCart = async () => {
    // Check if user is authenticated
    if (!session) {
      toast.info('Please sign in to add items to cart', {
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
    
    setIsAddingToCart(true)
    try {
      const success = await addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
        image: product.images[0],
        slug: product.slug
      })
      
      if (success) {
        toast.success(`${product.name} added to cart!`, {
          description: `${quantity} item${quantity > 1 ? 's' : ''} added`,
          action: {
            label: 'View Cart',
            onClick: () => router.push('/cart')
          },
          duration: 3000,
        })
      } else {
        toast.error('Failed to add item to cart')
      }
    } catch (error) {
      toast.error('Failed to add item to cart')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    // Check if user is authenticated
    if (!session) {
      toast.info('Please sign in to proceed with purchase', {
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
    
    setIsBuyingNow(true)
    try {
      // Add to cart first
      const success = await addItem({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
        image: product.images[0],
        slug: product.slug
      })
      
      if (!success) {
        toast.error('Failed to add item to cart')
        return
      }
      
      // Navigate to checkout
      router.push('/checkout')
    } catch (error) {
      toast.error('Failed to proceed to checkout')
    } finally {
      setIsBuyingNow(false)
    }
  }

  const handleWishlistToggle = async () => {
    // Check if user is authenticated
    if (!session) {
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

  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  const isLowStock = product.stock > 0 && product.stock <= 5
  const isOutOfStock = product.stock === 0

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category */}
      <div>
        <span className="text-sm text-gray-500 uppercase tracking-wide font-medium">
          {product.category?.name || 'General'}
        </span>
      </div>

      {/* Product Name */}
      <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Rating & Reviews */}
      {(product.averageRating || 0) > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.floor(product.averageRating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {(product.averageRating || 0).toFixed(1)} ({product.reviewCount} reviews)
          </span>
        </div>
      )}

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-black">
            Rs. {product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xl text-gray-500 line-through">
              Rs. {product.originalPrice}
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="bg-red-100 text-red-700 text-sm font-medium px-2 py-1 rounded">
              {discountPercentage}% off
            </span>
          )}
        </div>
        {product.originalPrice && product.originalPrice > product.price && (
          <p className="text-sm text-gray-600">
            You save Rs. {product.originalPrice - product.price}
          </p>
        )}
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <Badge variant="destructive">Out of Stock</Badge>
        ) : isLowStock ? (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            Only {product.stock} left in stock
          </Badge>
        ) : (
          <Badge variant="default" className="bg-green-100 text-green-800">
            In Stock
          </Badge>
        )}
      </div>

      {/* Description Accordion */}
      {product.description && (
        <Collapsible open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 group">
              <h3 className="font-semibold text-gray-900 text-left">Description</h3>
              <ChevronDown className={cn(
                "h-4 w-4 text-gray-500 transition-transform duration-200",
                isDescriptionOpen && "rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 pb-1">
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Quantity Selector */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Quantity</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-none"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          {/* Buy Now Button - Primary Action */}
          <Button 
            className="w-full bg-astro-primary hover:bg-astro-primary-hover text-white h-12 text-base font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            disabled={isOutOfStock || isBuyingNow}
            onClick={handleBuyNow}
          >
            {isBuyingNow ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Buy Now
              </>
            )}
          </Button>

          {/* Add to Cart Button - Secondary Action */}
          <Button 
            variant="outline"
            className="w-full h-12 text-base font-semibold border-2 border-astro-primary text-astro-primary hover:bg-astro-primary hover:text-white transition-all duration-200 rounded-lg"
            disabled={isOutOfStock || isAddingToCart}
            onClick={handleAddToCart}
          >
            {isAddingToCart ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </>
            )}
          </Button>
        </div>
        
        {/* Wishlist Button */}
        <Button 
          variant="ghost" 
          className="w-full h-12 text-base font-medium border-2 border-astro-gray-200 hover:border-red-200 hover:bg-red-50 transition-all duration-200 rounded-lg"
          onClick={handleWishlistToggle}
          disabled={isAddingToWishlist}
        >
          <Heart 
            className={cn(
              "mr-2 h-5 w-5 transition-colors",
              isProductInWishlist 
                ? "text-red-500 fill-red-500" 
                : "text-astro-gray-600 hover:text-red-500"
            )} 
          />
          {isAddingToWishlist 
            ? 'Updating...' 
            : isProductInWishlist 
              ? 'Remove from Wishlist' 
              : 'Add to Wishlist'
          }
        </Button>
      </div>

      {/* Trust Indicators */}
      <div className="border-t pt-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="h-4 w-4" />
            <span>Fast Delivery</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Shield className="h-4 w-4" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <RotateCcw className="h-4 w-4" />
            <span>Easy Returns</span>
          </div>
        </div>
      </div>

      {/* Product Details */}
      {(product.brand || product.sku || product.weight) && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-lg">Product Details</h3>
          <dl className="space-y-4 text-sm">
            {product.brand && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <dt className="font-medium text-gray-900">Brand</dt>
                <dd className="text-gray-600 font-medium">{product.brand}</dd>
              </div>
            )}
            {product.sku && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <dt className="font-medium text-gray-900">SKU</dt>
                <dd className="text-gray-600 font-medium">{product.sku}</dd>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <dt className="font-medium text-gray-900">Weight</dt>
                <dd className="text-gray-600 font-medium">{product.weight}g</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}