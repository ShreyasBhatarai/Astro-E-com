import { notFound } from 'next/navigation'
import { getAdminOrderById } from '@/lib/queries/admin-orders'
import { OrderStatusUpdateDialog } from '@/components/admin/OrderStatusUpdateDialog'
import { ShippingUpdateForm } from '@/components/admin/ShippingUpdateForm'
import { OrderStatusTimeline } from '@/components/orders/OrderStatusTimeline'
import { OrderItemCard } from '@/components/admin/OrderItemCard'
import { OrderQrDialog } from '@/components/admin/OrderQrDialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ShoppingCart, CreditCard, Package, User, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderDetailPageProps {
  params: {
    id: string
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const resolvedParams = await params
  const order = await getAdminOrderById(resolvedParams.id)

  if (!order) {
    notFound()
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h1>
                <p className="text-gray-600">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrderQrDialog order={{
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              createdAt: order.createdAt,
              subtotal: Number(order.subtotal),
              shippingCost: Number(order.shippingCost),
              total: Number(order.total),
              shippingName: order.shippingName,
              shippingPhone: order.shippingPhone,
              shippingAddress: order.shippingAddress,
              shippingCity: order.shippingCity,
              shippingDistrict: order.shippingDistrict,
              shippingProvince: order.shippingProvince,
              user: { email: order.user?.email ?? null, name: order.user?.name ?? null, phone: order.user?.phone ?? null },
              orderItems: order.orderItems.map((it) => ({
                id: it.id,
                quantity: it.quantity,
                price: Number(it.price),
                product: { name: it.product.name, sku: it.product.sku || null },
              }))
            }} />
            <OrderStatusUpdateDialog
              orderId={order.id}
              currentStatus={order.status}
            />
          </div>
        </div>
        
        {/* Customer Information in Header */}
        {order.user && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Customer</p>
                  <p className="font-medium text-sm">{order.user.name || order.shippingName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-sm">{order.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-sm">{order.user.phone || order.shippingPhone || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Reason */}
      {(order.status === 'CANCELLED' || order.status === 'FAILED') && order.reason && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-red-600">
            <span className="font-medium">Reason:</span> {order.reason}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderItems.map((item) => (
                  <OrderItemCard key={item.id} item={{
                    id: item.id,
                    quantity: item.quantity,
                    price: Number(item.price),
                    product: {
                      id: item.product.id,
                      name: item.product.name,
                      sku: item.product.sku,
                      slug: item.product.slug,
                      images: item.product.images,
                    }
                  }} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Shipping Information */}
          <ShippingUpdateForm
            orderId={order.id}
            initialShippingCost={Number(order.shippingCost)}
            initialShippingAddress={order.shippingAddress}
            initialShippingCity={order.shippingCity}
            initialShippingDistrict={order.shippingDistrict}
            initialShippingProvince={order.shippingProvince}
        
          />

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(Number(order.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-medium">{formatCurrency(Number(order.shippingCost))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(Number(order.total))}</span>
              </div>
              <div className="pt-2">
                <span className="text-sm text-gray-600">Payment Method:</span>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              {order.notes && (
                <div className="pt-2">
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="text-sm text-gray-900 mt-1">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusTimeline 
                status={order.status}
                createdAt={order.createdAt}
                updatedAt={order.updatedAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}