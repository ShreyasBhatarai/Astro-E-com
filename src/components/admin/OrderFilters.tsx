'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminOrderFilters } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search, Calendar, Loader2 } from 'lucide-react'

interface OrderFiltersProps {
  filters: AdminOrderFilters
}

export function OrderFilters({ filters }: OrderFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Debounced URL update
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()
      
      if (localFilters.page) params.set('page', localFilters.page.toString())
      if (localFilters.limit) params.set('limit', localFilters.limit.toString())
      if (localFilters.status) params.set('status', localFilters.status)
      if (localFilters.paymentMethod) params.set('paymentMethod', localFilters.paymentMethod)
      if (localFilters.search) params.set('search', localFilters.search)
      if (localFilters.sortBy) params.set('sortBy', localFilters.sortBy)
      if (localFilters.sortOrder) params.set('sortOrder', localFilters.sortOrder)
      if (localFilters.dateFrom) params.set('dateFrom', localFilters.dateFrom.toISOString())
      if (localFilters.dateTo) params.set('dateTo', localFilters.dateTo.toISOString())

      const newUrl = `/admin/orders?${params.toString()}`
      if (window.location.pathname + window.location.search !== newUrl) {
        router.push(newUrl)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localFilters, router])

  const updateFilter = (key: keyof AdminOrderFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to page 1 when filters change
    }))
  }

  const clearFilters = () => {
    router.push('/admin/orders')
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (localFilters.status) count++
    if (localFilters.paymentMethod) count++
    if (localFilters.dateFrom) count++
    if (localFilters.dateTo) count++
    if (localFilters.search) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="space-y-4">
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={localFilters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status */}
            <Select value={localFilters.status || undefined} onValueChange={(value) => updateFilter('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PACKAGED">Packaged</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Method */}
            <Select value={localFilters.paymentMethod || undefined} onValueChange={(value) => updateFilter('paymentMethod', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COD">Cash on Delivery</SelectItem>
                <SelectItem value="ONLINE">Online Payment</SelectItem>
              </SelectContent>
            </Select>

            {/* Date From */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="From Date"
                value={localFilters.dateFrom ? localFilters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="pl-10"
              />
            </div>

            {/* Date To */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                placeholder="To Date"
                value={localFilters.dateTo ? localFilters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="pl-10"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Filters */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader>
              <SheetTitle>Filter Orders</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={localFilters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={localFilters.status || undefined} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="PACKAGED">Packaged</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Payment Method</label>
                <Select value={localFilters.paymentMethod || undefined} onValueChange={(value) => updateFilter('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="ONLINE">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">From Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={localFilters.dateFrom ? localFilters.dateFrom.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">To Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={localFilters.dateTo ? localFilters.dateTo.toISOString().split('T')[0] : ''}
                      onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Clear All
                </Button>
                <Button onClick={() => setIsOpen(false)} className="flex-1">
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}