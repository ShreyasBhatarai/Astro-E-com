'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/contexts/CartContext'

export function CartIcon() {
  const { data: session } = useSession()
  const router = useRouter()
  const { getTotalItems } = useCart()
  
  const totalItems = getTotalItems()

  const handleCartClick = () => {
    // Allow guest users to view cart
    router.push('/cart')
  }

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-9 w-9 lg:h-10 lg:w-10 relative"
      onClick={handleCartClick}
    >
      <ShoppingCart className="h-4 w-4 lg:h-5 lg:w-5" />
      <span className="sr-only">Shopping Cart</span>
      {totalItems > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-astro-primary text-white font-normal rounded-full border-2 border-white"
        >
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </Button>
  )
}