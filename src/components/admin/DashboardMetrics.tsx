'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AdminDashboardMetrics } from '@/types'
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Trophy,
  Star
} from 'lucide-react'
import Image from 'next/image'

interface DashboardMetricsProps {
  metrics: AdminDashboardMetrics
  isLoading?: boolean
}

export function DashboardMetrics({ metrics, isLoading }: DashboardMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const metricCards = [
    {
      title: 'Total Products',
      value: metrics.totalProducts,
      icon: Package,
      description: 'Active products in catalog',
      trend: null,
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders,
      icon: ShoppingCart,
      description: 'All time orders',
      trend: null,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      description: 'Revenue from delivered orders',
      trend: null,
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(metrics.avgOrderValue),
      icon: TrendingUp,
      description: 'Average order amount',
      trend: null,
    },
  ]

  const getTrendIcon = (trend: number | null) => {
    if (trend === null) return Minus
    if (trend > 0) return TrendingUp
    if (trend < 0) return TrendingDown
    return Minus
  }

  const getTrendColor = (trend: number | null) => {
    if (trend === null) return 'text-muted-foreground'
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metricCards.map((metric, index) => {
        const TrendIcon = getTrendIcon(metric.trend)
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendIcon className={`h-3 w-3 ${getTrendColor(metric.trend)}`} />
                <span>{metric.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function OrderStatusDistribution({ metrics }: { metrics: AdminDashboardMetrics }) {
  const totalOrders = metrics.orderStatusDistribution.reduce((sum, item) => sum + item.count, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { dot: 'bg-yellow-500', bar: 'bg-yellow-500' }
      case 'PROCESSING':
        return { dot: 'bg-blue-500', bar: 'bg-blue-500' }
      case 'PACKAGED':
        return { dot: 'bg-purple-500', bar: 'bg-purple-500' }
      case 'SHIPPED':
        return { dot: 'bg-indigo-500', bar: 'bg-indigo-500' }
      case 'DELIVERED':
        return { dot: 'bg-green-500', bar: 'bg-green-500' }
      case 'CANCELLED':
        return { dot: 'bg-red-500', bar: 'bg-red-500' }
      case 'FAILED':
        return { dot: 'bg-gray-500', bar: 'bg-gray-500' }
      default:
        return { dot: 'bg-gray-400', bar: 'bg-gray-400' }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.orderStatusDistribution.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No orders yet</h3>
            <p className="text-muted-foreground">
              Order status distribution will appear here once you have orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.orderStatusDistribution.map((item) => {
              const colors = getStatusColor(item.status)
              return (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${colors.dot}`} />
                    <span className="text-sm font-medium capitalize">
                      {item.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {item.count} ({item.percentage.toFixed(1)}%)
                    </span>
                    <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bar} transition-all duration-300`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function TopProducts({ metrics }: { metrics: AdminDashboardMetrics }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {metrics.topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No sales data</h3>
            <p className="text-muted-foreground">
              Top selling products will appear here once you have sales.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {metrics.topProducts.slice(0, 5).map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative h-10 w-10 rounded-lg bg-gray-100 flex-shrink-0">
                    {item.product.images && item.product.images.length > 0 ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover rounded-lg"
                        sizes="40px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 rounded-lg">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium border-2 border-white">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium line-clamp-2 text-wrap">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.totalSold} units sold
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {(item as any).averageRating || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(item as any).reviewCount || 0} reviews
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}