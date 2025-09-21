'use client'

import React from 'react'
import { Check, Clock, X, Truck, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types'
import { cn, formatDateTime } from '@/lib/utils'

interface OrderStatusTimelineProps {
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  className?: string
}

const statusConfig = {
  PENDING: {
    label: 'Order Placed',
    description: 'Your order has been received and is being processed',
    icon: Clock,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600'
  },
  PROCESSING: {
    label: 'Processing',
    description: 'Your order is being prepared for shipment',
    icon: Package,
    color: 'bg-blue-500',
    textColor: 'text-blue-600'
  },
  PACKAGED: {
    label: 'Packaged',
    description: 'Your order has been packaged and ready to ship',
    icon: Package,
    color: 'bg-purple-500',
    textColor: 'text-purple-600'
  },
  SHIPPED: {
    label: 'Shipped',
    description: 'Your order has been shipped and is on its way',
    icon: Truck,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-600'
  },
  DELIVERED: {
    label: 'Delivered',
    description: 'Your order has been successfully delivered',
    icon: Check,
    color: 'bg-green-500',
    textColor: 'text-green-600'
  },
  CANCELLED: {
    label: 'Cancelled',
    description: 'Your order has been cancelled',
    icon: X,
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },
  FAILED: {
    label: 'Failed',
    description: 'There was an issue with your order',
    icon: X,
    color: 'bg-red-500',
    textColor: 'text-red-600'
  },

}

const statusOrder: OrderStatus[] = ['PENDING', 'PROCESSING', 'PACKAGED', 'SHIPPED', 'DELIVERED']

export function OrderStatusTimeline({ status, createdAt, updatedAt, className }: OrderStatusTimelineProps) {
  const currentStatusIndex = statusOrder.indexOf(status)
  const isCompleted = status === 'DELIVERED'
  const isCancelled = status === 'CANCELLED' || status === 'FAILED'

  // Safe getter for status config with fallback
  const getStatusConfig = (status: OrderStatus) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  }

  const currentStatusConfig = getStatusConfig(status)

  const getEstimatedDelivery = () => {
    const deliveryDays = {
      PENDING: 5,
      PROCESSING: 4,
      PACKAGED: 3,
      SHIPPED: 2,
      DELIVERED: 0
    }
    
    const days = deliveryDays[status as keyof typeof deliveryDays] || 5
    if (days === 0) return null
    
    const deliveryDate = new Date(createdAt)
    deliveryDate.setDate(deliveryDate.getDate() + days)
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status */}
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-white',
          currentStatusConfig.color
        )}>
          {React.createElement(currentStatusConfig.icon, { className: 'h-4 w-4' })}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{currentStatusConfig.label}</h3>
            <Badge 
              variant={isCompleted ? 'default' : isCancelled ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated: {formatDateTime(updatedAt)}
          </p>
        </div>
      </div>

      {/* Simple Progress Bar */}
      {!isCancelled && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Order Progress</span>
            <span>{currentStatusIndex + 1} of {statusOrder.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStatusIndex + 1) / statusOrder.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pending</span>
            <span className="text-muted-foreground">Delivered</span>
          </div>
        </div>
      )}

      {/* Delivery Confirmation */}
      {isCompleted && (
        <div className="flex items-center gap-2 text-sm text-green-600 p-3 bg-green-50 rounded-lg">
          <Check className="h-4 w-4" />
          <span className="font-medium">Order delivered successfully on {formatDateTime(updatedAt)}</span>
        </div>
      )}

      {/* Cancellation/Failure Notice */}
      {isCancelled && (
        <div className="flex items-center gap-2 text-sm text-red-600 p-3 bg-red-50 rounded-lg">
          <X className="h-4 w-4" />
          <span className="font-medium">{currentStatusConfig.description}</span>
        </div>
      )}
    </div>
  )
}