'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  const refreshCart = async () => {
    if (!session?.user?.id && !sessionId) return
    
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (sessionId) params.set('sessionId', sessionId)
      
      const response = await fetch(`/api/cart?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setItems(data.data)
        }
      }
    } catch (error) {
      // console.error('Error fetching cart:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
        await refreshCart()
        return true
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
        await refreshCart()
        return true
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
        await refreshCart()
        return true
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
      refreshCart
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