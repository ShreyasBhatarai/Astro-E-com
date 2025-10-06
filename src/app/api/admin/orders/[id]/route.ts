import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminOrderById, updateOrderStatus } from '@/lib/queries/admin-orders'
import { broadcastOrderUpdate, createOrderUpdateEvent } from '@/lib/realtime'
import { sendOrderStatusEmail } from '@/lib/email'
import { AdminApiResponse, UpdateOrderStatusData, OrderStatus } from '@/types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/orders/[id] - Get single order with full details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const order = await getAdminOrderById(resolvedParams.id)

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, data: order } as AdminApiResponse
    )
  } catch (error) {
    // console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// PUT /api/admin/orders/[id] - Update order status
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Validate status enum
    if (!Object.values(OrderStatus).includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Validate reason requirements
    if (body.status === OrderStatus.CANCELLED && !body.cancellationReason) {
      return NextResponse.json(
        { success: false, error: 'Cancellation reason is required when cancelling an order' } as AdminApiResponse,
        { status: 400 }
      )
    }

    if (body.status === OrderStatus.FAILED && !body.failureReason) {
      return NextResponse.json(
        { success: false, error: 'Failure reason is required when marking order as failed' } as AdminApiResponse,
        { status: 400 }
      )
    }

    const updateData: UpdateOrderStatusData = {
      status: body.status,
      cancellationReason: body.cancellationReason,
      failureReason: body.failureReason
    }

    const startTime = Date.now()
    const updatedBy = session.user.email || session.user.id
    const resolvedParams2 = await params
    const updatedOrder = await updateOrderStatus(resolvedParams2.id, updateData, updatedBy)
    const updateTime = Date.now() - startTime

    // Send email notification to customer
    if (updatedOrder.user?.email) {
      try {
        await sendOrderStatusEmail({
          userEmail: updatedOrder.user.email,
          userName: updatedOrder.shippingName || updatedOrder.user.name || 'Customer',
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
          orderTotal: Number(updatedOrder.total),
          reason: body?.cancellationReason || body?.failureReason
        })
        // console.log(`✅ Order status email sent to ${updatedOrder.user.email} for order ${updatedOrder.orderNumber}`)
      } catch (emailError) {
        // console.error('❌ Failed to send order status email:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Broadcast real-time update
    try {
      const resolvedParams3 = await params
      const updateEvent = createOrderUpdateEvent('order_status_changed', resolvedParams3.id, updatedOrder)
      broadcastOrderUpdate(updateEvent)
    } catch (broadcastError) {
      // console.error('Error broadcasting order update:', broadcastError)
      // Don't fail the request if broadcasting fails
    }

    return NextResponse.json(
      { 
        success: true, 
        data: updatedOrder, 
        message: 'Order status updated successfully',
        updateTime 
      } as AdminApiResponse
    )
  } catch (error) {
    // console.error('Error updating order status:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as AdminApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update order status' } as AdminApiResponse,
      { status: 500 }
    )
  }
}