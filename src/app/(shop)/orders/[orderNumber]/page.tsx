'use client'

import React, { useState, useEffect, use } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Package, MapPin, Phone, Mail, AlertCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

interface OrderPageProps {
  params: Promise<{
    orderNumber: string
  }>
}

export default function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderNumber = resolvedParams.orderNumber
        
        const response = await fetch(`/api/orders/${orderNumber}`)
        
        if (response.status === 401) {
          setError('Please login to view this order')
          setLoading(false)
          return
        }
        
        if (response.status === 404) {
          setError('Order not found')
          setLoading(false)
          return
        }
        
        if (!response.ok) {
          setError('Order not found')
          setLoading(false)
          return
        }
        
        const result = await response.json()
        if (result.success) {
          setOrder(result.data)
        } else {
          setError(result.message || 'Failed to fetch order')
        }
      } catch (error) {
        // console.error('Error fetching order:', error)
        setError('Failed to fetch order')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [resolvedParams.orderNumber, searchParams])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            Access Required
          </h2>
          <p className="text-muted-foreground mb-6">
            {error === 'Access token required' 
              ? 'Please open this link from your order confirmation page to view order details.'
              : error
            }
          </p>
          <Button asChild>
            <Link href="/orders">
              View All Orders
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            Order Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The order you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button asChild>
            <Link href="/orders">
              View All Orders
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
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Customer Information */}
      {order.user && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{order.user.name || order.shippingName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-medium">{order.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{order.shippingPhone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Status Timeline */}
          <OrderStatusTimeline
            status={order.status}
            createdAt={new Date(order.createdAt)}
            updatedAt={new Date(order.updatedAt)}
          />

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.orderItems?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {order.orderItems?.length > 0 ? (
                order.orderItems.map((item: any, index: number) => (
                  <div key={item.id}>
                    <div className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <Image
                          src={item.product?.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product?.name || 'Product'}
                          fill
                          className="object-cover rounded-md"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-lg">{item.product?.name || 'Unknown Product'}</h4>
                          <Badge variant="secondary" className="ml-2">
                            #{index + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.product?.category?.name || 'Unknown Category'}
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Unit Price</p>
                            <p className="font-medium text-sm npr-currency">{formatCurrency(item.price)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quantity</p>
                            <p className="font-medium text-sm">{item.quantity} pieces</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="font-bold text-lg text-primary npr-currency">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {index < order.orderItems.length - 1 && <div className="h-px bg-gray-100 my-4" />}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items found in this order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">
                  {order.shippingName}
                </p>
                <p>{order.shippingAddress}</p>
                <p>
                  {order.shippingCity}, {order.shippingDistrict}, {order.shippingProvince}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.shippingPhone}</span>
                </div>
                {order.user?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.user.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="npr-currency">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="text-green-600 font-medium">Free</span>
                  ) : (
                    <span className="npr-currency">{formatCurrency(order.shippingCost)}</span>
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="npr-currency">{formatCurrency(order.total)}</span>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Payment Method
                  </Badge>
                </div>
                <p className="text-sm font-medium">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground">
                  Pay when your order is delivered
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Reason */}
          {order.status === 'CANCELLED' && order.reason && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-red-600">Cancellation Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {order.reason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/products">
                    Continue Shopping
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/orders">
                    View All Orders
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}