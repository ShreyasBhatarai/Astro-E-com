'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Trash2, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency } from '@/lib/utils'

interface CartItemProps {
  item: any
  className?: string
}

export function CartItem({ item, className }: CartItemProps) {
  const { removeItem, updateQuantity } = useCart()

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= item.product.stock) {
      updateQuantity(item.productId, newQuantity)
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Product Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={item.product.images[0] || '/placeholder-product.jpg'}
              alt={item.product.name}
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
                    href={`/products/${item.product.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {item.product.name}
                  </Link>
                </h3>
                <Badge variant="outline" className="text-xs mb-2">
                  {item.product.category.name}
                </Badge>
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
                  onClick={() => handleQuantityChange(item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-3 py-1 min-w-[2rem] text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(item.quantity + 1)}
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {item.quantity >= item.product.stock && (
                <span className="text-xs text-orange-600">
                  Max available
                </span>
              )}
            </div>

            {/* Stock Warning */}
            {item.product.stock <= 5 && item.product.stock > 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Only {item.product.stock} left in stock
              </p>
            )}
            {item.product.stock === 0 && (
              <p className="text-xs text-destructive mt-2">
                Out of stock
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}