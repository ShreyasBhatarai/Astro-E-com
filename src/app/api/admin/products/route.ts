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
    const filters: AdminProductFilters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      category: searchParams.get('category') || undefined,
      brand: searchParams.get('brand') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      stockStatus: searchParams.get('stockStatus') as 'in_stock' | 'low_stock' | 'out_of_stock' | undefined,
      status: searchParams.get('status') as 'active' | 'inactive' | undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : searchParams.get('isFeatured') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'name' | 'price' | 'stock' | 'createdAt') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    }

    const result = await getAdminProducts(filters)

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
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'stock', 'categoryId']
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
      originalPrice: body.originalPrice || undefined,
      sku: body.sku || undefined,
      stock: body.stock,
      images: body.images || [],
      categoryId: body.categoryId,
      brand: body.brand || undefined,
      weight: body.weight || undefined,
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