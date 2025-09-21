'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { Package, Plus, Edit, Eye, MoreHorizontal, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'
import { formatCurrency } from '@/lib/utils'
import { ProductFilters } from '@/components/admin/ProductFilters'
import { useSearchParams } from 'next/navigation'
import { AdminProductFilters } from '@/types'
import Image from 'next/image'

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
      sortBy: searchParams.get('sortBy') as 'name' | 'price' | 'stock' | 'createdAt' || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
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

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    )
  }

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (stock <= 10) {
      return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>
    }
  }

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
          {loading ? (
            <LoadingSpinner message="Loading products..." className="py-8" />
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No products found</h3>
              <p className="text-muted-foreground">
                {filters.search || filters.category || filters.stockStatus || filters.status || filters.isFeatured !== undefined
                  ? 'Try adjusting your search filters.' 
                  : 'No products have been added yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Product</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Price</th>
                      <th className="text-left p-4 font-medium">Stock</th>
                      <th className="text-left p-4 font-medium">Featured</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={product.images[0] || '/placeholder.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover rounded-md"
                                sizes="48px"
                              />
                            </div>
                            <div>
                              <div className="font-medium line-clamp-2 text-wrap max-w-xs">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge>{product.category.name}</Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span>{product.stock}</span>
                            {getStockBadge(product.stock)}
                          </div>
                        </td>
                        <td className="p-4">
                          {product.isFeatured ? (
                            <Badge>Featured</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={product.isActive}
                              onCheckedChange={async (checked) => {
                                try {
                                  const response = await fetch(`/api/admin/products/${product.id}`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isActive: checked })
                                  })
                                  if (response.ok) {
                                    fetchProducts()
                                  }
                                } catch (error) {
                                  console.error('Error updating product status:', error)
                                }
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Product
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/products/${product.slug}`} target="_blank">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Live
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this product?')) {
                                      // Handle delete
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <PaginationWithRows
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={filters.limit || 10}
                  onPageChange={(newPage) => {
                    setFilters(prev => ({ ...prev, page: newPage }))
                  }}
                  onRowsChange={(newLimit) => {
                    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }))
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
