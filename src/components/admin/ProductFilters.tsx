'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminProductFilters, Category } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Filter, X, Search, Loader2 } from 'lucide-react'

interface ProductFiltersProps {
  filters: AdminProductFilters
}

export function ProductFilters({ filters }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data)
        }
      } catch (error) {
        // console.error('Error fetching categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])


  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== '') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`/admin/products?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/products')
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.category) count++
    if (filters.brand) count++
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.stockStatus) count++
    if (filters.status) count++
    if (filters.isFeatured !== undefined) count++
    if (filters.search) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="space-y-4">
      {/* Desktop Filters */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category */}
            <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {loadingCategories ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Stock Status */}
            <Select value={filters.stockStatus || 'all'} onValueChange={(value) => updateFilter('stockStatus', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Featured */}
            <Select 
              value={filters.isFeatured === undefined ? 'all' : filters.isFeatured.toString()} 
              onValueChange={(value) => updateFilter('isFeatured', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Featured" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="true">Featured Only</SelectItem>
                <SelectItem value="false">Not Featured</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-')
              updateFilter('sortBy', sortBy)
              updateFilter('sortOrder', sortOrder)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low to High</SelectItem>
                <SelectItem value="price-desc">Price High to Low</SelectItem>
                <SelectItem value="stock-asc">Stock Low to High</SelectItem>
                <SelectItem value="stock-desc">Stock High to Low</SelectItem>
              </SelectContent>
            </Select>
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
              <SheetTitle>Filter Products</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 mt-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                <Select value={filters.category || 'all'} onValueChange={(value) => updateFilter('category', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {loadingCategories ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Stock Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Stock Status</label>
                <Select value={filters.stockStatus || 'all'} onValueChange={(value) => updateFilter('stockStatus', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stock status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Featured */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Featured</label>
                <Select 
                  value={filters.isFeatured === undefined ? 'all' : filters.isFeatured.toString()} 
                  onValueChange={(value) => updateFilter('isFeatured', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select featured status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="true">Featured Only</SelectItem>
                    <SelectItem value="false">Not Featured</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
                <Select value={`${filters.sortBy}-${filters.sortOrder}`} onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  updateFilter('sortBy', sortBy)
                  updateFilter('sortOrder', sortOrder)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="price-asc">Price Low to High</SelectItem>
                    <SelectItem value="price-desc">Price High to Low</SelectItem>
                    <SelectItem value="stock-asc">Stock Low to High</SelectItem>
                    <SelectItem value="stock-desc">Stock High to Low</SelectItem>
                  </SelectContent>
                </Select>
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