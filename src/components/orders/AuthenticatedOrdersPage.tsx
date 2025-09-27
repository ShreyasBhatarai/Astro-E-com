'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageLoader } from '@/components/ui/loader'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import Link from 'next/link'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  reason?: string | null
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  // Cancellation UI state
  const [cancelOrderNumber, setCancelOrderNumber] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchOrders = async (pageArg = page, statusArg = activeStatus, limitArg = limit) => {
    if (!session) return

    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pageArg),
        limit: String(limitArg)
      })

      if (statusArg && statusArg !== 'ALL') params.append('status', statusArg)

      const response = await fetch(`/api/orders?${params.toString()}`)
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

  // Initialize from URL params
  useEffect(() => {
    const p = parseInt(searchParams.get('page') || '1')
    const l = parseInt(searchParams.get('limit') || '10')
    const s = (searchParams.get('status') || 'ALL').toUpperCase()
    setPage(Number.isNaN(p) ? 1 : p)
    setLimit(Number.isNaN(l) ? 10 : l)
    setActiveStatus(s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch and sync URL when dependencies change
  useEffect(() => {
    if (!session) return
    fetchOrders(page, activeStatus, limit)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (activeStatus && activeStatus !== 'ALL') params.set('status', activeStatus)
    else params.delete('status')
    const qs = params.toString()
    const url = qs ? `/orders?${qs}` : '/orders'
    router.replace(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, page, limit, activeStatus])

  const handleStatusChange = (status: string) => {
    setActiveStatus(status)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
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
                        {order.status === 'CANCELLED' && order.reason && (
                          <p className="text-sm text-red-600 font-normal">Reason: {order.reason}</p>
                        )}
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
                              onClick={() => {
                                setSelectedOrder(order)
                                setCancelOrderNumber(order.orderNumber)
                                setCancelReason('')
                                setIsReasonOpen(true)
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
            <div className="mt-8">
              <PaginationWithRows
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={limit}
                onPageChange={handlePageChange}
                onRowsChange={(rows) => { setLimit(rows); setPage(1) }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Two-step Cancel UI */}
      <Dialog open={isReasonOpen} onOpenChange={(open) => { if (!isCancelling) setIsReasonOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cancelOrderNumber ? `Cancel Order #${cancelOrderNumber}` : 'Cancel Order'}</DialogTitle>
            <DialogDescription>Please provide a reason (minimum 10 characters) for cancelling this order.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Please let us know why you're cancelling this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              disabled={isCancelling}
            />
            {cancelReason.trim().length > 0 && cancelReason.trim().length < 10 && (
              <p className="text-sm text-red-600">Reason must be at least 10 characters.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReasonOpen(false)} disabled={isCancelling}>Cancel</Button>
            <Button
              onClick={() => {
                if (cancelReason.trim().length < 10) return
                setIsReasonOpen(false)
                setIsConfirmOpen(true)
              }}
              disabled={isCancelling || cancelReason.trim().length < 10}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => { if (!isCancelling) setIsConfirmOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedOrder && (
                <div className="mt-2 space-y-1 text-sm">
                  <div><span className="font-medium">Order:</span> #{selectedOrder.orderNumber}</div>
                  <div><span className="font-medium">Current status:</span> {selectedOrder.status}</div>
                  <div><span className="font-medium">Total amount:</span> {formatCurrency(selectedOrder.total)}</div>
                  <div className="mt-2"><span className="font-medium">Reason:</span> {cancelReason}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} onClick={() => { setIsConfirmOpen(false); setIsReasonOpen(true) }}>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault()
                if (!cancelOrderNumber) return
                setIsCancelling(true)
                try {
                  const response = await fetch(`/api/orders/${cancelOrderNumber}/cancel`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: cancelReason.trim() })
                  })
                  const result = await response.json()
                  if (!response.ok || !result.success) {
                    throw new Error(result.error || 'Failed to cancel order')
                  }
                  toast.success(`Order #${cancelOrderNumber} has been cancelled successfully`)
                  setIsConfirmOpen(false)
                  setIsReasonOpen(false)
                  setCancelOrderNumber(null)
                  setSelectedOrder(null)
                  setCancelReason('')
                  fetchOrders(page, activeStatus, limit)
                } catch (err: any) {
                  toast.error(err?.message || 'Failed to cancel order')
                } finally {
                  setIsCancelling(false)
                }
              }}
              disabled={isCancelling || !cancelOrderNumber}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <span className="inline-flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Cancelling...</span>
              ) : (
                'Yes, Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
