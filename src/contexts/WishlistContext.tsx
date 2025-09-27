'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { ProductWithDetails } from '@/types'
import { guestWishlist } from '@/lib/queries/wishlist'
import { toast } from 'sonner'

interface WishlistContextType {
  wishlist: ProductWithDetails[]
  wishlistIds: string[]
  wishlistCount: number
  isLoading: boolean
  isAuthenticated: boolean
  addToWishlist: (productId: string) => Promise<boolean>
  removeFromWishlist: (productId: string) => Promise<boolean>
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => Promise<boolean>
  syncGuestWishlist: () => Promise<void>
  refreshWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

interface WishlistProviderProps {
  children: ReactNode
  initialWishlist?: ProductWithDetails[]
  userId?: string
}

export function WishlistProvider({ children, initialWishlist = [] }: Omit<WishlistProviderProps, 'userId'>) {
  const { data: session } = useSession()
  const [wishlist, setWishlist] = useState<ProductWithDetails[]>(initialWishlist)
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [wishlistCount, setWishlistCount] = useState(0)

  // Update wishlist count whenever wishlistIds changes
  useEffect(() => {
    setWishlistCount(wishlistIds.length)
  }, [wishlistIds])
  const [isLoading, setIsLoading] = useState(false)
  const userId = session?.user?.id

  // Reset wishlist when user changes (login/logout)
  useEffect(() => {
    if (userId) {
      // User logged in - fetch their wishlist
      fetchUserWishlist()
    } else {
      // User logged out or guest - clear authenticated wishlist and reset to empty state
      setWishlist([])
      setWishlistIds([])
      // Clear any guest wishlist data from localStorage as well to ensure clean state
      guestWishlist.clear()
    }
  }, [userId])

  // Initialize wishlist IDs from initial data only on first load
  useEffect(() => {
    if (initialWishlist.length > 0) {
      setWishlistIds(initialWishlist.map(item => item.id))
    }
  }, [initialWishlist.length])

  const fetchUserWishlist = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/wishlist?_=${Date.now()}`,{ cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setWishlist(data.data || [])
          setWishlistIds(data.data?.map((item: ProductWithDetails) => item.id) || [])
        }
      }
    } catch (error) {
      // Silently fail - wishlist will remain empty
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWishlistCount = async () => {
    if (!userId) return
    
    try {
      const response = await fetch(`/api/wishlist?countOnly=true&_=${Date.now()}`, { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Just update the count without affecting the full wishlist
          // We'll use a separate state for count-only mode
          setWishlistCount(data.data.count)
        }
      }
    } catch (error) {
      // Silently fail - wishlist count will remain as is
    }
  }

  const addToWishlist = async (productId: string): Promise<boolean> => {
    if (isInWishlist(productId)) return true
    if (!userId) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) return false
      const data = await response.json()
      const success = Boolean(data?.success)
      if (success) {
        setWishlistIds(prev => [...prev, productId])
        setWishlistCount(prev => prev + 1)
      }
      return success
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeFromWishlist = async (productId: string): Promise<boolean> => {
    if (!userId) return false
    setIsLoading(true)
    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) return false
      const data = await response.json()
      const success = Boolean(data?.success)
      if (success) {
        setWishlistIds(prev => prev.filter(id => id !== productId))
        setWishlist(prev => prev.filter(item => item.id !== productId))
        setWishlistCount(prev => Math.max(0, prev - 1))
      }
      return success
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const isInWishlist = (productId: string): boolean => {
    return wishlistIds.includes(productId)
  }

  const clearWishlist = async (): Promise<boolean> => {
    if (!userId) return false
    setIsLoading(true)
    try {
      const response = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) return false
      const data = await response.json()
      const success = Boolean(data?.success)
      if (success) {
        setWishlistIds([])
        setWishlist([])
      }
      return success
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const syncGuestWishlist = async (): Promise<void> => {
    if (!userId) return

    const guestIds = guestWishlist.get()
    if (guestIds.length === 0) return

    setIsLoading(true)
    try {
      // Add all guest wishlist items to user's wishlist
      const promises = guestIds.map(productId => 
        fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId }),
        })
      )

      await Promise.all(promises)
      
      // Clear guest wishlist after successful sync
      guestWishlist.clear()
      setWishlistIds(prev => [...new Set([...prev, ...guestIds])])
    } catch (error) {
      // console.error('Error syncing guest wishlist:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const value: WishlistContextType = {
    wishlist,
    wishlistIds,
    wishlistCount,
    isLoading,
    isAuthenticated: Boolean(userId),
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    syncGuestWishlist,
    refreshWishlist: fetchUserWishlist,
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}