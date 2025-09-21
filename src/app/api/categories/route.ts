import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/queries/products'
import { createApiErrorResponse, DatabaseConnectionError } from '@/lib/error-handling'

// GET /api/categories - Get all categories
export async function GET() {
  try {
    const categories = await getCategories()
    
    return NextResponse.json({
      success: true,
      data: categories
    })
  } catch (error) {
    // console.error('Error fetching categories:', error)
    
    const errorResponse = createApiErrorResponse(
      error instanceof Error ? error : new Error('Unknown error'),
      'Failed to fetch categories'
    )

    const statusCode = error instanceof DatabaseConnectionError ? 503 : 500

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}