import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const daysParam = searchParams.get('days')
    
    // Calculate date range
    let dateFilter = {}
    if (daysParam && daysParam !== 'all') {
      const days = parseInt(daysParam)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      dateFilter = {
        createdAt: {
          gte: startDate
        }
      }
    }

    // Fetch metrics with date filtering
    const [
      totalProducts,
      totalOrders,
      totalRevenueResult,
      orderStatusCounts,
      recentOrders,
      topProductsData
    ] = await Promise.all([
      // Total products (not filtered by date)
      prisma.product.count({ where: { isActive: true } }),
      
      // Total orders (filtered by date)
      prisma.order.count({ where: dateFilter }),
      
      // Total revenue from delivered orders (filtered by date)
      prisma.order.aggregate({
        where: { 
          status: 'DELIVERED',
          ...dateFilter
        },
        _sum: { total: true }
      }),
      
      // Order status distribution (filtered by date)
      prisma.order.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: { status: true }
      }),
      
      // Recent orders (filtered by date, limited)
      prisma.order.findMany({
        where: dateFilter,
        include: {
          user: { select: { name: true, email: true } },
          orderItems: {
            include: {
              product: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Top products (filtered by date)
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: dateFilter
        },
        _sum: {
          quantity: true,
          price: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      })
    ])

    const totalRevenue = Number(totalRevenueResult._sum.total || 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Process order status distribution
    const orderStatusDistribution = orderStatusCounts.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
    }))

    // Process top products
    const topProductsPromises = topProductsData.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          reviews: {
            select: {
              rating: true
            }
          }
        }
      })
      if (product) {
        const ratings = product.reviews.map(r => r.rating)
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        const reviewCount = ratings.length
        
        return {
          product: {
            ...product,
            price: Number(product.price),
            originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
            weight: product.weight ? Number(product.weight) : null,
            reviews: undefined
          },
          totalSold: item._sum.quantity || 0,
          revenue: Number(item._sum.price || 0),
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount
        }
      }
      return null
    })

    const topProducts = (await Promise.all(topProductsPromises)).filter(Boolean)

    // Convert Decimal fields to numbers for serialization
    const serializedRecentOrders = recentOrders.map(order => ({
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shippingCost),
      orderItems: order.orderItems.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    }))

    const metrics = {
      totalProducts,
      totalOrders,
      totalRevenue,
      avgOrderValue,
      recentOrders: serializedRecentOrders,
      orderStatusDistribution,
      revenueByMonth: [], // Not implementing monthly revenue for now
      topProducts
    }

    return NextResponse.json({
      success: true,
      data: metrics
    })
  } catch (error) {
    // console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { message: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    )
  }
}