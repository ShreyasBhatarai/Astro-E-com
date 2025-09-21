import { NextRequest, NextResponse } from 'next/server'
import { getProducts, getProductsByIds } from '@/lib/queries/products'
import { ProductFilters, ApiResponse } from '@/types'

// Helper functions to sanitize numeric parameters
function sanitizeNumber(value: string | null, defaultValue: number, min?: number, max?: number): number {
  if (!value) return defaultValue
  const parsed = Number(value)
  if (isNaN(parsed)) return defaultValue
  if (min !== undefined && parsed < min) return min
  if (max !== undefined && parsed > max) return max
  return parsed
}

function sanitizeOptionalNumber(value: string | null, min?: number, max?: number): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  if (isNaN(parsed)) return undefined
  if (min !== undefined && parsed < min) return undefined
  if (max !== undefined && parsed > max) return undefined
  return parsed
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and sanitize query parameters
    const filters: ProductFilters = {
      category: searchParams.get('category') || '',
      minPrice: sanitizeOptionalNumber(searchParams.get('minPrice'), 0, 1000000),
      maxPrice: sanitizeOptionalNumber(searchParams.get('maxPrice'), 0, 1000000),
      search: searchParams.get('search') || '',
      sort: searchParams.get('sort') || 'createdAt',
      order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
      page: sanitizeNumber(searchParams.get('page'), 1, 1, 1000),
      limit: sanitizeNumber(searchParams.get('limit'), 12, 1, 50),
      rating: sanitizeOptionalNumber(searchParams.get('rating'), 1, 5),
      brand: searchParams.get('brand') || ''
    }

    // Handle specific product IDs request (for wishlist)
    const ids = searchParams.get('ids')
    if (ids) {
      const productIds = ids.split(',').filter(Boolean)
      const products = await getProductsByIds(productIds)
      
      return NextResponse.json({
        success: true,
        data: products,
        message: 'Products fetched successfully'
      })
    }

    const result = await getProducts(filters)

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      message: 'Products fetched successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    // console.error('Error fetching products:', error)
    
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch products'
    }

    return NextResponse.json(response, { status: 500 })
  }
}