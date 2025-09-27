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
  const { wishlist, wishlistIds, isLoading, isAuthenticated, refreshWishlist } = useWishlist()
  const [localWishlist, setLocalWishlist] = useState<ProductWithDetails[]>([])
  const [fetchingGuest, setFetchingGuest] = useState(false)

  // For guest users only, fetch product details from localStorage IDs
  useEffect(() => {
    if (isAuthenticated) {
      // Ensure guest state is cleared when user is logged in
      setLocalWishlist([])
      setFetchingGuest(false)
      return
    }

    const fetchGuestWishlistProducts = async () => {
      setFetchingGuest(true)
      const guestIds = JSON.parse(localStorage.getItem('guest-wishlist') || '[]')
      if (guestIds.length > 0) {
        try {
          const response = await fetch(`/api/products?ids=${guestIds.join(',')}&_=${Date.now()}`,{ cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            setLocalWishlist(data.data || [])
          } else {
            setLocalWishlist([])
          }
        } catch (error) {
          setLocalWishlist([])
        }
      } else {
        setLocalWishlist([])
      }
      setFetchingGuest(false)
    }

    // Only for guests
    if (!isAuthenticated && wishlist.length === 0) {
      fetchGuestWishlistProducts()
    }
  }, [isAuthenticated, wishlist.length, wishlistIds.length])

  // Always refresh authenticated wishlist on each visit/mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <Link href="/products">
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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
        {displayWishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/products">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  )
}