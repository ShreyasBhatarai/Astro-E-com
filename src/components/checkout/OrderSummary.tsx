'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/contexts/CartContext'

export function OrderSummary() {
  const { items, getTotal } = useCart()
  const subtotal = getTotal()


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-3">
          {Array.isArray(items) && items.map(item => (
            <div key={item.productId} className="flex justify-between text-sm">
              <div className="flex-1">
                <p className="font-normal">{item.name}</p>
                <p className="text-muted-foreground font-normal">Qty: {item.quantity}</p>
              </div>
              <p className="font-normal">Rs. {item.price * item.quantity}</p>
            </div>
          ))}
        </div>

        <hr />

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-normal">
            <span>Subtotal</span>
            <span>Rs. {subtotal}</span>
          </div>
          <hr />
          <div className="flex justify-between font-normal text-lg">
            <span>Total</span>
            <span className="text-astro-primary">Rs. {subtotal}</span>
          </div>
          
          <p className="text-sm text-gray-600 font-normal mt-2">
            For shipping: Astronova team will contact you
          </p>
        </div>
      </CardContent>
    </Card>
  )
}