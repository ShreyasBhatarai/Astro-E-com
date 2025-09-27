'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { toast } from 'sonner'
import { Package, Plus } from 'lucide-react'
import Link from 'next/link'
import { ProductFilters } from '@/components/admin/ProductFilters'
import { useSearchParams } from 'next/navigation'
import { AdminProductFilters } from '@/types'
import { ProductsTable } from '@/components/admin/ProductsTable'

interface Product {
  id: string
  name: string
  slug: string
  description?: string
  sku?: string
  price: number
  originalPrice?: number
  stock: number
  isActive: boolean
  isFeatured: boolean
  images: string[]
  categoryId: string
  brand?: string
  weight?: number
  dimensions?: string
  specifications?: any
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  category: {
    id: string
    name: string
    slug: string
  }
  _count?: {
    reviews: number
    wishlist: number
  }
}

interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function AdminProductsPage() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Get filters from URL params
  const getFiltersFromParams = (): AdminProductFilters => {
    const filters: AdminProductFilters = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      stockStatus: searchParams.get('stockStatus') as 'in_stock' | 'low_stock' | 'out_of_stock' || undefined,
      status: searchParams.get('status') as 'active' | 'inactive' || undefined,
      isFeatured: searchParams.get('isFeatured') ? searchParams.get('isFeatured') === 'true' : undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'stock' | 'createdAt') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    }
    return filters
  }

  const [filters, setFilters] = useState<AdminProductFilters>(getFiltersFromParams())

  // Update filters when URL params change
  useEffect(() => {
    setFilters(getFiltersFromParams())
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.page) params.set('page', filters.page.toString())
      if (filters.limit) params.set('limit', filters.limit.toString())
      if (filters.search) params.set('search', filters.search)
      if (filters.category) params.set('category', filters.category)
      if (filters.stockStatus) params.set('stockStatus', filters.stockStatus)
      if (filters.status) params.set('status', filters.status)
      if (filters.isFeatured !== undefined) params.set('isFeatured', filters.isFeatured.toString())
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data: ProductsResponse = await response.json()
      setProducts(data.data)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [filters])



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>
        </div>
        <Link href="/admin/products/new">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <ProductFilters filters={filters} />

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products as any} pagination={pagination as any} filters={filters} loading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
