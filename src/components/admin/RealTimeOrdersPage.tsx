'use client'

import { useState, useEffect, useCallback } from 'react'
import { OrdersTable } from '@/components/admin/OrdersTable'
import { OrderFilters } from '@/components/admin/OrderFilters'
import { Button } from '@/components/ui/button'
import { ShoppingCart, RefreshCw } from 'lucide-react'
import { AdminOrderFilters, AdminOrderWithDetails, PaginatedResponse } from '@/types'
import { toast } from 'sonner'

interface RealTimeOrdersPageProps {
  initialData: PaginatedResponse<AdminOrderWithDetails>
  initialFilters: AdminOrderFilters
}

export function RealTimeOrdersPage({ initialData, initialFilters }: RealTimeOrdersPageProps) {
  const [orders, setOrders] = useState<AdminOrderWithDetails[]>(initialData.data || [])
  const [pagination, setPagination] = useState(initialData.pagination)
  const [filters, setFilters] = useState(initialFilters)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastOrderCount, setLastOrderCount] = useState(initialData.pagination.total)

  const fetchOrders = useCallback(async (showLoading = false, showTableLoading = false) => {
    if (showLoading) setIsRefreshing(true)
    if (showTableLoading) setIsLoading(true)
    
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.status) params.append('status', filters.status)
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod)
      if (filters.search) params.append('search', filters.search)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toISOString())
      if (filters.dateTo) params.append('dateTo', filters.dateTo.toISOString())

      const response = await fetch(`/api/admin/orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch orders')

      const result = await response.json()
      if (result.success) {
        const newOrderCount = result.pagination.total
        
        // Check if there are new orders
        if (newOrderCount > lastOrderCount) {
          toast.success(`${newOrderCount - lastOrderCount} new order(s) received!`)
          setOrders(result.data || [])
          setPagination(result.pagination)
          setLastOrderCount(newOrderCount)
        } else if (newOrderCount !== lastOrderCount || showLoading) {
          // Update if count changed or manual refresh
          setOrders(result.data || [])
          setPagination(result.pagination)
          setLastOrderCount(newOrderCount)
        }
        // If no changes and not manual refresh, don't update to avoid unnecessary re-renders
      }
    } catch (error) {
      // console.error('Error fetching orders:', error)
      if (showLoading) {
        toast.error('Failed to refresh orders')
      }
    } finally {
      if (showLoading) setIsRefreshing(false)
      setIsLoading(false)
    }
  }, [filters, lastOrderCount])

  // Trigger loading when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(false, true)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [filters.search, filters.status, filters.paymentMethod, filters.dateFrom, filters.dateTo])

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(false) // Don't show loading for auto-refresh
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleManualRefresh = () => {
    fetchOrders(true) // Show loading for manual refresh
  }

  // Listen for URL changes to update filters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const newFilters: AdminOrderFilters = {
      page: params.get('page') ? parseInt(params.get('page')!) : 1,
      limit: params.get('limit') ? parseInt(params.get('limit')!) : 20,
      status: params.get('status') as any,
      paymentMethod: params.get('paymentMethod') as any,
      search: params.get('search') || undefined,
      sortBy: (params.get('sortBy') as any) || 'createdAt',
      sortOrder: (params.get('sortOrder') as any) || 'desc',
      dateFrom: params.get('dateFrom') ? new Date(params.get('dateFrom')!) : undefined,
      dateTo: params.get('dateTo') ? new Date(params.get('dateTo')!) : undefined,
    }
    
    // Only update if filters actually changed
    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      setFilters(newFilters)
      fetchOrders(true)
    }
  }, [filters, fetchOrders])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Manage customer orders and track fulfillment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>


      {/* Filters */}
      <OrderFilters filters={filters} />

      {/* Orders Table */}
      <OrdersTable 
        orders={orders} 
        pagination={pagination}
        loading={isLoading}
      />
    </div>
  )
}