'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Package, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OrderCard } from '@/components/orders/OrderCard'
import { AuthenticatedOrdersPage } from '@/components/orders/AuthenticatedOrdersPage'
import { PageLoader } from '@/components/ui/loader'
import { OrderStatus } from '@/types'

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  createdAt: Date
  items: Array<{
    id: string
    quantity: number
    product: {
      id: string
      name: string
      images: string[]
      category: {
        name: string
      }
    }
  }>
}

export default function OrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [recentOrderNumbers, setRecentOrderNumbers] = useState<string[]>([])

  const handleSearch = async (searchPhone?: string) => {
    const phoneToSearch = searchPhone || phone
    if (!phoneToSearch.trim()) {
      setError('Please enter your phone number')
      return
    }

    setIsLoading(true)
    setError('')
    setHasSearched(true)

    try {
      const response = await fetch(`/api/orders?phone=${encodeURIComponent(phoneToSearch)}`)
      const result = await response.json()

      if (result.success) {
        setOrders(result.data)
        localStorage.setItem('order-phone', phoneToSearch)
      } else {
        setError(result.message || 'Failed to fetch orders')
        setOrders([])
      }
    } catch (error) {
      // Error fetching orders
      setError('Failed to fetch orders. Please try again.')
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // Load saved phone number and recent order numbers from localStorage
  useEffect(() => {
    if (session) return // Skip for authenticated users
    
    const savedPhone = localStorage.getItem('order-phone')
    if (savedPhone) {
      setPhone(savedPhone)
      handleSearch(savedPhone)
    }
    
    const recentOrders = JSON.parse(localStorage.getItem('recentOrderNumbers') || '[]')
    setRecentOrderNumbers(recentOrders)
  }, [session])

  // Show loading while session is being fetched
  if (status === 'loading') {
    return <PageLoader text="Loading..." />
  }

  // Show authenticated orders page for logged in users
  if (session) {
    return <AuthenticatedOrdersPage />
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          Track your orders and view order history
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Your Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Order Number or Phone Number
              </label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  type="text"
                  placeholder="Enter your order number (e.g., ORD-123456) or phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter either your order number or the phone number you used when placing your order
              </p>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {hasSearched && !isLoading && (
        <>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    No orders found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We couldn&apos;t find any orders matching your search. Please check your order number or try a different search.
                  </p>
                  <Button asChild>
                    <a href="/products">Start Shopping</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Searching for your orders...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders Quick Access */}
      {recentOrderNumbers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                Quick access to your recent orders:
              </p>
              <div className="flex flex-wrap gap-2">
                {recentOrderNumbers.map((orderNumber) => (
                  <Button
                    key={orderNumber}
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`/orders/${orderNumber}`}>
                      #{orderNumber}
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!hasSearched && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                Find Your Orders
              </h3>
              <p className="text-muted-foreground mb-6">
                Enter your order number or phone number to view your order history and track current orders.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}