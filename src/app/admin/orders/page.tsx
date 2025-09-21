import { getAdminOrders } from '@/lib/queries/admin-orders'
import { RealTimeOrdersPage } from '@/components/admin/RealTimeOrdersPage'
import { AdminOrderFilters, OrderStatus, PaymentMethod } from '@/types'

interface AdminOrdersPageProps {
  searchParams: {
    page?: string
    limit?: string
    status?: string
    paymentMethod?: string
    dateFrom?: string
    dateTo?: string
    search?: string
    sortBy?: string
    sortOrder?: string
  }
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  // Parse search params (await required in Next.js 15)
  const params = await searchParams
  const filters: AdminOrderFilters = {
    page: params.page ? parseInt(params.page) : 1,
    limit: params.limit ? parseInt(params.limit) : 20,
    status: params.status as OrderStatus | undefined,
    paymentMethod: params.paymentMethod as PaymentMethod | undefined,
    dateFrom: params.dateFrom ? new Date(params.dateFrom) : undefined,
    dateTo: params.dateTo ? new Date(params.dateTo) : undefined,
    search: params.search,
    sortBy: (params.sortBy as 'createdAt' | 'total' | 'status') || 'createdAt',
    sortOrder: (params.sortOrder as 'asc' | 'desc') || 'desc'
  }

  // Fetch initial data
  const result = await getAdminOrders(filters)
  
  if (!result.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load orders. Please try again.</p>
      </div>
    )
  }

  return (
    <RealTimeOrdersPage 
      initialData={result}
      initialFilters={filters}
    />
  )
}