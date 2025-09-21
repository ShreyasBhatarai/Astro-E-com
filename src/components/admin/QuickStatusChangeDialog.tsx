'use client'

import { useState } from 'react'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { OrderStatus } from '@/types'

interface QuickStatusChangeDialogProps {
  orderId: string
  currentStatus: OrderStatus
  newStatus: OrderStatus
  trigger: React.ReactNode
  onSuccess?: () => void
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
  return labels[status] || status
}

export function QuickStatusChangeDialog({ 
  orderId, 
  currentStatus, 
  newStatus, 
  trigger, 
  onSuccess 
}: QuickStatusChangeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleConfirmUpdate = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`Order status updated to ${getStatusLabel(newStatus)}`)
        onSuccess?.()
        // Close dialog only on success
        setIsOpen(false)
      } else {
        throw new Error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      // console.error('Error updating order status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
      // Don't close dialog on error - let user try again or cancel manually
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    if (!isUpdating) {
      setIsOpen(false)
    }
  }

  // Prevent opening dialog when disabled by updating state
  const handleOpenChange = (open: boolean) => {
    if (!isUpdating) {
      setIsOpen(open)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to change the order status from{' '}
            <strong>{getStatusLabel(currentStatus)}</strong> to{' '}
            <strong>{getStatusLabel(newStatus)}</strong>?
            <br />
            This action will notify the customer via email.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmUpdate} disabled={isUpdating}>
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isUpdating ? 'Updating...' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}