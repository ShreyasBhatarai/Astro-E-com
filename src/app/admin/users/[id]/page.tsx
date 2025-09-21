'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingCart, Star, Package, Eye, Loader2 } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { PageLoader } from '@/components/ui/loader'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

interface UserOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  orderItems: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
      images: string[]
    }
  }[]
}

interface UserReview {
  id: string
  rating: number
  title: string
  comment: string
  createdAt: string
  product: {
    name: string
    images: string[]
  }
}

interface PaginationInfo {
  page: number
  totalPages: number
  totalItems: number
  hasNext: boolean
  hasPrev: boolean
}

interface UserDetailData {
  user: UserDetail
  orders: {
    data: UserOrder[]
    pagination: PaginationInfo
  }
  reviews: {
    data: UserReview[]
    pagination: PaginationInfo
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<UserDetail | null>(null)
  const [orders, setOrders] = useState<{ data: UserOrder[], pagination: PaginationInfo } | null>(null)
  const [reviews, setReviews] = useState<{ data: UserReview[], pagination: PaginationInfo } | null>(null)
  const [activeTab, setActiveTab] = useState('orders')
  const [ordersPage, setOrdersPage] = useState(1)
  const [reviewsPage, setReviewsPage] = useState(1)
  const [ordersLimit, setOrdersLimit] = useState(10)
  const [reviewsLimit, setReviewsLimit] = useState(10)
  const [tabLoading, setTabLoading] = useState(false)

  const fetchUserInfo = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/users/${params.id}?infoOnly=true`)
      if (response.ok) {
        const data = await response.json()
        setUserInfo(data.data.user)
      } else {
        // console.error('Failed to fetch user info')
      }
    } catch (error) {
      // console.error('Error fetching user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTabData = async (tab: string) => {
    setTabLoading(true)
    try {
      const page = tab === 'orders' ? ordersPage : reviewsPage
      const limit = tab === 'orders' ? ordersLimit : reviewsLimit
      const response = await fetch(`/api/admin/users/${params.id}?tab=${tab}&page=${page}&limit=${limit}`)
      if (response.ok) {
        const data = await response.json()
        if (tab === 'orders') {
          setOrders(data.data.orders)
        } else {
          setReviews(data.data.reviews)
        }
      } else {
        // console.error(`Failed to fetch ${tab} data`)
      }
    } catch (error) {
      // console.error(`Error fetching ${tab} data:`, error)
    } finally {
      setTabLoading(false)
    }
  }

  useEffect(() => {
    fetchUserInfo()
    fetchTabData(activeTab)
  }, [params.id])

  useEffect(() => {
    if (userInfo) {
      fetchTabData(activeTab)
    }
  }, [activeTab, ordersPage, reviewsPage, ordersLimit, reviewsLimit])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if ((tab === 'orders' && !orders) || (tab === 'reviews' && !reviews)) {
      fetchTabData(tab)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING': return 'bg-blue-100 text-blue-800'
      case 'PACKAGED': return 'bg-purple-100 text-purple-800'
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800'
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'FAILED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return <PageLoader />
  }

  if (!userInfo) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
        <Button onClick={() => router.push('/admin/users')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/users')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
         
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600">{userInfo.name}</p>
          </div>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900 mt-1">{userInfo.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900 mt-1">{userInfo.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone</label>
              <p className="text-gray-900 mt-1">{userInfo.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="mt-1">
                <Badge variant={userInfo.role === 'ADMIN' ? 'destructive' : 'default'}>
                  {userInfo.role}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Member Since</label>
              <p className="text-gray-900 mt-1">{formatDateTime(userInfo.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Last Login</label>
              <p className="text-gray-900 mt-1">
                {userInfo.lastLoginAt ? formatDateTime(userInfo.lastLoginAt) : 'Never'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Orders and Reviews */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders ({orders?.pagination.totalItems || 0})
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Reviews ({reviews?.pagination.totalItems || 0})
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {tabLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !orders || orders.data.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders?.data.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(order.total)}
                            </TableCell>
                            <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/admin/orders/${order.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {orders.data.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">#{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-medium">{formatCurrency(order.total)}</div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/admin/orders/${order.id}`}>View</Link>
                          </Button>
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Orders Pagination */}
                  <div className="mt-6">
                    <PaginationWithRows
                      currentPage={orders?.pagination.page || 1}
                      totalPages={orders?.pagination.totalPages || 1}
                      totalItems={orders?.pagination.totalItems || 0}
                      itemsPerPage={ordersLimit}
                      onPageChange={(page) => setOrdersPage(page)}
                      onRowsChange={(limit) => {
                        setOrdersLimit(limit)
                        setOrdersPage(1)
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews">
          <Card>
            <CardHeader>
              <CardTitle>Reviews & Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              {tabLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !reviews || reviews.data.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews?.data.map((review) => (
                    <div key={review.id} className="border rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {review.product.images.length > 0 ? (
                            <Image
                              src={review.product.images[0]}
                              alt={review.product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900">{review.product.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                {renderStarRating(review.rating)}
                                <span className="text-sm text-gray-600">
                                  {formatDateTime(review.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {review.title && (
                            <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                          )}
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Reviews Pagination */}
                  <div className="mt-6">
                    <PaginationWithRows
                      currentPage={reviews?.pagination.page || 1}
                      totalPages={reviews?.pagination.totalPages || 1}
                      totalItems={reviews?.pagination.totalItems || 0}
                      itemsPerPage={reviewsLimit}
                      onPageChange={(page) => setReviewsPage(page)}
                      onRowsChange={(limit) => {
                        setReviewsLimit(limit)
                        setReviewsPage(1)
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}