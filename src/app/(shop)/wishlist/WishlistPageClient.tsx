'use client'

import React, { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/contexts/WishlistContext'
import { ProductWithDetails } from '@/types'
import { ProductCard } from '@/components/products/ProductCard'
import Link from 'next/link'

export function WishlistPageClient() {
  const { wishlist, removeFromWishlist, isLoading } = useWishlist()
  const [localWishlist, setLocalWishlist] = useState<ProductWithDetails[]>([])
  const [fetchingGuest, setFetchingGuest] = useState(false)

  // For guest users, we need to fetch product details for localStorage IDs
  useEffect(() => {
    const fetchGuestWishlistProducts = async () => {
      setFetchingGuest(true)
      const guestIds = JSON.parse(localStorage.getItem('guest-wishlist') || '[]')
      if (guestIds.length > 0) {
        try {
          const response = await fetch(`/api/products?ids=${guestIds.join(',')}`)
          if (response.ok) {
            const data = await response.json()
            setLocalWishlist(data.data || [])
          }
        } catch (error) {
          // console.error('Error fetching guest wishlist products:', error)
        }
      }
      setFetchingGuest(false)
    }

    if (wishlist.length === 0) {
      fetchGuestWishlistProducts()
    }
  }, [wishlist.length])

  const displayWishlist = wishlist.length > 0 ? wishlist : localWishlist
  const isLoadingData = isLoading || fetchingGuest


  // Show loading state first
  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageLoader text="Loading your wishlist..." />
      </div>
    )
  }

  // Show empty state only after loading is complete
  if (displayWishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-light text-muted-foreground mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-muted-foreground mb-6 font-light">
            Save products you love to your wishlist for easy access later.
          </p>
          <Button asChild>
            <Link href="/categories">
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">My Wishlist</h1>
        <p className="text-muted-foreground font-light">
          {displayWishlist.length} item{displayWishlist.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {displayWishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/categories">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  )
}