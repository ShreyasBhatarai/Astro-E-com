import { notFound } from 'next/navigation'
import { getAdminProductById } from '@/lib/queries/admin-products'
import { ProductForm } from '@/components/admin/ProductForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeleteProductDialog } from '@/components/admin/DeleteProductDialog'

interface EditProductPageProps {
  params: {
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const resolvedParams = await params
  const productData = await getAdminProductById(resolvedParams.id)

  if (!productData) {
    notFound()
  }

  // Convert Decimal objects to numbers for client component serialization
  const product = {
    ...productData,
    price: Number(productData.price),
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
    costPrice: productData.costPrice ? Number(productData.costPrice) : null,
    weight: productData.weight ? Number(productData.weight) : null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
            
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600">Update product information</p>
            </div>
          </div>
        </div>
        
        <DeleteProductDialog 
          product={product}
          trigger={
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Product
            </Button>
          }
        />
      </div>

      {/* Product Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <p className="text-gray-600">{new Date(product.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Last Updated:</span>
            <p className="text-gray-600">{new Date(product.updatedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">SKU:</span>
            <p className="text-gray-600">{product.sku || 'Not set'}</p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProductForm mode="edit" product={product} />
      </div>
    </div>
  )
}