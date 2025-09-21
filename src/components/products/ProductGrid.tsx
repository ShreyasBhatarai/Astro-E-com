'use client'

import React from 'react'
import { ProductWithDetails } from '@/types'
import { ProductCard } from './ProductCard'
import { Skeleton } from '@/components/ui/skeleton'

interface ProductGridProps {
  products: ProductWithDetails[]
  isLoading?: boolean
  className?: string
  variant?: 'homepage' | 'products' | 'default'
}

export function ProductGrid({ 
  products, 
  isLoading = false, 
  className,
  variant = 'default' 
}: ProductGridProps) {
  
  // Define grid classes based on variant
  const getGridClasses = () => {
    switch (variant) {
      case 'homepage':
        return 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6'
      case 'products':
        return 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'
      default:
        return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'
    }
  }
  if (isLoading && products.length === 0) {
    return (
      <div className={`${getGridClasses()} ${className}`}>
        {Array.from({ length: variant === 'homepage' ? 10 : 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-12 h-12 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No products found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Try adjusting your filters or search terms to find what you're looking for.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className={getGridClasses()}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
      <Skeleton className="aspect-square w-full rounded-t-lg" />
      <div className="p-4 space-y-2 flex-grow flex flex-col justify-between">
        <div>
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="mt-auto">
          <Skeleton className="h-6 w-1/3 mb-2" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  )
}