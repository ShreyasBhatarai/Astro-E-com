'use client'

import { useRouter } from 'next/navigation'
import { ProductPagination } from '@/components/ui/product-pagination'

interface ProductsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  searchParams: Record<string, string>
  className?: string
}

export function ProductsPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  searchParams,
  className
}: ProductsPaginationProps) {
  const router = useRouter()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    router.push(`/products?${params.toString()}`)
  }

  return (
    <ProductPagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      className={className}
    />
  )
}