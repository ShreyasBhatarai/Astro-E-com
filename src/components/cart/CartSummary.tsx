'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

interface CartSummaryProps {
  className?: string
}

export function CartSummary({ className }: CartSummaryProps) {
  const { items } = useCart()
  
  const itemCount = items.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0)


  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Your cart is empty
          </p>
          <Button asChild className="w-full">
            <Link href="/products">
              Browse Products
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span className="npr-currency">{formatCurrency(cartTotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span className="text-astro-primary text-sm font-medium">Astronova team will contact you shortly</span>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="npr-currency">{formatCurrency(cartTotal)}</span>
          </div>
        </div>

        {/* Proceed to Checkout */}
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">
            Proceed to Checkout
          </Link>
        </Button>

        {/* Continue Shopping */}
        <Button variant="outline" asChild className="w-full">
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}