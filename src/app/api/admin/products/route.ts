import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminProducts, createProduct } from '@/lib/queries/admin-products'
import { AdminApiResponse, CreateProductData, AdminProductFilters } from '@/types'

// GET /api/admin/products - Get paginated products with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    // Parse query parameters with proper handling of filter values
    const categoryParam = searchParams.get('category')
    const brandParam = searchParams.get('brand')
    const statusParam = searchParams.get('status')
    const stockStatusParam = searchParams.get('stockStatus')
    const isFeaturedParam = searchParams.get('isFeatured')
    
    const filters: AdminProductFilters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      category: categoryParam && categoryParam !== 'all' ? categoryParam : undefined,
      brand: brandParam && brandParam !== 'all' ? brandParam : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      stockStatus: stockStatusParam && stockStatusParam !== 'all' ? stockStatusParam as 'in_stock' | 'low_stock' | 'out_of_stock' : undefined,
      status: statusParam && statusParam !== 'all' ? statusParam as 'active' | 'inactive' : undefined,
      isFeatured: isFeaturedParam && isFeaturedParam !== 'all' ? isFeaturedParam === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'stock' | 'createdAt') || 'name',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc'
    }

    // console.log('Admin products API filters:', filters)

    // Disallow "newest first" (createdAt-desc). Coerce to a supported default.
    const safeFilters: AdminProductFilters = (filters.sortBy === 'createdAt' && filters.sortOrder === 'desc')
      ? { ...filters, sortBy: 'name', sortOrder: 'asc' }
      : filters

    const result = await getAdminProducts(safeFilters)

    return NextResponse.json(result as AdminApiResponse)
  } catch (error) {
    // console.error('Error fetching admin products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate required fields (schema requires these non-null)
    const requiredFields = ['name', 'description', 'price', 'originalPrice', 'costPrice', 'stock', 'categoryId', 'brand', 'weight']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` } as AdminApiResponse,
          { status: 400 }
        )
      }
    }

    // Validate price and stock are positive numbers
    if (body.price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be greater than 0' } as AdminApiResponse,
        { status: 400 }
      )
    }

    if (body.stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock cannot be negative' } as AdminApiResponse,
        { status: 400 }
      )
    }

    const productData: CreateProductData = {
      name: body.name,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      costPrice: body.costPrice,
      sku: body.sku || undefined,
      stock: body.stock,
      images: body.images || [],
      categoryId: body.categoryId,
      brand: body.brand,
      weight: body.weight,
      dimensions: body.dimensions || undefined,
      specifications: body.specifications || undefined,
      isActive: body.isActive !== undefined ? body.isActive : true,
      isFeatured: body.isFeatured !== undefined ? body.isFeatured : false,
      tags: body.tags || []
    }

    const product = await createProduct(productData)

    return NextResponse.json(
      { success: true, data: product, message: 'Product created successfully' } as AdminApiResponse,
      { status: 201 }
    )
  } catch (error) {
    // console.error('Error creating product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as AdminApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' } as AdminApiResponse,
      { status: 500 }
    )
  }
}