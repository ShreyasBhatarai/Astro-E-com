'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCart } from '@/contexts/CartContext'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface CreateOrderData {
  firstName: string
  lastName: string
  phone: string
  email?: string
  address: string
  city: string
  district: string
  province: string
  orderNotes?: string
  paymentMethod?: 'COD'
}

export default function CheckoutPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { items, clearCart, getTotal } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (!session) {
      toast.info('Please sign in to proceed with checkout', {
        description: 'You will be redirected to the login page',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/login')
        },
        duration: 4000,
      })
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }
  }, [session, status, router])

  // Redirect if cart is empty
  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const handleOrderSubmit = async (data: CreateOrderData) => {
    setIsSubmitting(true)
    
    try {
      const orderData = {
        items: Array.isArray(items) ? items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          image: item.image,
          slug: item.slug
        })) : [],
        total: getTotal(),
        shipping: 0,
        paymentMethod: data.paymentMethod || 'COD' as const,
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          district: data.district,
          province: data.province
        },
        orderNotes: data.orderNotes
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        // Handle non-JSON responses (like HTML error pages)
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to create order')
        } else {
          throw new Error(`Server error: ${response.status}`)
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order')
      }

      // Clear cart and redirect to orders page
      await clearCart()
      
      toast.success('Order placed successfully! You can view your order in My Orders.')
      router.push('/orders')
      
    } catch (error) {
      // console.error('Error creating order:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!session) {
    return null
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart to proceed to checkout.
          </p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
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
          <a href="/cart">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order with cash on delivery
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <CheckoutForm 
            onSubmit={handleOrderSubmit}
            isLoading={isSubmitting}
          />
        </div>

        {/* Order Summary - Desktop */}
        <div className="hidden lg:block">
          <OrderSummary />
        </div>

        {/* Order Summary - Mobile */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                View Order Summary
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle>Order Summary</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <OrderSummary />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

    
    </div>
  )
}