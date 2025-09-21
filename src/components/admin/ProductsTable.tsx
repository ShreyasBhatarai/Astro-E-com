'use client'

import { useState } from 'react'
import { Product, Category, PaginatedResponse, AdminProductFilters } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set())

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id))
    } else {
      setSelectedProducts([])
    }
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId])
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId))
    }
  }

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
      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Activate
              </Button>
              <Button variant="outline" size="sm">
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedProducts.length === products.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Product</TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category.name}</Badge>
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

      {/* Mobile Cards */}
      <div className="md:hidden p-4 space-y-4">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.stock)
          return (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                />
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                  <p className="text-sm text-gray-600">SKU: {product.sku || 'N/A'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{product.category.name}</Badge>
                    {getStatusBadge(product.isActive)}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(product.price))}</div>
                      <Badge className={`${stockStatus.color} text-xs`}>
                        {stockStatus.status} ({product.stock})
                      </Badge>
                    </div>
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
                  </div>
                </div>
              </div>
            </div>
          )
        })}
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