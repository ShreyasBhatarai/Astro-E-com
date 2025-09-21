'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductWithDetails, ProductFilters } from '@/types'
import { ProductGrid } from './ProductGrid'
import { FilterSidebar } from './FilterSidebar'
import { ProductsPagination } from './ProductsPagination'
import { PageLoader } from '@/components/ui/loader'
import { Package } from 'lucide-react'

interface ProductsPageClientProps {
  initialProducts: ProductWithDetails[]
  initialPagination: any
  initialFilters: ProductFilters
  categories: any[]
}

export function ProductsPageClient({ 
  initialProducts, 
  initialPagination, 
  initialFilters,
  categories 
}: ProductsPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<ProductWithDetails[]>(initialProducts)
  const [pagination, setPagination] = useState(initialPagination)
  const [filters, setFilters] = useState<ProductFilters>(initialFilters)
  const [loading, setLoading] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.category) params.append('category', filters.category)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.sort) params.append('sort', filters.sort)
      if (filters.order) params.append('order', filters.order)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.rating) params.append('rating', filters.rating.toString())
      if (filters.brand) params.append('brand', filters.brand)
      if (filters.inStock) params.append('inStock', 'true')
      if (filters.isFeatured) params.append('isFeatured', 'true')

      const response = await fetch(`/api/products?${params}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const result = await response.json()
      if (result.success) {
        setProducts(result.data.data || [])
        setPagination(result.data.pagination)
      }
    } catch (error) {
      // console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Update filters when URL params change
  useEffect(() => {
    const newFilters: ProductFilters = {
      category: searchParams.get('category') || '',
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'createdAt',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      brand: searchParams.get('brand') || '',
      inStock: searchParams.get('inStock') === 'true' ? true : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined
    }
    
    setFilters(newFilters)
  }, [searchParams])

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.search, filters.sort, filters.order, filters.page, filters.rating, filters.brand, filters.inStock, filters.isFeatured])

  return (
    <>
      {/* Products Layout */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <FilterSidebar 
            categories={categories}
            className="mb-8 lg:mb-0"
          />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          {/* Products Grid */}
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <PageLoader />
            </div>
          ) : products.length > 0 ? (
            <>
              <ProductGrid
                products={products}
                variant="products"
                className="mb-8"
              />
              
              {/* Pagination */}
              <ProductsPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                searchParams={Object.fromEntries(searchParams)}
                className="mt-8 border-t pt-8"
              />
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {filters.search ? 'No products found' : 'No products available'}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {filters.search
                  ? `We couldn't find any products matching "${filters.search}". Try adjusting your search or filters.`
                  : 'Products will appear here when they become available.'
                }
              </p>
              {filters.search && (
                <button
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.delete('search')
                    router.push(url.toString())
                  }}
                  className="mt-4 text-astro-primary hover:text-astro-primary-hover font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}