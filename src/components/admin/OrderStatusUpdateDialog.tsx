'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { OrderStatus } from '@/types'

interface OrderStatusUpdateDialogProps {
  orderId: string
  currentStatus: OrderStatus
  onStatusChange?: (newStatus: OrderStatus) => void
}

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKAGED', label: 'Packaged' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'FAILED', label: 'Failed' }
]

export function OrderStatusUpdateDialog({ orderId, currentStatus, onStatusChange }: OrderStatusUpdateDialogProps) {
  const router = useRouter()
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [reason, setReason] = useState('')
  const [isReasonOpen, setIsReasonOpen] = useState(false)


  const handleStatusSelect = (status: OrderStatus) => {
    if (status === currentStatus) return
    setSelectedStatus(status)
    if (status === 'CANCELLED' || status === 'FAILED') {
      setReason('')
      setIsReasonOpen(true)
    } else {
      setIsDialogOpen(true)
    }
  }

  const handleConfirmUpdate = async () => {
    if (!selectedStatus) return

    // Require reason when cancelling or failing
    if ((selectedStatus === 'CANCELLED' || selectedStatus === 'FAILED') && !reason.trim()) {
      toast.error('Please provide a reason for this status change')
      setIsReasonOpen(true)
      return
    }

    setIsUpdating(true)
    try {
      const body: any = { status: selectedStatus }
      if (selectedStatus === 'CANCELLED') body.cancellationReason = reason
      if (selectedStatus === 'FAILED') body.failureReason = reason

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      const result = await response.json()
      if (result.success) {
        toast.success(`Order status updated to ${selectedStatus}`)
        onStatusChange?.(selectedStatus)
        router.refresh()
        setIsDialogOpen(false)
        setIsReasonOpen(false)
        setSelectedStatus(null)
        setReason('')
      } else {
        throw new Error(result.error || 'Failed to update order status')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    if (!isUpdating) {
      setIsDialogOpen(false)
      setIsReasonOpen(false)
      setSelectedStatus(null)
      setReason('')
    }
  }

  // Prevent opening dialog when disabled by updating state
  const handleOpenChange = (open: boolean) => {
    // Prevent closing dialog during update
    if (!isUpdating) {
      setIsDialogOpen(open)
      if (!open) {
        setSelectedStatus(null)
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        <Select value={currentStatus} onValueChange={handleStatusSelect}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
      {/* Reason Dialog */}
      <Dialog open={isReasonOpen} onOpenChange={(open) => { if (!isUpdating) setIsReasonOpen(open) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedStatus === 'CANCELLED' ? 'Cancellation Reason' : 'Failure Reason'}</DialogTitle>
            <DialogDescription>Please provide a brief reason for this status change.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason *</label>
            <Textarea
              placeholder={`Please provide a reason for ${selectedStatus?.toLowerCase()} this order...`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsReasonOpen(false)}
              disabled={isUpdating}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!reason.trim()) {
                  toast.error('Please provide a reason')
                  return
                }
                setIsReasonOpen(false)
                setIsDialogOpen(true)
              }}
              disabled={isUpdating || !reason.trim()}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Continue
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          </SelectContent>
        </Select>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Update</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the order status from <strong>{currentStatus}</strong> to <strong>{selectedStatus}</strong>?
              {(selectedStatus === 'CANCELLED' || selectedStatus === 'FAILED') && reason.trim() && (
                <>
                  <br />
                  <span className="block mt-2">Reason: {reason}</span>
                </>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={(e) => {
                e.preventDefault()
                handleCancel()
              }}
              disabled={isUpdating}
            >
              Cancel
            </AlertDialogCancel>
            <button
              onClick={(e) => {
                e.preventDefault()
                handleConfirmUpdate()
              }}
              disabled={isUpdating}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUpdating ? 'Updating...' : 'Confirm'}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}