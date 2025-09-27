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
      
      // Recent orders (filtered by date, limited) - minimal fields
      prisma.order.findMany({
        where: dateFilter,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          user: { select: { name: true } }
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

    // Process top products (minimal fields)
    const topProductsPromises = topProductsData.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, slug: true }
      })
      if (!product) return null

      const ratingAgg = await prisma.review.aggregate({
        where: { productId: item.productId },
        _avg: { rating: true },
        _count: { _all: true }
      })

      return {
        name: product.name,
        slug: product.slug,
        unitsSold: item._sum.quantity || 0,
        averageRating: Number((ratingAgg._avg.rating || 0).toFixed(1)),
        reviewCount: ratingAgg._count._all || 0
      }
    })

    const topProducts = (await Promise.all(topProductsPromises)).filter(Boolean) as any[]

    // Convert Decimal fields to numbers for serialization (minimal shape)
    const serializedRecentOrders = recentOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      userName: order.user?.name || 'Guest'
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