'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Product } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface DeleteProductDialogProps {
  product: Product
  trigger?: React.ReactNode
}

export function DeleteProductDialog({ product, trigger }: DeleteProductDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product')
      }

      toast.success('Product deleted successfully')
      setOpen(false)
      
      // Navigate back to products list
      router.push('/admin/products')
    } catch (error) {
      // console.error('Error deleting product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Product
          </DialogTitle>
          <DialogDescription>
                Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
            The product will be permanently removed from the system.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">Warning</p>
                <p>
                  Deleting this product will:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove it from all product listings</li>
                  <li>Remove it from any active orders</li>
                  <li>Delete all associated images and data</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}