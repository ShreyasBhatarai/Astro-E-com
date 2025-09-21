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
  const [sessionId, setSessionId] = useState<string>('')

  // Generate or get session ID for guest users
  useEffect(() => {
    let id = localStorage.getItem('cartSessionId')
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('cartSessionId', id)
    }
    setSessionId(id)
  }, [])

  // Load cart items when session or sessionId changes
  useEffect(() => {
    if (session?.user?.id || sessionId) {
      refreshCart()
    }
  }, [session?.user?.id, sessionId])

  const refreshCart = useCallback(async () => {
    if (!session?.user?.id && !sessionId) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      
      const response = await fetch(`/api/cart?${params.toString()}`)
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
  }, [session?.user?.id, sessionId])

  const addItem = async (newItem: CartItem): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: newItem.productId,
          quantity: newItem.quantity,
          sessionId: !session?.user?.id ? sessionId : undefined
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
      // console.error('Error adding item to cart:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (productId: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      
      const response = await fetch(`/api/cart/${productId}?${params.toString()}`, {
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
      // console.error('Error removing item from cart:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number): Promise<boolean> => {
    if (quantity <= 0) {
      return await removeItem(productId)
    }
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          sessionId: !session?.user?.id ? sessionId : undefined
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
      // console.error('Error updating cart quantity:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async (): Promise<boolean> => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      
      const response = await fetch(`/api/cart/clear?${params.toString()}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setItems([])
        return true
      }
      return false
    } catch (error) {
      // console.error('Error clearing cart:', error)
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