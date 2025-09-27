import { prisma } from '@/lib/prisma'
import { AdminDashboardMetrics, UserRole } from '@/types'
import { hash } from 'bcryptjs'
import { withErrorHandling } from '@/lib/error-handling'

export async function getDashboardMetrics(): Promise<AdminDashboardMetrics> {
  return withErrorHandling(async () => {
    try {
      // Get basic counts first
      const totalProducts = await prisma.product.count({
        where: { isActive: true }
      })

      const totalOrders = await prisma.order.count()

      // Calculate total revenue with error handling
      let totalRevenue = 0
      try {
        const revenueResult = await prisma.order.aggregate({
          _sum: {
            total: true
          },
          where: {
            status: {
              in: ['DELIVERED', 'SHIPPED']
            }
          }
        })
        totalRevenue = Number(revenueResult._sum.total || 0)
      } catch (error) {
        // console.error('Error calculating revenue:', error)
        totalRevenue = 0
      }

      // Get recent orders with error handling
      let recentOrders: any[] = []
      try {
        const orders = await prisma.order.findMany({
          include: {
            orderItems: {
              include: {
                product: true
              }
            },
            user: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Reduce to 5 to prevent overwhelming
        })

        // Convert Decimal fields to numbers
        recentOrders = orders.map(order => ({
          ...order,
          subtotal: Number(order.subtotal),
          total: Number(order.total),
          shippingCost: Number(order.shippingCost),
          orderItems: order.orderItems.map(item => ({
            ...item,
            price: Number(item.price),
            product: {
              id: item.product.id,
              name: item.product.name,
              price: Number(item.product.price),
              images: item.product.images,
              slug: (item.product as any).slug,
              stock: item.product.stock
            }
          }))
        }))
      } catch (error) {
        // console.error('Error fetching recent orders:', error)
        recentOrders = []
      }

      // Get order status distribution with error handling
      let orderStatusDistribution: any[] = []
      try {
        const orderStatusCounts = await prisma.order.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        })

        orderStatusDistribution = orderStatusCounts.map(item => ({
          status: item.status,
          count: item._count.status,
          percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
        }))
      } catch (error) {
        // console.error('Error fetching order status distribution:', error)
        orderStatusDistribution = []
      }

      // Simplified revenue by month without raw SQL
      let revenueByMonth: any[] = []
      try {
        // Get last 6 months of orders
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const monthlyOrders = await prisma.order.findMany({
          where: {
            createdAt: {
              gte: sixMonthsAgo
            },
            status: {
              in: ['DELIVERED', 'SHIPPED']
            }
          },
          select: {
            createdAt: true,
            total: true
          }
        })

        // Group by month in JavaScript
        const monthlyData: { [key: string]: number } = {}
        monthlyOrders.forEach(order => {
          const month = order.createdAt.toISOString().slice(0, 7) // YYYY-MM format
          monthlyData[month] = (monthlyData[month] || 0) + Number(order.total)
        })

        revenueByMonth = Object.entries(monthlyData)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => a.month.localeCompare(b.month))
      } catch (error) {
        // console.error('Error fetching monthly revenue:', error)
        revenueByMonth = []
      }

      // Get top products with error handling
      let topProducts: any[] = []
      try {
        const topProductsData = await prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: {
            quantity: true,
            price: true
          },
          orderBy: {
            _sum: {
              quantity: 'desc'
            }
          },
          take: 5 // Reduce to 3 to prevent issues
        })

        const productPromises = topProductsData.map(async (item) => {
          try {
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
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  images: product.images,
                  slug: product.slug,
                  stock: product.stock
                },
                totalSold: item._sum.quantity || 0,
                revenue: Number(item._sum.price || 0),
                averageRating: Number(averageRating.toFixed(1)),
                reviewCount
              }
            }
            return null
          } catch (error) {
            // console.error('Error fetching product:', error)
            return null
          }
        })

        const results = await Promise.all(productPromises)
        topProducts = results.filter(Boolean)
      } catch (error) {
        // console.error('Error fetching top products:', error)
        topProducts = []
      }

      // Calculate average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      return {
        totalProducts,
        totalOrders,
        totalRevenue,
        avgOrderValue,
        recentOrders,
        orderStatusDistribution,
        revenueByMonth,
        topProducts
      }
    } catch (error) {
      // console.error('Error in getDashboardMetrics:', error)
      // Return safe defaults if everything fails
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        recentOrders: [],
        orderStatusDistribution: [],
        revenueByMonth: [],
        topProducts: []
      }
    }
  }, 'getDashboardMetrics')
}

export async function getRecentOrders(limit: number = 5) {
  try {
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        shippingName: true,
        shippingPhone: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    // Convert Decimal fields to numbers for client serialization
    return orders.map(order => ({
      ...order,
      total: Number(order.total)
    }))
  } catch (error) {
    // console.error('Error fetching recent orders:', error)
    throw new Error('Failed to fetch recent orders')
  }
}

export async function getOrderStatusDistribution() {
  try {
    const totalOrders = await prisma.order.count()
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    return statusCounts.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
    }))
  } catch (error) {
    // console.error('Error fetching order status distribution:', error)
    throw new Error('Failed to fetch order status distribution')
  }
}

export async function createAdminUser(email: string, password: string, name?: string) {
  try {
    const hashedPassword = await hash(password, 12)
    
    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'Admin User',
        role: UserRole.ADMIN,
      }
    })
  } catch (error) {
    // console.error('Error creating admin user:', error)
    throw new Error('Failed to create admin user')
  }
}

export async function updateUserLastLogin(userId: string) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    })
  } catch (error) {
    // console.error('Error updating last login:', error)
    throw new Error('Failed to update last login')
  }
}

export async function getAdminUsers() {
  try {
    return await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        email: true,
        name: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    // console.error('Error fetching admin users:', error)
    throw new Error('Failed to fetch admin users')
  }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const hashedPassword = await hash(newPassword, 12)
    
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })
  } catch (error) {
    // console.error('Error updating password:', error)
    throw new Error('Failed to update password')
  }
}
