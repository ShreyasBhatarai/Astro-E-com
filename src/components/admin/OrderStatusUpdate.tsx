'use client'

import { useState } from 'react'
import { AdminOrderWithDetails, OrderStatus, UpdateOrderStatusData } from '@/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react'

interface OrderStatusUpdateProps {
  order: AdminOrderWithDetails
}

export function OrderStatusUpdate({ order }: OrderStatusUpdateProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [reason, setReason] = useState('')

  const getValidNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.PACKAGED, OrderStatus.CANCELLED, OrderStatus.FAILED],
      [OrderStatus.PACKAGED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.FAILED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.FAILED],
      [OrderStatus.DELIVERED]: [], // Final status
      [OrderStatus.CANCELLED]: [], // Final status
      [OrderStatus.FAILED]: [] // Final status
    }

    return validTransitions[currentStatus] || []
  }

  const validStatuses = getValidNextStatuses(order.status)
  const [newStatus, setNewStatus] = useState<OrderStatus>(validStatuses[0] || order.status)
  const requiresReason = newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.FAILED
  
  // Initialize showReasonInput based on initial newStatus
  const [showReasonInput, setShowReasonInput] = useState(requiresReason)

  const handleStatusChange = (status: OrderStatus) => {
    setNewStatus(status)
    setShowReasonInput(status === OrderStatus.CANCELLED || status === OrderStatus.FAILED)
    if (!requiresReason) {
      setReason('')
    }
  }

  const handleUpdateStatus = async () => {
    if (requiresReason && !reason.trim()) {
      toast.error('Please provide a reason for this status change')
      return
    }

    setIsLoading(true)
    try {
      const updateData: UpdateOrderStatusData = {
        status: newStatus,
        ...(newStatus === OrderStatus.CANCELLED && { cancellationReason: reason }),
        ...(newStatus === OrderStatus.FAILED && { failureReason: reason })
      }

      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Order status updated successfully')
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      // console.error('Error updating order status:', error)
      toast.error('An error occurred while updating the order status')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusDescription = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Order has been placed and is awaiting processing'
      case OrderStatus.PROCESSING:
        return 'Order is being prepared for shipment'
      case OrderStatus.PACKAGED:
        return 'Order has been packaged and is ready for shipping'
      case OrderStatus.SHIPPED:
        return 'Order has been shipped and is in transit'
      case OrderStatus.DELIVERED:
        return 'Order has been successfully delivered'
      case OrderStatus.CANCELLED:
        return 'Order has been cancelled'
      case OrderStatus.FAILED:
        return 'Order delivery has failed'
      default:
        return ''
    }
  }

  if (validStatuses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-600">This order has reached its final status.</p>
            <p className="text-sm text-gray-500 mt-1">
              {getStatusDescription(order.status)}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="status">New Status</Label>
          <Select value={newStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {validStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusDescription(newStatus)}
          </p>
        </div>

        {showReasonInput && (
          <div>
            <Label htmlFor="reason">
              {newStatus === OrderStatus.CANCELLED ? 'Cancellation Reason' : 'Failure Reason'} *
            </Label>
            <Textarea
              id="reason"
              placeholder={`Please provide a reason for ${newStatus.toLowerCase()} this order...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-600 mt-1">
              This reason will be visible to the customer and help improve our service.
            </p>
          </div>
        )}

        {(newStatus === OrderStatus.CANCELLED || newStatus === OrderStatus.FAILED) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Changing the status to {newStatus.toLowerCase()} will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Restore the product stock levels</li>
                <li>Notify the customer about the status change</li>
                <li>Record the reason in the order history</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleUpdateStatus} 
          disabled={isLoading || (requiresReason && !reason.trim())}
          className="w-full"
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Update Status
        </Button>
      </CardContent>
    </Card>
  )
}