import { prisma } from '@/lib/prisma'
import { 
  AdminOrderFilters,
  UpdateOrderStatusData,
  OrderStatus,
  AdminOrderWithDetails,
  OrderStatusHistory,
  PaginatedResponse
} from '@/types'
import { validateOrderStatusTransition } from '@/lib/utils'
import { sendOrderStatusEmail } from '@/lib/email'

// Get paginated orders for admin with filtering and sorting (latest-first)
export async function getAdminOrders(filters: AdminOrderFilters = {}): Promise<PaginatedResponse<AdminOrderWithDetails>> {
  const {
    status,
    paymentMethod,
    dateFrom,
    dateTo,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc' // Latest first by default
  } = filters

  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  if (status) {
    where.status = status
  }


  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = dateFrom
    if (dateTo) where.createdAt.lte = dateTo
  }

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { shippingName: { contains: search, mode: 'insensitive' } },
      { shippingPhone: { contains: search, mode: 'insensitive' } },
      { 
        user: { 
          email: { contains: search, mode: 'insensitive' } 
        } 
      },
      { 
        user: { 
          name: { contains: search, mode: 'insensitive' } 
        } 
      },
      { 
        user: { 
          phone: { contains: search, mode: 'insensitive' } 
        } 
      }
    ]
  }

  // Build orderBy clause
  const orderBy: Record<string, 'asc' | 'desc'> = {}
  orderBy[sortBy] = sortOrder as 'asc' | 'desc'

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          // Only select fields needed for admin orders table display
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          shippingName: true,
          shippingPhone: true,
          reason: true, // For cancellation/failure reasons
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true
            }
          },
          orderItems: {
            select: {
              id: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.order.count({ where })
    ])

    // Optimize data for table display - only include necessary fields
    const ordersWithDetails = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      shippingName: order.shippingName,
      shippingPhone: order.shippingPhone,
      user: order.user,
      orderItems: order.orderItems, // Keep original format for frontend compatibility
      cancellationReason: order.reason || null,
      failureReason: order.reason || null
    }))

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: ordersWithDetails as any[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  } catch (error) {
    // console.error('Error fetching admin orders:', error)
    throw new Error('Failed to fetch orders')
  }
}

// Get single order by ID for admin with full details
export async function getAdminOrderById(id: string): Promise<AdminOrderWithDetails | null> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                price: true,
                originalPrice: true,
                weight: true,
                slug: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return null
    }

    // Get status history
    const statusHistory = await getOrderStatusHistory(id)

    // Convert Decimal fields to numbers for client serialization
    return {
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          price: Number(item.product.price),
          originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
          weight: item.product.weight ? Number(item.product.weight) : null,
        }
      })),
      statusHistory,
      cancellationReason: order.reason || null,
      failureReason: order.reason || null
    } as any
  } catch (error) {
    // console.error('Error fetching order by ID:', error)
    throw new Error('Failed to fetch order')
  }
}

