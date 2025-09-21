'use client'

import { useEffect, useRef, useState } from 'react'
import { OrderUpdateEvent, AdminOrderWithDetails } from '@/types'
import { subscribeToOrderUpdates } from '@/lib/realtime'

interface UseRealTimeOrdersOptions {
  onOrderUpdate?: (event: OrderUpdateEvent) => void
  onConnectionChange?: (isConnected: boolean) => void
  onError?: (error: Event) => void
}

interface UseRealTimeOrdersReturn {
  isConnected: boolean
  lastUpdate: Date | null
  connectionError: string | null
  reconnect: () => void
}

export function useRealTimeOrders(options: UseRealTimeOrdersOptions = {}): UseRealTimeOrdersReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      const eventSource = subscribeToOrderUpdates(
        (event: OrderUpdateEvent) => {
          setLastUpdate(new Date())
          setConnectionError(null)
          reconnectAttempts.current = 0
          
          if (options.onOrderUpdate) {
            options.onOrderUpdate(event)
          }
        },
        (error: Event) => {
          // console.error('SSE connection error:', error)
          setConnectionError('Connection error occurred')
          setIsConnected(false)
          
          if (options.onError) {
            options.onError(error)
          }

          // Attempt to reconnect
          scheduleReconnect()
        },
        () => {
          // SSE connection opened
          setIsConnected(true)
          setConnectionError(null)
          reconnectAttempts.current = 0
          
          if (options.onConnectionChange) {
            options.onConnectionChange(true)
          }
        }
      )

      eventSourceRef.current = eventSource
    } catch (error) {
      // console.error('Failed to create SSE connection:', error)
      setConnectionError('Failed to establish connection')
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      setConnectionError('Max reconnection attempts reached')
      return
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Exponential backoff, max 30s
    reconnectAttempts.current++

    reconnectTimeoutRef.current = setTimeout(() => {
        // Attempting to reconnect
      connect()
    }, delay)
  }

  const reconnect = () => {
    reconnectAttempts.current = 0
    setConnectionError(null)
    connect()
  }

  useEffect(() => {
    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    isConnected,
    lastUpdate,
    connectionError,
    reconnect
  }
}

// Hook for updating orders list in real-time
export function useOrderListUpdates(initialOrders: AdminOrderWithDetails[]) {
  const [orders, setOrders] = useState(initialOrders)

  const { isConnected, connectionError, reconnect } = useRealTimeOrders({
    onOrderUpdate: (event: OrderUpdateEvent) => {
      switch (event.type) {
        case 'order_created':
          // Add new order to the beginning of the list
          setOrders(prev => [event.order, ...prev])
          break
        case 'order_updated':
        case 'order_status_changed':
          // Update existing order
          setOrders(prev => 
            prev.map(order => 
              order.id === event.orderId ? event.order : order
            )
          )
          break
      }
    },
    onConnectionChange: (connected) => {
      if (connected) {
        // Real-time order updates connected
      } else {
        // Real-time order updates disconnected
      }
    },
    onError: (error) => {
      // console.error('Real-time order updates error:', error)
    }
  })

  return {
    orders,
    isConnected,
    connectionError,
    reconnect
  }
}