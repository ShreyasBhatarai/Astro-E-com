import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAdminOrders } from '@/lib/queries/admin-orders'
import { AdminApiResponse, AdminOrderFilters, OrderStatus } from '@/types'

// GET /api/admin/orders - Get paginated orders with filtering (latest-first)
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
    const statusParam = searchParams.get('status')

    const filters: AdminOrderFilters = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      status: statusParam && statusParam !== 'all' ? (statusParam as OrderStatus) : undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')! + 'T00:00:00.000Z') : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')! + 'T23:59:59.999Z') : undefined,
      search: searchParams.get('search') || undefined,
      sortBy: (searchParams.get('sortBy') as 'createdAt' | 'total' | 'status') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc' // Latest first
    }

    const result = await getAdminOrders(filters)

    return NextResponse.json(result as AdminApiResponse)
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' } as AdminApiResponse,
      { status: 500 }
    )
  }
}