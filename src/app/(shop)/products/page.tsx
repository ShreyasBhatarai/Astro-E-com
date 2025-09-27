import React from 'react'
import { Metadata } from 'next'
import { getProducts, getCategories } from '@/lib/queries/products'
import { ProductsPageClient } from '@/components/products/ProductsPageClient'
import { ProductFilters } from '@/types'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface ProductsPageProps {
  searchParams: {
    category?: string
    minPrice?: string
    maxPrice?: string
    search?: string
    sort?: string
    order?: string
    page?: string
    rating?: string
    brand?: string
    inStock?: string
    isFeatured?: string
  }
}

export async function generateMetadata({ searchParams }: ProductsPageProps): Promise<Metadata> {
  const params = await searchParams
  const { category, search } = params
  
  let title = 'All Products'
  let description = 'Browse our complete collection of premium products'

  if (category) {
    title = `${category.charAt(0).toUpperCase() + category.slice(1)} Products`
    description = `Browse ${category} products`
  } else if (search) {
    title = `Search Results for "${search}"`
    description = `Search results for "${search}"`
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Parse search parameters (await required in Next.js 15)
  const params = await searchParams
  const filters: ProductFilters = {
    category: params.category || '',
    minPrice: params.minPrice ? Number(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
    search: params.search || '',
    sort: params.sort || 'createdAt',
    order: (params.order as 'asc' | 'desc') || 'desc',
    page: params.page ? Number(params.page) : 1,
    rating: params.rating ? Number(params.rating) : undefined,
    brand: params.brand || '',
    inStock: params.inStock === 'true' ? true : undefined,
    isFeatured: params.isFeatured === 'true' ? true : undefined
  }

  // Fetch data
  const [productsResult, categories] = await Promise.all([
    getProducts(filters),
    getCategories()
  ])

  const { data: products = [], pagination } = productsResult

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500  px-4 py-3 ">
            <li>
              <Link href="/" className="hover:text-astro-primary transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-300"><ChevronRight className="h-4 w-4" /></li>
            <li className="text-gray-900 font-medium">
              {filters.search 
                ? `${filters.search}`
                : filters.category 
                ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}`
                : 'All Products'
              }
            </li>
          </ol>
        </nav>

    
        <ProductsPageClient
          initialProducts={products}
          initialPagination={pagination}
          initialFilters={filters}
          categories={categories}
        />
      </div>
    </div>
  )
}