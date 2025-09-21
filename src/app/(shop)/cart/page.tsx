'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, getTotalItems } = useCart()


  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-light text-muted-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6 font-light">
            Add some products to your cart to get started.
          </p>
          <Button asChild>
            <Link href="/categories">
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-light">Shopping Cart</h1>
          <p className="text-muted-foreground font-light">
            {getTotalItems()} item{getTotalItems() !== 1 ? 's' : ''} in your cart
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={item.image || '/placeholder.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover rounded-md"
                      sizes="80px"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm leading-tight mb-1">
                          <Link 
                            href={`/products/${item.slug}`}
                            className="hover:text-primary transition-colors"
                          >
                            {item.name}
                          </Link>
                        </h3>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(item.price)}
                        </p>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-sm text-muted-foreground">Quantity:</span>
                      <div className="flex items-center border rounded-md">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="px-3 py-1 min-w-[2rem] text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span>Subtotal ({getTotalItems()} items)</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-center text-sm text-muted-foreground">
                
                <span>Astronova team will contact you shortly for shipping price and details</span>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(getTotal())}</span>
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
                <Link href="/categories">
                  Continue Shopping
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}