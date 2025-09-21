import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendOrderNotificationEmail, sendOrderNotificationToAdmin } from '@/lib/email'
import { createApiRateLimit, createStrictRateLimit } from '@/lib/rate-limit'
import { withRateLimit } from '@/lib/api-helpers'

const orderRateLimit = createStrictRateLimit()
const apiRateLimit = createApiRateLimit()

export async function POST(request: NextRequest) {
  return withRateLimit(request, orderRateLimit, async () => {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { items, total, shipping, paymentMethod, shippingAddress, orderNotes } = body

    if (!items || !items.length) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.user.id,
        status: 'PENDING',
        subtotal: parseFloat(total),
        total: parseFloat(total),
        shippingCost: parseFloat(shipping) || 0,
        paymentMethod,
        shippingName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shippingPhone: shippingAddress.phone,
        shippingAddress: shippingAddress.address,
        shippingCity: shippingAddress.city,
        shippingDistrict: shippingAddress.district,
        shippingProvince: shippingAddress.province,
        notes: orderNotes || null,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: parseFloat(item.price)
          }))
        }
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                slug: true
              }
            }
          }
        },
        user: true
      }
    })

    // Create notifications
    // 1. User notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: 'ORDER_CREATED',
        title: 'Order Placed Successfully',
        message: `Your order ${orderNumber} has been placed successfully. Our team will contact you shortly to confirm delivery details.`,
        metadata: { orderNumber, orderId: order.id }
      }
    })

    // 2. Admin notification - get all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    })

    // Create notifications for all admins
    const adminNotifications = adminUsers.map(admin => ({
      userId: admin.id,
      type: 'ORDER_CREATED' as const,
      title: 'New Order Received',
      message: `New order ${orderNumber} from ${shippingAddress.firstName} ${shippingAddress.lastName} - Total: Rs. ${total}`,
      metadata: { orderNumber, orderId: order.id, customerId: session.user.id }
    }))

    if (adminNotifications.length > 0) {
      await prisma.notification.createMany({
        data: adminNotifications
      })
    }

    // Send email notifications
    const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`
    
    // Send to user
    if (shippingAddress.email) {
      await sendOrderNotificationEmail(
        shippingAddress.email,
        orderNumber,
        'PENDING',
        customerName
      )
    }
    
    // Send to admin
    await sendOrderNotificationToAdmin(
      orderNumber,
      'PENDING',
      customerName,
      shippingAddress.email || 'No email provided',
      Number(order.total)
    )

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: 'Order placed successfully'
      }
    })
  } catch (error) {
    // console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    )
  }
  })
}

export async function GET(request: NextRequest) {
  return withRateLimit(request, apiRateLimit, async () => {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const phone = searchParams.get('phone') || ''
    const skip = (page - 1) * limit

    // Handle phone-based search for non-authenticated users
    if (phone && !session) {
      const whereClause: any = {
        shippingPhone: phone
      }

      // Add search filter for order number or product name
      if (search) {
        whereClause.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { orderItems: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
        ]
      }

      const orders = await prisma.order.findMany({
        where: whereClause,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })

      const totalCount = await prisma.order.count({
        where: whereClause
      })

      // Convert Decimal fields to numbers for client serialization
      const serializedOrders = orders.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        shippingCost: Number(order.shippingCost),
        total: Number(order.total),
        orderItems: order.orderItems.map(item => ({
          ...item,
          price: Number(item.price),
          product: {
            ...item.product,
          }
        }))
      }))

      return NextResponse.json({
        success: true,
        data: serializedOrders,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: skip + orders.length < totalCount,
          hasPrev: page > 1
        }
      })
    }

    // Require authentication for user-specific orders
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build where clause for authenticated users
    const whereClause: any = {
      userId: session.user.id
    }

    // Add search filter
    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { orderItems: { some: { product: { name: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    // Add status filter
    if (status && status !== 'ALL') {
      whereClause.status = status
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    const totalCount = await prisma.order.count({
      where: whereClause
    })

    // Convert Decimal fields to numbers for client serialization
    const serializedOrders = orders.map(order => ({
      ...order,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          // Note: product price not included in this select, but if it was:
          // price: Number(item.product.price),
        }
      }))
    }))

    return NextResponse.json({
      success: true,
      data: serializedOrders,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: skip + orders.length < totalCount,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    // console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
  })
}