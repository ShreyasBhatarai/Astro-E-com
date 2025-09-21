import { cn } from "@/lib/utils"
import { Button } from "./button"
import { ShoppingBag, Search, Package, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[300px] text-center py-12", className)}>
      <div className="mb-4 text-gray-400">
        {icon || <Package className="h-12 w-12" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function EmptyProducts({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon={<Search className="h-12 w-12" />}
      title="No products found"
      description="We couldn't find any products matching your criteria. Try adjusting your filters or search terms."
      action={onReset ? {
        label: "Clear filters",
        onClick: onReset
      } : undefined}
    />
  )
}

export function EmptyCart() {
  return (
    <EmptyState
      icon={<ShoppingBag className="h-12 w-12" />}
      title="Your cart is empty"
      description="Add some products to your cart to get started with your shopping."
      action={{
        label: "Continue shopping",
        onClick: () => window.location.href = '/products'
      }}
    />
  )
}

export function EmptyOrders() {
  return (
    <EmptyState
      icon={<Package className="h-12 w-12" />}
      title="No orders yet"
      description="You haven't placed any orders yet. Start shopping to see your orders here."
      action={{
        label: "Start shopping",
        onClick: () => window.location.href = '/products'
      }}
    />
  )
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={<AlertCircle className="h-12 w-12 text-red-500" />}
      title="Something went wrong"
      description="We encountered an error while loading this page. Please try again."
      action={onRetry ? {
        label: "Try again",
        onClick: onRetry
      } : undefined}
    />
  )
}