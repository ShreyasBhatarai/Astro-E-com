'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Package, Calendar, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import { OrderStatus } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface OrderCardProps {
  order: {
    id: string
    orderNumber: string
    status: OrderStatus
    total: number
    createdAt: Date
    items?: Array<{
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
    orderItems?: Array<{
      id: string
      quantity: number
      product: {
        id: string
        name: string
        images: string[]
        slug: string
      }
    }>
  }
  className?: string
  onOrderUpdate?: () => void
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  PROCESSING: 'bg-purple-100 text-purple-800 border-purple-200',
  PACKAGED: 'bg-orange-100 text-orange-800 border-orange-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200'
}

export function OrderCard({ order, className, onOrderUpdate }: OrderCardProps) {
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  // Handle both items and orderItems for compatibility
  const orderItems = order.items || order.orderItems || []
  const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const firstItem = orderItems[0]
  const hasMultipleItems = orderItems.length > 1
  const canCancel = order.status === 'PENDING'

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/orders/${order.orderNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason || 'Cancelled by customer'
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Order cancelled successfully')
        setIsCancelDialogOpen(false)
        setCancelReason('')
        onOrderUpdate?.()
      } else {
        toast.error(result.error || 'Failed to cancel order')
      }
    } catch (error) {
      // console.error('Error cancelling order:', error)
      toast.error('Failed to cancel order')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card className={cn('group hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Order #{order.orderNumber}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn('text-xs', statusColors[order.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200')}
          >
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Order Items Preview */}
        <div className="flex gap-3">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src={firstItem?.product.images[0] || '/placeholder-product.jpg'}
              alt={firstItem?.product.name || 'Product'}
              fill
              className="object-cover rounded-md"
              sizes="48px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight">
              {firstItem?.product.name}
            </h4>
            <p className="text-xs text-muted-foreground">
              {'category' in (firstItem?.product || {}) ? (firstItem?.product as any).category?.name : 'General'}
            </p>
            {hasMultipleItems && (
              <p className="text-xs text-muted-foreground mt-1">
                +{(order.items?.length || 0) - 1} more item{((order.items?.length || 0) - 1) !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="font-semibold text-lg text-primary">
            {formatCurrency(order.total)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
        <Button asChild variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Link href={`/orders/${order.orderNumber}`}>
            View Details
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
          
          {canCancel && (
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                setCancelReason('')
                setIsReasonOpen(true)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </div>
      </CardContent>

      {/* Reason Dialog */}
      <AlertDialog open={isReasonOpen} onOpenChange={(open) => { if (!isCancelling) setIsReasonOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancellation Reason</AlertDialogTitle>
            <AlertDialogDescription>Please provide a brief reason for cancelling this order.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please let us know why you're cancelling this order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                if (!cancelReason.trim()) return
                setIsReasonOpen(false)
                setIsConfirmOpen(true)
              }}
              disabled={isCancelling || !cancelReason.trim()}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={(open) => { if (!isCancelling) setIsConfirmOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order #{order.orderNumber}?
              {cancelReason.trim() && (
                <>
                  <br />
                  <span className="block mt-2">Reason: {cancelReason}</span>
                </>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                setIsConfirmOpen(false)
                setIsCancelDialogOpen(true)
                handleCancelOrder()
              }}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}