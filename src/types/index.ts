import { User, Product, Order, OrderItem, Review, Wishlist, Banner, Category, OrderStatus, PaymentMethod, UserRole } from '@prisma/client'

// Base types from Prisma
export type { User, Product, Order, OrderItem, Review, Wishlist, Banner, Category }

// Extended types with relations
export interface ProductWithDetails extends Omit<Product, 'price' | 'originalPrice' | 'weight'> {
  price: number
  originalPrice: number | null
  weight: number | null
  reviews?: Review[]
  _count: {
    reviews: number
    wishlist: number
  }
  averageRating?: number
  reviewCount?: number
  category?: Category | { id: string; name: string; slug: string }
}

export interface CategoryWithCount extends Category {
  _count: {
    products: number
  }
}

// Optimized category type for API responses (only essential fields)
export interface OptimizedCategory {
  id: string
  name: string
  slug: string
  image: string | null
  _count: {
    products: number
  }
}

export interface OrderWithDetails extends Order {
  orderItems: (OrderItem & {
    product: Product
  })[]
  user: User
}

export interface UserWithOrders extends User {
  orders: Order[]
  reviews: Review[]
  wishlist: (Wishlist & {
    product: Product
  })[]
}

export interface ReviewWithUser extends Review {
  user: User
  product: Product
}

export interface WishlistWithProduct extends Wishlist {
  product: Product
}

// Re-export Prisma enums
export { OrderStatus, PaymentMethod, UserRole } from '@prisma/client'

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form types
export interface CreateOrderData {
  userId?: string
  status?: OrderStatus
  subtotal: number
  shipping: number
  total: number
  shippingName: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingDistrict: string
  shippingProvince: string
  shippingPostalCode?: string
  paymentMethod: PaymentMethod
  notes?: string
  orderNotes?: string
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  district?: string
  province?: string
  postalCode?: string
  items: {
    productId: string
    quantity: number
    price?: number
  }[]
}

export interface UpdateOrderData {
  status?: OrderStatus
  notes?: string
  shippedAt?: Date
  deliveredAt?: Date
}

export interface CreateOrderResponse {
  orderNumber: string
  accessToken: string
}

export interface CreateReviewData {
  productId: string
  rating: number
  title?: string
  comment?: string
}

export interface UpdateUserData {
  name?: string
  phone?: string
  email?: string
}

// Search and filter types
export interface ProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  isFeatured?: boolean
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface SortOptions {
  field: 'name' | 'price' | 'createdAt' | 'rating'
  order: 'asc' | 'desc'
}

// Mobile-specific types
export interface TouchEvent {
  touchStart: number
  touchEnd: number
  direction: 'left' | 'right' | 'up' | 'down' | null
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down'
  distance: number
  velocity: number
}

// Component props types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface LoadingState {
  isLoading: boolean
  error?: string
}

// Cart types (for client-side state)
export interface CartItem {
  id: string
  productId: string
  quantity: number
  product: Product
  price: number
}

export interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
  isLoading: boolean
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// Theme types
export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
}

// Analytics types
export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: Date
}

// SEO types
export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Validation types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Admin-specific types
export interface AdminDashboardMetrics {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  recentOrders: OrderWithDetails[]
  orderStatusDistribution: {
    status: OrderStatus
    count: number
    percentage: number
  }[]
  revenueByMonth: {
    month: string
    revenue: number
  }[]
  topProducts: {
    product: {
      id: string
      name: string
      price: number
      images: string[]
    }
    totalSold: number
    revenue: number
  }[]
}


export interface AdminUser extends User {
  lastLoginAt: Date | null
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string | null
    role: UserRole
  }
  expires: string
}

// Authentication types
export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}


export interface PasswordChangeData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Admin API response types
export interface AdminApiResponse<T = any> extends ApiResponse<T> {}

export interface AdminDashboardResponse extends AdminApiResponse<AdminDashboardMetrics> {}


// Security types
export interface SecurityEvent {
  id: string
  userId: string
  event: 'login' | 'logout' | 'password_change' | 'failed_login'
  ipAddress: string
  userAgent: string
  timestamp: Date
  details?: Record<string, any>
}

export interface SessionInfo {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActivity: Date
  isActive: boolean
}

