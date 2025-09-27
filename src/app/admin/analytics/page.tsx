'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  Calendar,
  Trophy,
  BarChart3,
  Target,
  Star
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface AnalyticsData {
  overview: {
    totalUsers: number
    totalProducts: number
    totalOrders: number
    totalRevenue: number
    newUsers: number
    newOrders: number
    deliveredOrders: number
    averageOrderValue: number
    totalProfit: number
  }
  orderStatusDistribution: Array<{
    status: string
    count: number
    percentage: number
  }>
  topProducts: Array<{
    product: {
      id: string
      slug: string
      name: string
      price: number
      images: string[]
    }
    totalSold: number
    revenue: number
  }>
  recentOrders: Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    user: {
      name: string | null
      email: string
    }
  }>
  salesTrend: Array<{
    date: string
    revenue: number
    orders: number
  }>
  userTrend: Array<{
    date: string
    users: number
  }>
  profitTrend: Array<{
    date: string
    profit: number
    margin: number
  }>
  period: number
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  PROCESSING: '#3b82f6',
  PACKAGED: '#8b5cf6',
  SHIPPED: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
  FAILED: '#dc2626'
}

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('7')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      if (!response.ok) {
        const errorText = await response.text()
        // console.error('Analytics API error:', response.status, errorText)
        throw new Error(`Failed to fetch analytics: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'API returned error')
      }
    } catch (error) {
      // console.error('Error fetching analytics:', error)
      toast.error('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Detailed insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>

            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <LoadingSpinner message="Loading analytics..." className="py-16" />
      )}

      {!loading && !data && (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Failed to load analytics data</p>
          </CardContent>
        </Card>
      )}

      {!loading && data && (
        <>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">+{data.overview.newUsers} new in last {period} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products in catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.overview.averageOrderValue)} per order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total Profit: {formatCurrency(data.overview.totalProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue vs Profit */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Profit</CardTitle>
          </CardHeader>
          <CardContent>
            {data.salesTrend.length > 0 || data.profitTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={(function(){
                  const map = new Map<string, any>()
                  data.salesTrend.forEach(d => {
                    const existing = map.get(d.date) || { date: d.date }
                    existing.revenue = d.revenue
                    existing.orders = d.orders
                    map.set(d.date, existing)
                  })
                  data.profitTrend.forEach(d => {
                    const existing = map.get(d.date) || { date: d.date }
                    existing.profit = d.profit
                    map.set(d.date, existing)
                  })
                  return Array.from(map.values()).sort((a,b) => a.date.localeCompare(b.date))
                })()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                    return value.toString()
                  }} />
                  <Tooltip labelFormatter={(value) => formatDate(value as string)} formatter={(value: any, name: string) => [
                    name === 'revenue' || name === 'profit' ? formatCurrency(value) : value,
                    name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Orders'
                  ]} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No trend data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>User Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {data.userTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.userTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDate} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(value) => formatDate(value as string)} formatter={(value: any) => [value, 'New Users']} />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px]">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No user data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {data.orderStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.orderStatusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => 
                      `${entry.status}: ${entry.percentage.toFixed(1)}%`
                    }
                    labelLine={false}
                    style={{ fontSize: '10px' }}
                  >
                    {data.orderStatusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [value, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[250px]">
                <Target className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No order data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Product</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length > 0 ? (
              <div className="space-y-4">
                {data.topProducts.map((item) => (
                  <div key={item.product.id} className="flex items-center cursor-pointer justify-between" onClick={() => router.push(`/products/${item.product.slug}`)}>
                    <div className="flex items-center space-x-3">
                      <div className="relative h-10 w-10 flex-shrink-0">
                        <Image
                          src={item.product.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-md"
                          sizes="40px"
                        />
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
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No product sales data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentOrders.length > 0 ? (
              <div className="space-y-4">
                {data.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center cursor-pointer justify-between" onClick={() => router.push(`/admin/orders/${order.id}`)}>
                    <div>
                      <p className="text-sm font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.user?.name || order.user?.email || 'Unknown User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(order.total))}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {order.status.toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}
    </div>
  )
}