'use client'

import { Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface OrderItemCardProps {
  item: {
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      sku?: string | null
      slug: string
      images: string[]
    }
  }
}

export function OrderItemCard({ item }: OrderItemCardProps) {
  const handleClick = () => {
    window.open(`/products/${item.product.slug}`, '_blank')
  }

  return (
    <div 
      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
        {item.product.images.length > 0 ? (
          <img 
            src={item.product.images[0]} 
            alt={item.product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <Package className="h-8 w-8 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.product.name}</h4>
        <p className="text-sm text-gray-600">SKU: {item.product.sku || 'N/A'}</p>
        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{formatCurrency(Number(item.price))}</p>
      </div>
    </div>
  )
}