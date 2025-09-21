'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { OrderWithDetails, OrderStatus } from '@/types'
import { Eye, Package } from 'lucide-react'
import Link from 'next/link'

interface RecentOrdersTableProps {
  orders: OrderWithDetails[]
  isLoading?: boolean
}

const statusColors = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [OrderStatus.PACKAGED]: 'bg-purple-100 text-purple-800',
  [OrderStatus.SHIPPED]: 'bg-indigo-100 text-indigo-800',
  [OrderStatus.DELIVERED]: 'bg-green-100 text-green-800',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [OrderStatus.FAILED]: 'bg-gray-100 text-gray-800',
}

export function RecentOrdersTable({ orders, isLoading }: RecentOrdersTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground">
              Orders will appear here once customers start placing them.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.shippingName}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.shippingPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[order.status]}>
                      {order.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(order.total))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View order</span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">#{order.orderNumber}</div>
                <Badge className={statusColors[order.status]}>
                  {order.status.toLowerCase()}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="font-medium">{order.shippingName}</div>
                <div className="text-sm text-muted-foreground">
                  {order.shippingPhone}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{formatCurrency(Number(order.total))}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/orders/${order.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View order</span>
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* View All Orders Link */}
        <div className="mt-4 text-center">
          <Button variant="outline" asChild>
            <Link href="/admin/orders">
              View All Orders
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}