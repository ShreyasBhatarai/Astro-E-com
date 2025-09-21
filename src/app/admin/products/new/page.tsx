import { ProductForm } from '@/components/admin/ProductForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
          
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Package className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-600">Create a new product for your catalog</p>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ProductForm mode="create" />
      </div>
    </div>
  )
}