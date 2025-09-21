'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Search, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { ProductPagination } from '@/components/ui/product-pagination'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  orderItems: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
      slug: string
    }
  }>
}

interface OrdersResponse {
  success: boolean
  data: Order[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

const ORDER_STATUSES = [
  { value: 'ALL', label: 'All Orders', color: 'bg-gray-100 text-gray-800' },
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'PROCESSING', label: 'Processing', color: 'bg-orange-100 text-orange-800' },
  { value: 'PACKAGED', label: 'Packaged', color: 'bg-blue-100 text-blue-800' },
  { value: 'SHIPPED', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'FAILED', label: 'Failed', color: 'bg-gray-100 text-gray-800' }
]

export function AuthenticatedOrdersPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchOrders = async (page = 1, search = '', status = 'ALL') => {
    if (!session) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (search) params.append('search', search)
      if (status && status !== 'ALL') params.append('status', status)

      const response = await fetch(`/api/orders?${params}`)
      const result: OrdersResponse = await response.json()

      if (result.success) {
        setOrders(result.data)
        setPagination(result.pagination)
      } else {
        // Failed to fetch orders
      }
    } catch (error) {
      // Error fetching orders
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchOrders(1, searchQuery, activeStatus)
    }
  }, [session, activeStatus])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(1, searchQuery, activeStatus)
  }

  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    setSearchQuery('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, searchQuery, activeStatus)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0]
    return (
      <Badge className={`${statusConfig.color} font-normal`}>
        {statusConfig.label}
      </Badge>
    )
  }

  if (isLoading && orders.length === 0) {
    return <PageLoader text="Loading your orders..." />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-normal mb-2">My Orders</h1>
        <p className="text-muted-foreground font-normal">
          Track your orders and view order history
        </p>
      </div>

      {/* Search Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search by order number or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="font-normal"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="font-normal">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="mb-6">
        <div className="flex overflow-x-auto scrollbar-hide pb-2 space-x-2">
          {ORDER_STATUSES.map((status) => (
            <Button
              key={status.value}
              variant={activeStatus === status.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleStatusChange(status.value)}
              className={`
                flex-shrink-0 font-normal text-sm px-4 py-2 rounded-full transition-all
                ${activeStatus === status.value 
                  ? 'bg-astro-primary text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }
              `}
            >
              {status.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-normal">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-normal text-muted-foreground mb-2">
                  {activeStatus === 'ALL' ? 'No orders yet' : `No ${ORDER_STATUSES.find(s => s.value === activeStatus)?.label.toLowerCase()} orders`}
                </h3>
                <p className="text-muted-foreground mb-6 font-normal">
                  {activeStatus === 'ALL' 
                    ? "Start shopping to see your orders here."
                    : `You don't have any ${ORDER_STATUSES.find(s => s.value === activeStatus)?.label.toLowerCase()} orders.`
                  }
                </p>
                <Button asChild className="font-normal">
                  <Link href="/products">Start Shopping</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Orders Count */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-normal">
                {pagination.total} order{pagination.total !== 1 ? 's' : ''} found
              </h2>
            </div>

            {/* Orders Grid */}
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-normal text-lg">#{order.orderNumber}</h3>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Placed on {format(new Date(order.createdAt), 'PPP')}
                        </p>
                        <p className="text-sm text-muted-foreground font-normal">
                          {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-normal text-lg">{formatCurrency(order.total)}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button asChild variant="outline" className="font-normal">
                            <Link href={`/orders/${order.orderNumber}`}>
                              View Details
                            </Link>
                          </Button>
                              {order.status === 'PENDING' && (
                                <Button 
                                  variant="outline" 
                                  className="font-normal border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={async () => {
                                    const reason = prompt('Please provide a reason for cancelling this order:')
                                    if (reason && reason.trim()) {
                                      try {
                                        const response = await fetch(`/api/orders/${order.orderNumber}/cancel`, {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ reason: reason.trim() })
                                        })
                                        const result = await response.json()
                                        if (result.success) {
                                          alert('Order cancelled successfully')
                                          fetchOrders(pagination.page, searchQuery, activeStatus)
                                        } else {
                                          alert('Failed to cancel order')
                                        }
                                      } catch (error) {
                                        alert('Failed to cancel order')
                                      }
                                    } else if (reason !== null) {
                                      alert('Cancellation reason is required')
                                    }
                                  }}
                                >
                                  Cancel Order
                                </Button>
                              )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <ProductPagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit || 10}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </div>
        )}
      </div>
    </div>
  )
}