// Update order status with reason validation
export async function updateOrderStatus(id: string, data: UpdateOrderStatusData, updatedBy: string): Promise<AdminOrderWithDetails> {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                stock: true,
                price: true,
                originalPrice: true,
                weight: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Validate status transition
    if (!validateOrderStatusTransition(order.status, data.status)) {
      throw new Error(`Invalid status transition from ${order.status} to ${data.status}`)
    }

    // Validate reason requirements
    if (data.status === OrderStatus.CANCELLED && !data.cancellationReason) {
      throw new Error('Cancellation reason is required when cancelling an order')
    }

    if (data.status === OrderStatus.FAILED && !data.failureReason) {
      throw new Error('Failure reason is required when marking order as failed')
    }

    // Prepare update data
    const updateData: any = {
      status: data.status,
      updatedAt: new Date()
    }

    // Handle reason field based on status (single 'reason' column on Order)
    if (data.status === OrderStatus.CANCELLED) {
      updateData.reason = data.cancellationReason || null
    } else if (data.status === OrderStatus.FAILED) {
      updateData.reason = data.failureReason || null
    } else {
      // Clear reason for other statuses
      updateData.reason = null
    }

    // Note: Timestamp fields like shippedAt/deliveredAt can be tracked via OrderStatusHistory
    // No need to update order directly as we maintain history separately

    // Use transaction to update order and handle stock adjustments
    const result = await prisma.$transaction(async (tx) => {
      // Handle stock reservation for PENDING → PROCESSING transition
      // Note: Stock is already decremented at order creation (PENDING status)
      // This transition just confirms the reservation is active
      if (order.status === OrderStatus.PENDING && data.status === OrderStatus.PROCESSING) {
        // Verify stock is still available (in case of concurrent orders)
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId }
          })
          
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`)
          }
          
          // Stock should already be decremented from order creation
          // This is just a validation step
          if (product.stock < 0) {
            throw new Error(`Insufficient stock for product: ${product.name}. Current stock: ${product.stock}`)
          }
        }
      }

      // Update order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                  originalPrice: true,
                  weight: true,
                  slug: true
                }
              }
            }
          }
        }
      })

      // Handle stock adjustments for cancelled or failed orders
      if (data.status === OrderStatus.CANCELLED || data.status === OrderStatus.FAILED) {
        await restockOrderItems(tx, order.orderItems, id)
      }

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: data.status,
          reason: data.cancellationReason || data.failureReason || null,
          updatedBy: updatedBy,
          createdAt: new Date()
        }
      })

      return updatedOrder
    })

    // Get status history for response
    const statusHistory = await getOrderStatusHistory(id)

    // Send email notification to user about status change
    try {
      await sendOrderStatusEmail({
        userEmail: result.user.email,
        userName: result.user.name || 'Customer',
        orderNumber: result.orderNumber,
        status: data.status,
        orderTotal: Number(result.total),
        reason: data.status === OrderStatus.CANCELLED ? (data.cancellationReason || undefined) : (data.status === OrderStatus.FAILED ? (data.failureReason || undefined) : undefined)
      })
    } catch (emailError) {
      // console.error('Failed to send order status email:', emailError)
      // Don't fail the order update if email fails
    }

    // Convert Decimal fields to numbers for client serialization
    return {
      ...result,
      subtotal: result.subtotal,
      shippingCost: result.shippingCost,
      total: result.total,
      orderItems: result.orderItems as any,
      statusHistory,
      cancellationReason: result.reason || null,
      failureReason: result.reason || null
    } as AdminOrderWithDetails
  } catch (error) {
    // console.error('Error updating order status:', error)
    throw new Error('Failed to update order status')
  }
}

// Get order status history
export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
  try {
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    })

    return history
  } catch (error) {
    // console.error('Error fetching order status history:', error)
    throw new Error('Failed to fetch order status history')
  }
}

/**
 * Restock order items when order is cancelled or failed
 * 
 * STOCK FLOW POLICY:
 * 1. When an order is created (PENDING status), stock is decremented immediately
 * 2. When an order transitions from PENDING to PROCESSING, stock is reserved (already decremented at creation)
 * 3. When an order is cancelled or failed, stock is incremented back to restore availability
 * 4. This ensures stock is reserved from the moment an order is placed
 * 5. Stock is only restored if the order doesn't complete successfully
 * 6. Restocking is idempotent - multiple calls won't double-restock
 * 
 * @param tx - Prisma transaction instance
 * @param orderItems - Array of order items to restock
 * @param orderId - Order ID to track restocking (for idempotency)
 */
async function restockOrderItems(tx: any, orderItems: any[], orderId: string): Promise<void> {
  // Check if this order has already been restocked to prevent double-restock
  const existingRestockHistory = await tx.orderStatusHistory.findFirst({
    where: {
      orderId: orderId,
      reason: 'STOCK_RESTORED'
    }
  })

  if (existingRestockHistory) {
    // Already restocked, skip to maintain idempotency
    return
  }

  // Restock each item
  for (const item of orderItems) {
    await tx.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          increment: item.quantity
        }
      }
    })
  }

  // Create a status history entry to track restocking for idempotency
  await tx.orderStatusHistory.create({
    data: {
      orderId: orderId,
      status: 'CANCELLED', // This will be overridden by the actual status
      reason: 'STOCK_RESTORED',
      updatedBy: 'SYSTEM',
      createdAt: new Date()
    }
  })
}


// Get order metrics for admin dashboard
export async function getOrderMetrics(): Promise<{
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  failedOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
}> {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.count({ where: { status: OrderStatus.FAILED } }),
      prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { total: true }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfDay } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfWeek } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } }
      })
    ])

    const revenue = totalRevenue._sum.total || 0
    const averageOrderValue = totalOrders > 0 ? Number(revenue) / totalOrders : 0

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      failedOrders,
      totalRevenue: Number(revenue),
      averageOrderValue,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth
    }
  } catch (error) {
    // console.error('Error fetching order metrics:', error)
    throw new Error('Failed to fetch order metrics')
  }
}

// Get recent orders for admin dashboard (optimized for display)
export async function getRecentOrders(limit: number = 5): Promise<AdminOrderWithDetails[]> {
  try {
    const orders = await prisma.order.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        // Minimal fields for recent orders display
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return orders.map(order => ({
      ...order,
      total: Number(order.total)
    })) as any[]
  } catch (error) {
    // console.error('Error fetching recent orders:', error)
    throw new Error('Failed to fetch recent orders')
  }
}

// Bulk update order status
export async function bulkUpdateOrderStatus(ids: string[], status: OrderStatus, reason?: string): Promise<{ count: number }> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date()
    }

    if (status === OrderStatus.CANCELLED) {
      updateData.cancellationReason = reason
    } else if (status === OrderStatus.FAILED) {
      updateData.failureReason = reason
    }

    // Handle stock restoration for cancelled or failed orders
    if (status === OrderStatus.CANCELLED || status === OrderStatus.FAILED) {
      const result = await prisma.$transaction(async (tx) => {
        // Get order items for stock restoration
        const orders = await tx.order.findMany({
          where: { id: { in: ids } },
          include: { orderItems: true }
        })

        // Update order status
        const updateResult = await tx.order.updateMany({
          where: { id: { in: ids } },
          data: updateData
        })

        // Restore stock for all affected orders
        for (const order of orders) {
          await restockOrderItems(tx, order.orderItems, order.id)
        }

        return updateResult
      })

      return result
    } else {
      // For other status updates, no stock changes needed
      const result = await prisma.order.updateMany({
        where: {
          id: { in: ids }
        },
        data: updateData
      })

      return result
    }
  } catch (error) {
    // console.error('Error bulk updating order status:', error)
    throw new Error('Failed to bulk update order status')
  }
}