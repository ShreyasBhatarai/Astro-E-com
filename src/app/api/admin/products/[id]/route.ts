import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminProductById, updateProduct, deleteProduct } from '@/lib/queries/admin-products'
import { AdminApiResponse, UpdateProductData } from '@/types'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const product = await getAdminProductById(resolvedParams.id)

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' } as AdminApiResponse,
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, data: product } as AdminApiResponse
    )
  } catch (error) {
    // console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate price if provided
    if (body.price !== undefined && body.price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be greater than 0' } as AdminApiResponse,
        { status: 400 }
      )
    }

    // Validate stock if provided
    if (body.stock !== undefined && body.stock < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock cannot be negative' } as AdminApiResponse,
        { status: 400 }
      )
    }

    const updateData: UpdateProductData = {
      name: body.name,
      description: body.description,
      price: body.price,
      originalPrice: body.originalPrice,
      costPrice: body.costPrice,
      sku: body.sku,
      stock: body.stock,
      images: body.images,
      categoryId: body.categoryId,
      brand: body.brand,
      weight: body.weight,
      dimensions: body.dimensions,
      specifications: body.specifications,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      tags: body.tags
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateProductData] === undefined) {
        delete updateData[key as keyof UpdateProductData]
      }
    })

    const resolvedParams2 = await params
    const product = await updateProduct(resolvedParams2.id, updateData)

    return NextResponse.json(
      { success: true, data: product, message: 'Product updated successfully' } as AdminApiResponse
    )
  } catch (error) {
    // console.error('Error updating product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as AdminApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update product' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// PATCH /api/admin/products/[id] - Partial update product
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const body = await request.json()
    const resolvedParams = await params

    // For partial updates, only update the fields provided
    const updateData: Partial<UpdateProductData> = {}

    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
    if (body.stock !== undefined) updateData.stock = body.stock
    if (body.price !== undefined) updateData.price = body.price
    if (body.costPrice !== undefined) updateData.costPrice = body.costPrice

    const product = await updateProduct(resolvedParams.id, updateData)

    return NextResponse.json(
      { success: true, data: product, message: 'Product updated successfully' } as AdminApiResponse
    )
  } catch (error) {
    console.error('Error updating product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as AdminApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update product' } as AdminApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product (soft delete)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as AdminApiResponse,
        { status: 401 }
      )
    }

    const resolvedParams3 = await params
    await deleteProduct(resolvedParams3.id)

    return NextResponse.json(
      { success: true, message: 'Product deleted successfully' } as AdminApiResponse
    )
  } catch (error) {
    // console.error('Error deleting product:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message } as AdminApiResponse,
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete product' } as AdminApiResponse,
      { status: 500 }
    )
  }
}