'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface PaginationWithRowsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onRowsChange: (rows: number) => void
  className?: string
}

export function PaginationWithRows({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onRowsChange,
  className = ''
}: PaginationWithRowsProps) {
  const rowOptions = [5, 10, 20, 50]
  
  const handleRowsChange = (value: string) => {
    const rows = parseInt(value)
    onRowsChange(rows)
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()
  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`bg-white border-t ${className}`}>
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-4">
        
        {/* Left: Rows per page selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select value={itemsPerPage.toString()} onValueChange={handleRowsChange}>
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rowOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Center: Page info */}
        <div className="text-sm text-muted-foreground text-center">
          Showing {startItem} to {endItem} of {totalItems} entries
        </div>

        {/* Right: Pagination controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="h-8 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1 mx-2">
            {pageNumbers.map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              )
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="h-8 px-3"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}