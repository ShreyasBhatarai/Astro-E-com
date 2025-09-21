'use client'

import { useState } from 'react'
import { AdminOrderWithDetails, AdminOrderFilters, OrderStatus } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, ShoppingCart, User, Phone, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'
import { QuickStatusChangeDialog } from '@/components/admin/QuickStatusChangeDialog'
import { PageLoader } from '@/components/ui/loader'

interface OrdersTableProps {
  orders: AdminOrderWithDetails[]
  pagination: any
  loading?: boolean
}

export function OrdersTable({ orders, pagination, loading = false }: OrdersTableProps) {

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'PACKAGED': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'FAILED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      'PENDING': 'PROCESSING',
      'PROCESSING': 'PACKAGED',
      'PACKAGED': 'SHIPPED',
      'SHIPPED': 'DELIVERED',
      'DELIVERED': null,
      'CANCELLED': null,
      'FAILED': null
    }
    return statusFlow[currentStatus]
  }

  const getStatusLabel = (status: OrderStatus): string => {
    const labels: Record<OrderStatus, string> = {
      'PENDING': 'Pending',
      'PROCESSING': 'Processing',
      'PACKAGED': 'Packaged',
      'SHIPPED': 'Shipped',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'FAILED': 'Failed'
    }
    return labels[status]
  }

  const handleStatusChangeSuccess = () => {
    // Refresh the page to show updated data
    window.location.reload()
  }

  const getPaymentMethodBadge = (method: string) => {
    return method === 'ONLINE' 
      ? <Badge className="bg-green-100 text-green-800">Online</Badge>
      : <Badge className="bg-blue-100 text-blue-800">COD</Badge>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <PageLoader />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
        <p className="text-gray-600">Orders will appear here when customers place them.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">


      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="font-medium text-gray-900">
                    #{order.orderNumber}
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{order.shippingName}</div>
                      <div className="text-sm text-gray-600">{order.user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{order.shippingPhone}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                  {(order.cancellationReason || order.failureReason) && (
                    <div className="text-xs text-red-600 mt-1">
                      {order.cancellationReason || order.failureReason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {getPaymentMethodBadge(order.paymentMethod)}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-gray-900">
                    {formatCurrency(Number(order.total))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-900">
                    {formatDateTime(order.createdAt)}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      
                      {getNextStatus(order.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <QuickStatusChangeDialog
                            orderId={order.id}
                            currentStatus={order.status}
                            newStatus={getNextStatus(order.status)!}
                            onSuccess={handleStatusChangeSuccess}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Mark as {getStatusLabel(getNextStatus(order.status)!)}
                              </DropdownMenuItem>
                            }
                          />
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden p-4 space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">#{order.orderNumber}</h3>
                <p className="text-sm text-gray-600">
                  {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                </p>
              </div>
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{order.shippingName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">{order.shippingPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Payment:</span>
                {getPaymentMethodBadge(order.paymentMethod)}
              </div>
            </div>

            {(order.cancellationReason || order.failureReason) && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                <strong>Reason:</strong> {order.cancellationReason || order.failureReason}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">
                  {formatCurrency(Number(order.total))}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDateTime(order.createdAt)}
                </div>
              </div>
              <Link href={`/admin/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200">
        <PaginationWithRows
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => {
            const url = new URL(window.location.href)
            url.searchParams.set('page', page.toString())
            window.location.href = url.toString()
          }}
          onRowsChange={(rows) => {
            const url = new URL(window.location.href)
            url.searchParams.set('limit', rows.toString())
            url.searchParams.set('page', '1')
            window.location.href = url.toString()
          }}
        />
      </div>
    </div>
  )
}