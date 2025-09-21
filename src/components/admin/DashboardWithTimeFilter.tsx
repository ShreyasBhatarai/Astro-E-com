'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from 'lucide-react'
import { DashboardMetrics, OrderStatusDistribution, TopProducts } from './DashboardMetrics'
import { RecentOrdersTable } from './RecentOrdersTable'
import { PageLoader } from '@/components/ui/loader'
import { AdminDashboardMetrics } from '@/types'

const timeRanges = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: '365', label: 'Last year' },
  { value: 'all', label: 'All time' }
]

export function DashboardWithTimeFilter({ initialMetrics }: { initialMetrics: AdminDashboardMetrics }) {
  const [timeRange, setTimeRange] = useState('7')
  const [metrics, setMetrics] = useState<AdminDashboardMetrics>(initialMetrics)
  const [loading, setLoading] = useState(false)

  const fetchMetrics = async (days: string) => {
    setLoading(true)
    try {
      const params = days === 'all' ? '' : `?days=${days}`
      const response = await fetch(`/api/admin/dashboard${params}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.data)
      }
    } catch (error) {
      // console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (timeRange !== '7') { // Don't refetch for default
      fetchMetrics(timeRange)
    }
  }, [timeRange])

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your store performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="relative">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <PageLoader />
          </div>
          <div className="opacity-50">
            <DashboardMetrics metrics={metrics} />
            <div className="grid gap-6 md:grid-cols-2 mt-6">
              <OrderStatusDistribution metrics={metrics} />
              <TopProducts metrics={metrics} />
            </div>
            <div className="mt-6">
              <RecentOrdersTable orders={metrics.recentOrders} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Metrics Overview */}
          <DashboardMetrics metrics={metrics} />

          {/* Charts and Tables Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Order Status Distribution */}
            <OrderStatusDistribution metrics={metrics} />

            {/* Top Products */}
            <TopProducts metrics={metrics} />
          </div>

          {/* Recent Orders */}
          <RecentOrdersTable orders={metrics.recentOrders} />
        </>
      )}
    </div>
  )
}