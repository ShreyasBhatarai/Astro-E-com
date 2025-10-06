'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ShoppingCart, RefreshCw, Eye, Search } from 'lucide-react'
import Link from 'next/link'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: Date
  user: {
    name: string
    email: string
    phone: string | null
  }
  orderItems: Array<{
    quantity: number
    product: {
      name: string
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchOrders = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) {
        setIsRefreshing(true)
      } else {
        setLoading(true)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter
      })
      if (search) params.set('search', search)

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch orders')

      const data: OrdersResponse = await response.json()
      setOrders(data.data)
      setPagination(data.pagination)
    } catch (error) {
      // console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, limit, search])

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false) // Don't show loading for auto-refresh
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [page, statusFilter, limit])



  const handleManualRefresh = () => {
    fetchOrders(true) // Show loading for manual refresh
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PACKAGED: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      FAILED: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
            <p className="text-muted-foreground mt-2">Manage customer orders and track fulfillment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="!bg-gray-50 !border-0 shadow-none">
        <CardContent className="pt-6 ">
          <div className="flex flex-row gap-4 items-center justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders by number, name, email, or phone..."
                  value={search}
                  onChange={(e) => { setPage(1); setSearch(e.target.value) }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PACKAGED">Packaged</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>

        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading orders..." className="py-8" />
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No orders found</h3>
              <p className="text-muted-foreground">
                {statusFilter !== 'all'
                  ? 'Try adjusting the status filter.'
                  : 'No orders have been placed yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Order ID</th>
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Items</th>
                      <th className="text-left p-4 font-medium">Total</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">#{order.orderNumber}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{order.user.name}</div>
                            <div className="text-sm text-muted-foreground">{order.user.email}</div>
                            {order.user.phone && (
                              <div className="text-sm text-muted-foreground">{order.user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{formatCurrency(order.total)}</span>
                        </td>

                        <td className="p-4">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), "do MMMM, h:mm a")}
                          </div>
                        </td>
                        <td className="p-4">
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <PaginationWithRows
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={limit}
                  onPageChange={(newPage) => setPage(newPage)}
                  onRowsChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}