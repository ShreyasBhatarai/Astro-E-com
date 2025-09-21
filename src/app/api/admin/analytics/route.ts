import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole, OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Basic metrics
    const [
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      newUsers,
      newOrders,
      deliveredOrders
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total products
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // Total orders
      prisma.order.count(),
      
      // Total revenue from delivered orders
      prisma.order.aggregate({
        where: { status: OrderStatus.DELIVERED },
        _sum: { total: true }
      }),
      
      // New users in period
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // New orders in period
      prisma.order.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Delivered orders count
      prisma.order.count({
        where: { status: OrderStatus.DELIVERED }
      })
    ])

    // Order status distribution
    const orderStatusDistribution = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const totalOrdersForDistribution = orderStatusDistribution.reduce(
      (sum, item) => sum + item._count.status, 0
    )

    const statusDistribution = orderStatusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalOrdersForDistribution > 0 
        ? (item._count.status / totalOrdersForDistribution) * 100 
        : 0
    }))

    // Top selling products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _avg: { price: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    })

    const productIds = topProducts.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        reviews: {
          select: {
            rating: true
          }
        }
      }
    })

    const topProductsWithDetails = topProducts.map(item => {
      const product = products.find(p => p.id === item.productId)
      if (product) {
        const ratings = product.reviews.map(r => r.rating)
        const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
        const reviewCount = ratings.length
        
        return {
          product: { ...product, reviews: undefined },
          totalSold: item._sum.quantity || 0,
          revenue: (item._sum.quantity || 0) * Number(item._avg.price || 0),
          averageRating: Number(averageRating.toFixed(1)),
          reviewCount
        }
      }
      return {
        product: { id: item.productId, name: 'Unknown Product', price: 0, images: [] },
        totalSold: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * Number(item._avg.price || 0),
        averageRating: 0,
        reviewCount: 0
      }
    })

    // Recent orders (optimized for display)
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        shippingName: true,
        shippingPhone: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Sales trend (last 7 days)
    const salesTrend: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayOrders = await prisma.order.aggregate({
        where: {
          createdAt: { gte: date, lt: nextDay },
          status: OrderStatus.DELIVERED
        },
        _sum: { total: true },
        _count: { id: true }
      })
      
      salesTrend.push({
        date: date.toISOString().split('T')[0],
        revenue: Number(dayOrders._sum.total || 0),
        orders: dayOrders._count.id
      })
    }

    // User registration trend (last 7 days)
    const userTrend: { date: string; users: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayUsers = await prisma.user.count({
        where: {
          createdAt: { gte: date, lt: nextDay }
        }
      })
      
      userTrend.push({
        date: date.toISOString().split('T')[0],
        users: dayUsers
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: Number(totalRevenue._sum.total || 0),
          newUsers,
          newOrders,
          deliveredOrders,
          averageOrderValue: totalOrders > 0 
            ? Number(totalRevenue._sum.total || 0) / deliveredOrders 
            : 0
        },
        orderStatusDistribution: statusDistribution,
        topProducts: topProductsWithDetails,
        recentOrders: recentOrders.map(order => ({
          ...order,
          total: Number(order.total)
        })),
        salesTrend,
        userTrend,
        period: daysAgo
      }
    })
  } catch (error) {
    // console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}