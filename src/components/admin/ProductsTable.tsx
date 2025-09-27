'use client'

import { useState } from 'react'
import { Product, Category, PaginatedResponse, AdminProductFilters } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Eye, Package, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'
import { PageLoader } from '@/components/ui/loader'

interface ProductsTableProps {
  products: (Product & { category: { id: string; name: string; slug: string } })[]
  pagination: PaginatedResponse<any>['pagination']
  filters: AdminProductFilters
  loading?: boolean
}

export function ProductsTable({ products, pagination, loading = false }: ProductsTableProps) {
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set())



  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    setUpdatingProducts(prev => new Set([...prev, productId]))
    
    try {
      const response = await fetch(`/api/admin/products/${productId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        toast.error('Failed to update product status')
      }
    } catch (error) {
      // console.error('Error toggling product status:', error)
      toast.error('Failed to update product status')
    } finally {
      setUpdatingProducts(prev => {
        const newSet = new Set(prev)
        newSet.delete(productId)
        return newSet
      })
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800' }
    if (stock <= 10) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' }
    return { status: 'In Stock', color: 'bg-green-100 text-green-800' }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <PageLoader />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 mb-4">Get started by creating your first product.</p>
        <Link href="/admin/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">


      {/* Desktop Table */}
      <div className=" overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: '30%' }}>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const stockStatus = getStockStatus(product.stock)
              return (
                <TableRow key={product.id}>
                  <TableCell style={{ width: '30%' }}>
                    <div className="flex items-center gap-3">
                      <div className="min-w-fit aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={60}
                            height={60}
                            className="aspect-square object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate line-clamp-2 text-wrap">{product.name}</div>
                        <div className="text-sm text-gray-600 truncate">{product.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge >{product.category.name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatCurrency(Number(product.price))}</div>
                      {product.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          {formatCurrency(Number(product.originalPrice))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={stockStatus.color}>
                        {stockStatus.status}
                      </Badge>
                      <span className="text-sm text-gray-600">{product.stock}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={product.isActive}
                        onCheckedChange={() => handleToggleActive(product.id, product.isActive)}
                        disabled={updatingProducts.has(product.id)}
                      />
                      <span className="text-sm text-gray-600">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.isFeatured ? (
                      <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>



      {/* Pagination */}
      <div className="p-4 border-t border-gray-200">
        <PaginationWithRows
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={(page) => {
            const url = new URL(window.location.href)
            url.searchParams.set('page', page.toString())
            window.location.href = url.toString()
          }}
          onRowsChange={(rows) => {
            const url = new URL(window.location.href)
            url.searchParams.set('limit', rows.toString())
            url.searchParams.set('page', '1')
            window.location.href = url.toString()
          }}
        />
      </div>
    </div>
  )
}