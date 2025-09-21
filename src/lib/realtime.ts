import { OrderUpdateEvent, RealtimeConnection } from '@/types'

// In-memory store for SSE connections
// const connections = new Map<string, RealtimeConnection>()

// Controller registry for SSE broadcasting
const controllerRegistry = new Map<string, { controller: ReadableStreamDefaultController, userId: string }>()

// Order update emitter class
export class OrderUpdateEmitter {
  private static instance: OrderUpdateEmitter
  private connections: Map<string, RealtimeConnection> = new Map()

  private constructor() {}

  static getInstance(): OrderUpdateEmitter {
    if (!OrderUpdateEmitter.instance) {
      OrderUpdateEmitter.instance = new OrderUpdateEmitter()
    }
    return OrderUpdateEmitter.instance
  }

  // Add new connection
  addConnection(connectionId: string, userId: string): RealtimeConnection {
    const connection: RealtimeConnection = {
      id: connectionId,
      userId,
      isConnected: true,
      lastPing: new Date()
    }

    this.connections.set(connectionId, connection)
    return connection
  }

  // Register stream controller for broadcasting
  registerController(connectionId: string, controller: ReadableStreamDefaultController, userId: string): void {
    controllerRegistry.set(connectionId, { controller, userId })
  }

  // Deregister stream controller
  deregisterController(connectionId: string): void {
    controllerRegistry.delete(connectionId)
  }

  // Remove connection
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId)
    this.deregisterController(connectionId)
  }

  // Update connection ping
  updatePing(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastPing = new Date()
    }
  }

  // Get all connections for a user
  getUserConnections(userId: string): RealtimeConnection[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.userId === userId && conn.isConnected
    )
  }

  // Get all active connections
  getAllConnections(): RealtimeConnection[] {
    return Array.from(this.connections.values()).filter(conn => conn.isConnected)
  }

  // Clean up stale connections
  cleanupStaleConnections(maxAgeMinutes: number = 30): void {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000)
    
    for (const [id, connection] of this.connections.entries()) {
      if (connection.lastPing < cutoff) {
        connection.isConnected = false
        this.connections.delete(id)
      }
    }
  }

  // Get connection count
  getConnectionCount(): number {
    return this.connections.size
  }
}

// Global emitter instance
export const orderUpdateEmitter = OrderUpdateEmitter.getInstance()

// Broadcast order update to all connected admin clients
export function broadcastOrderUpdate(event: OrderUpdateEvent): void {
  const emitter = orderUpdateEmitter
  const connections = emitter.getAllConnections()

  // Create SSE message
  const message = `data: ${JSON.stringify(event)}\n\n`

  // Broadcast to all active controllers
  for (const [connectionId, { controller, userId }] of controllerRegistry.entries()) {
    try {
      // Check if connection is still active
      const connection = connections.find(conn => conn.id === connectionId)
      if (connection && connection.isConnected) {
        controller.enqueue(new TextEncoder().encode(message))
        // Broadcasting to connection
      } else {
        // Remove stale connection
        emitter.removeConnection(connectionId)
      }
    } catch (error) {
      // console.error(`Error broadcasting to connection ${connectionId}:`, error)
      // Remove failed connection
      emitter.removeConnection(connectionId)
    }
  }
}

// Subscribe to order updates (client-side function)
export function subscribeToOrderUpdates(
  onUpdate: (event: OrderUpdateEvent) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void
): EventSource {
  const eventSource = new EventSource('/api/admin/orders/realtime')

  eventSource.onmessage = (event) => {
    try {
      const data: OrderUpdateEvent = JSON.parse(event.data)
      onUpdate(data)
    } catch (error) {
      // console.error('Error parsing SSE message:', error)
      if (onError) {
        onError(error as Event)
      }
    }
  }

  eventSource.onerror = (error) => {
    // console.error('SSE connection error:', error)
    if (onError) {
      onError(error)
    }
  }

  eventSource.onopen = () => {
    // SSE connection opened
    if (onOpen) {
      onOpen()
    }
  }

  return eventSource
}

// Create order update event
export function createOrderUpdateEvent(
  type: 'order_created' | 'order_updated' | 'order_status_changed',
  orderId: string,
  order: any
): OrderUpdateEvent {
  return {
    type,
    orderId,
    order,
    timestamp: new Date()
  }
}

// Utility function to check if SSE is supported
export function isSSESupported(): boolean {
  return typeof EventSource !== 'undefined'
}

// Connection management utilities
export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

// Heartbeat mechanism
export function startHeartbeat(intervalMs: number = 30000): NodeJS.Timeout {
  return setInterval(() => {
    const emitter = orderUpdateEmitter
    emitter.cleanupStaleConnections()
    
    // Log connection stats
    const connectionCount = emitter.getConnectionCount()
    // Track active SSE connections
  }, intervalMs)
}

// Stop heartbeat
export function stopHeartbeat(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId)
}

// Performance monitoring
export class RealtimePerformanceMonitor {
  private static instance: RealtimePerformanceMonitor
  private metrics: {
    totalUpdates: number
    successfulDeliveries: number
    failedDeliveries: number
    averageDeliveryTime: number
    lastUpdateTime: Date | null
  } = {
    totalUpdates: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    averageDeliveryTime: 0,
    lastUpdateTime: null
  }

  private constructor() {}

  static getInstance(): RealtimePerformanceMonitor {
    if (!RealtimePerformanceMonitor.instance) {
      RealtimePerformanceMonitor.instance = new RealtimePerformanceMonitor()
    }
    return RealtimePerformanceMonitor.instance
  }

  recordUpdate(deliveryTime: number, success: boolean): void {
    this.metrics.totalUpdates++
    this.metrics.lastUpdateTime = new Date()
    
    if (success) {
      this.metrics.successfulDeliveries++
    } else {
      this.metrics.failedDeliveries++
    }

    // Update average delivery time
    const totalDeliveries = this.metrics.successfulDeliveries + this.metrics.failedDeliveries
    this.metrics.averageDeliveryTime = 
      (this.metrics.averageDeliveryTime * (totalDeliveries - 1) + deliveryTime) / totalDeliveries
  }

  getMetrics() {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      totalUpdates: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      lastUpdateTime: null
    }
  }

  isPerformanceAcceptable(): boolean {
    // Check if average delivery time is under 2 seconds
    return this.metrics.averageDeliveryTime < 2000
  }
}

export const performanceMonitor = RealtimePerformanceMonitor.getInstance()