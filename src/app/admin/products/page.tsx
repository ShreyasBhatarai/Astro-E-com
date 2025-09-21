import { Suspense } from 'react'
import { getAdminProducts } from '@/lib/queries/admin-products'
import { ProductsTable } from '@/components/admin/ProductsTable'
import { ProductFilters } from '@/components/admin/ProductFilters'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'
import { AdminProductFilters } from '@/types'

interface AdminProductsPageProps {
  searchParams: {
    page?: string
    limit?: string
    category?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    stockStatus?: string
    status?: string
    isFeatured?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  // Parse search params (await required in Next.js 15)
  const params = await searchParams
  const filters: AdminProductFilters = {
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 20,
    category: params.category,
    brand: params.brand,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    stockStatus: params.stockStatus as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined,
    status: params.status as 'active' | 'inactive' | undefined,
    isFeatured: params.isFeatured === 'true' ? true : params.isFeatured === 'false' ? false : undefined,
    search: params.search,
    sortBy: (params.sortBy as 'name' | 'price' | 'stock' | 'createdAt') || 'createdAt',
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc'
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
      <Suspense fallback={<ProductsTableSkeleton />}>
        <ProductsTableWrapper filters={filters} />
      </Suspense>
    </div>
  )
}

async function ProductsTableWrapper({ filters }: { filters: AdminProductFilters }) {
  try {
    const result = await getAdminProducts(filters)
    
    if (!result.success) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load products. Please try again.</p>
        </div>
      )
    }

    return (
      <ProductsTable 
        products={result.data || []} 
        pagination={result.pagination}
        filters={filters}
      />
    )
  } catch (error) {
    // console.error('Error loading products:', error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">An error occurred while loading products.</p>
      </div>
    )
  }
}

function ProductsTableSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {/* Table header skeleton */}
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
          
          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 py-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}