import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const userId = resolvedParams.id
    const { searchParams } = new URL(request.url)
    const infoOnly = searchParams.get('infoOnly') === 'true'
    const tab = searchParams.get('tab')
    const page = parseInt(searchParams.get('page') || '1')
    const ordersPage = parseInt(searchParams.get('ordersPage') || '1')
    const reviewsPage = parseInt(searchParams.get('reviewsPage') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Fetch user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // If only user info is requested
    if (infoOnly) {
      return NextResponse.json({
        success: true,
        data: { user }
      })
    }

    // If specific tab data is requested
    if (tab) {
      if (tab === 'orders') {
        const offset = (page - 1) * limit
        const [orders, ordersCount] = await Promise.all([
          prisma.order.findMany({
            where: { userId },
            include: {
              orderItems: {
                include: {
                  product: {
                    select: {
                      name: true,
                      images: true
                    }
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.order.count({ where: { userId } })
        ])

        
        // Convert Decimal fields to numbers for orders
        const serializedOrders = orders.map(order => ({
          ...order,
          total: Number(order.total),
          subtotal: Number(order.subtotal),
          shippingCost: Number(order.shippingCost),
          orderItems: order.orderItems.map(item => ({
            ...item,
            price: Number(item.price)
          }))
        }))

        return NextResponse.json({
          success: true,
          data: {
            orders: {
              data: serializedOrders,
              pagination: {
                page,
                totalPages: Math.ceil(ordersCount / limit),
                totalItems: ordersCount,
                hasNext: page < Math.ceil(ordersCount / limit),
                hasPrev: page > 1
              }
            }
          }
        })
      } else if (tab === 'reviews') {
        const offset = (page - 1) * limit
        const [reviews, reviewsCount] = await Promise.all([
          prisma.review.findMany({
            where: { userId },
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit
          }),
          prisma.review.count({ where: { userId } })
        ])

        return NextResponse.json({
          success: true,
          data: {
            reviews: {
              data: reviews,
              pagination: {
                page,
                totalPages: Math.ceil(reviewsCount / limit),
                totalItems: reviewsCount,
                hasNext: page < Math.ceil(reviewsCount / limit),
                hasPrev: page > 1
              }
            }
          }
        })
      }
    }

    // Fallback: return both orders and reviews (for backwards compatibility)
    const ordersLimit = 10
    const reviewsLimit = 10
    const ordersOffset = (ordersPage - 1) * ordersLimit
    const reviewsOffset = (reviewsPage - 1) * reviewsLimit
    
    const [orders, ordersCount, reviews, reviewsCount] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: ordersOffset,
        take: ordersLimit
      }),
      prisma.order.count({ where: { userId } }),
      prisma.review.findMany({
        where: { userId },
        include: {
          product: {
            select: {
              name: true,
              images: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: reviewsOffset,
        take: reviewsLimit
      }),
      prisma.review.count({ where: { userId } })
    ])

    // Convert Decimal fields to numbers for orders
    const serializedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    }))

    const responseData = {
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      },
      orders: {
        data: serializedOrders.map(order => ({
          ...order,
          createdAt: order.createdAt.toISOString()
        })),
        pagination: {
          page: ordersPage,
          totalPages: Math.ceil(ordersCount / ordersLimit),
          totalItems: ordersCount,
          hasNext: ordersPage < Math.ceil(ordersCount / ordersLimit),
          hasPrev: ordersPage > 1
        }
      },
      reviews: {
        data: reviews.map(review => ({
          ...review,
          createdAt: review.createdAt.toISOString()
        })),
        pagination: {
          page: reviewsPage,
          totalPages: Math.ceil(reviewsCount / reviewsLimit),
          totalItems: reviewsCount,
          hasNext: reviewsPage < Math.ceil(reviewsCount / reviewsLimit),
          hasPrev: reviewsPage > 1
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })
  } catch (error) {
    // console.error('Error fetching user details:', error)
    return NextResponse.json(
      { message: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}