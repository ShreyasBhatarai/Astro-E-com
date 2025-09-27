'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  slug: string
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => Promise<boolean>
  removeItem: (productId: string) => Promise<boolean>
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<boolean>
  getTotal: () => number
  getTotalItems: () => number
  isLoading: boolean
  refreshCart: () => Promise<void>
  setDirectCheckoutItems: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(true) // Start with loading true
  // Load cart items when session changes
  useEffect(() => {
    if (session?.user?.id) {
      refreshCart()
    } else {
      setItems([])
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const refreshCart = useCallback(async () => {
    if (!session?.user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Handle both array format and object format with items property
          const items = Array.isArray(data.data) ? data.data : (data.data?.items || [])
          setItems(items)
        } else {
          setItems([])
        }
      } else {
        setItems([])
      }
    } catch (error) {
      // console.error('Error fetching cart:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  const addItem = async (newItem: CartItem): Promise<boolean> => {
    if (!session?.user?.id) return false
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: newItem.productId,
          quantity: newItem.quantity
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update items directly from API response to avoid extra fetch
          const items = Array.isArray(result.data) ? result.data : (result.data?.items || [])
          setItems(items)
          return true
        }
      }
      return false
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (productId: string): Promise<boolean> => {
    if (!session?.user?.id) return false
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update items directly from API response
          const items = Array.isArray(result.data) ? result.data : (result.data?.items || [])
          setItems(items)
          return true
        }
      }
      return false
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      return await removeItem(productId)
    }
    if (!session?.user?.id) return false

    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update items directly from API response
          const items = Array.isArray(result.data) ? result.data : (result.data?.items || [])
          setItems(items)
          return true
        }
      }
      return false
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async (): Promise<boolean> => {
    if (!session?.user?.id) return false
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/clear`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems([])
        return true
      }
      return false
    } catch (error) {
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getTotal = () => {
    if (!Array.isArray(items)) return 0
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    if (!Array.isArray(items)) return 0
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  const setDirectCheckoutItems = (checkoutItems: CartItem[]) => {
    setItems(checkoutItems)
  }

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getTotalItems,
      isLoading,
      refreshCart,
      setDirectCheckoutItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}