// Admin Product Management Types
export interface CreateProductData {
  name: string
  description: string
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  images: string[]
  categoryId: string
  brand?: string
  weight?: number
  dimensions?: string
  specifications?: Record<string, any>
  isActive?: boolean
  isFeatured?: boolean
  tags?: string[]
}

export interface UpdateProductData {
  name?: string
  description?: string
  price?: number
  originalPrice?: number
  sku?: string
  stock?: number
  images?: string[]
  categoryId?: string
  brand?: string
  weight?: number
  dimensions?: string
  specifications?: Record<string, any>
  isActive?: boolean
  isFeatured?: boolean
  tags?: string[]
}

export interface ProductFormData {
  name: string
  description: string
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  images: File[] | string[]
  categoryId: string
  brand?: string
  weight?: number
  dimensions?: string
  specifications?: Record<string, any>
  isActive: boolean
  isFeatured: boolean
  tags: string[]
}

export interface AdminProductFilters {
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
  status?: 'active' | 'inactive'
  isFeatured?: boolean
  search?: string
  page?: number
  limit?: number
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

// Admin Order Management Types
export interface UpdateOrderStatusData {
  status: OrderStatus
  cancellationReason?: string
  failureReason?: string
}

export interface OrderStatusUpdateRequest {
  status: OrderStatus
  cancellationReason?: string
  failureReason?: string
}

export interface AdminOrderFilters {
  status?: OrderStatus
  paymentMethod?: PaymentMethod
  dateFrom?: Date
  dateTo?: Date
  search?: string
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'total' | 'status'
  sortOrder?: 'asc' | 'desc'
}

export interface OrderStatusHistory {
  id: string
  orderId: string
  status: OrderStatus
  reason: string | null
  createdAt: Date
  updatedBy: string
}

export interface AdminOrderWithDetails extends OrderWithDetails {
  statusHistory: OrderStatusHistory[]
  cancellationReason: string | null
  failureReason: string | null
}

// Real-time Update Types
export interface OrderUpdateEvent {
  type: 'order_created' | 'order_updated' | 'order_status_changed'
  orderId: string
  order: AdminOrderWithDetails
  timestamp: Date
}

export interface RealtimeConnection {
  id: string
  userId: string
  isConnected: boolean
  lastPing: Date
}

// Image Upload Types
export interface ImageUploadResult {
  url: string
  filename: string
  size: number
  mimeType: string
}

export interface ImageUploadProgress {
  filename: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

// Stock Management Types
export interface StockLevel {
  productId: string
  currentStock: number
  reservedStock: number
  availableStock: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  lowStockThreshold: number
}

export interface StockAdjustment {
  productId: string
  quantity: number
  reason: 'order_cancelled' | 'order_failed' | 'manual_adjustment' | 'inventory_correction'
  orderId?: string
  notes?: string
}

// Admin Dashboard Extended Types
export interface AdminProductMetrics {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  featuredProducts: number
  totalCategories: number
  averagePrice: number
  totalValue: number
}

export interface AdminOrderMetrics {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  failedOrders: number
  totalRevenue: number
  averageOrderValue: number
  ordersToday: number
  ordersThisWeek: number
  ordersThisMonth: number
}

export interface AdminDashboardExtended extends AdminDashboardMetrics {
  productMetrics: AdminProductMetrics
  orderMetrics: AdminOrderMetrics
  recentProductUpdates: {
    product: Product
    action: 'created' | 'updated' | 'deleted'
    timestamp: Date
  }[]
  lowStockAlerts: {
    product: Product
    currentStock: number
    threshold: number
  }[]
}

// Banner Management Types
export interface CreateBannerData {
  image: string
  redirectUrl: string
  isActive?: boolean
}

export interface UpdateBannerData {
  image?: string
  redirectUrl?: string
  isActive?: boolean
}

export interface BannerKanbanItem {
  id: string
  image: string
  redirectUrl: string
  position: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AdminBannerDto {
  id: string
  image: string
  redirectUrl: string
  position: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CarouselBanner {
  id: string
  image: string
  redirectUrl: string
  position: number
}

export interface BannerPositionUpdate {
  id: string
  position: number
}

export interface BannerReorderRequest {
  banners: BannerPositionUpdate[]
}