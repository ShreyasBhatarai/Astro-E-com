'use client'

import React, { useState } from 'react'
import { ShoppingCart, Plus, Minus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/contexts/CartContext'
import { ProductWithDetails } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AddToCartButtonProps {
  product: ProductWithDetails
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showQuantity?: boolean
  className?: string
}

export function AddToCartButton({ 
  product, 
  variant = 'default', 
  size = 'default',
  showQuantity = false,
  className 
}: AddToCartButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { addItem, items } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const cartItem = items.find(item => item.productId === product.id)
  const isInCart = !!cartItem
  const isOutOfStock = product.stock === 0

  const handleAddToCart = async () => {
    if (isOutOfStock) return
    
    // For guest users, allow adding to cart without authentication
    // The cart context will handle guest cart storage
    // if (!session) {
    //   toast.info('Please sign in to add items to cart', {
    //     description: 'You will be redirected to the login page',
    //     action: {
    //       label: 'Sign In',
    //       onClick: () => router.push('/login')
    //     },
    //     duration: 4000,
    //   })
    //   
    //   // Redirect to login with return URL
    //   router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
    //   return
    // }
    
    setIsAdding(true)
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
        // Show success toast with animation
        toast.success(`${product.name} added to cart!`, {
          description: `${quantity} item${quantity > 1 ? 's' : ''} added`,
          action: {
            label: 'View Cart',
            onClick: () => window.location.href = '/cart'
          },
          duration: 3000,
        })
      }
      
      setJustAdded(true)
      setTimeout(() => setJustAdded(false), 2000)
    } catch (error) {
      // console.error('Error adding to cart:', error)
      toast.error('Failed to add item to cart', {
        description: 'Please try again',
        duration: 3000,
      })
    } finally {
      setIsAdding(false)
    }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  if (isOutOfStock) {
    return (
      <Button 
        variant="secondary" 
        size={size}
        disabled
        className={cn('w-full', className)}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Out of Stock
      </Button>
    )
  }

  if (showQuantity) {
    return (
      <div className="space-y-3">
        {/* Quantity Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Quantity:</span>
          <div className="flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-4 py-2 min-w-[3rem] text-center font-medium">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {quantity >= product.stock && (
            <span className="text-xs text-orange-600">
              Max available
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          variant={variant}
          size={size}
          className={cn('w-full', className)}
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding...
            </>
          ) : justAdded ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Added to Cart
            </>
          ) : isInCart ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              In Cart ({cartItem.quantity})
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isAdding}
      variant={variant}
      size={size}
      className={cn('w-full', className)}
    >
      {isAdding ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          Adding...
        </>
      ) : justAdded ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Added
        </>
      ) : isInCart ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          In Cart
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </>
      )}
    </Button>
  )
}