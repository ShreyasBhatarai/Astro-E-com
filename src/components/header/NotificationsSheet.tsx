'use client'

import { useEffect, useState, Suspense } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Bell, ShoppingCart, User, AlertCircle, CheckCircle, Package, TrendingUp, Dot, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  createdAt: string
  isRead: boolean
  metadata?: any
}

interface NotificationsListProps {
  onCountUpdate?: () => void
  triggerRefresh?: boolean
}

function NotificationsList({ onCountUpdate, triggerRefresh }: NotificationsListProps) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAllRead, setMarkingAllRead] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 7

  const loadNotifications = async (pageNum: number, append = false) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    
    try {
      const res = await fetch(`/api/notifications?page=${pageNum}&limit=${limit}`)
      if (res.ok) {
        const data = await res.json()
        const newItems = data.data || []
        
        if (append) {
          setItems(prev => [...prev, ...newItems])
        } else {
          setItems(newItems)
        }
        
        // Check if there are more items
        setHasMore(newItems.length === limit)
      }
    } finally {
      if (append) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadNotifications(nextPage, true)
  }

  useEffect(() => {
    loadNotifications(1)
  }, [])

  // Handle trigger refresh - MUST be called before any early returns
  useEffect(() => {
    if (triggerRefresh) {
      setPage(1)
      setHasMore(true)
      loadNotifications(1)
    }
  }, [triggerRefresh])

  if (loading) {
    return <LoadingSpinner message="Loading notifications..." className="py-8" />
  }

  const hasUnreadNotifications = items.some(item => !item.isRead)

  if (items.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground text-center">No notifications</div>
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />
      case 'ORDER_STATUS_CHANGED':
        return <Package className="h-4 w-4 text-green-600" />
      case 'USER_REGISTERED':
        return <User className="h-4 w-4 text-purple-600" />
      case 'PRODUCT_LOW_STOCK':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'SYSTEM_ALERT':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
        return 'bg-blue-50 border-blue-200'
      case 'ORDER_STATUS_CHANGED':
        return 'bg-green-50 border-green-200'
      case 'USER_REGISTERED':
        return 'bg-purple-50 border-purple-200'
      case 'PRODUCT_LOW_STOCK':
        return 'bg-orange-50 border-orange-200'
      case 'SYSTEM_ALERT':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PATCH' })
      setItems(prev => 
        prev.map(item => 
          item.id === notificationId ? { ...item, isRead: true } : item
        )
      )
      // Update the unread count instantly
      onCountUpdate?.()
    } catch (error) {
      // console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAllRead(true)
    try {
      const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' })
      if (res.ok) {
        // Mark all items as read in the local state
        setItems(prev => 
          prev.map(item => ({ ...item, isRead: true }))
        )
        // Update the unread count instantly
        onCountUpdate?.()
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    } finally {
      setMarkingAllRead(false)
    }
  }

  return (
    <div className="space-y-1">
      {/* Read All Button */}
      {hasUnreadNotifications && (
        <div className="px-4 pb-2">
          <Button
            onClick={markAllAsRead}
            disabled={markingAllRead}
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
          >
            {markingAllRead ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                Marking all as read...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark all as read
              </>
            )}
          </Button>
        </div>
      )}
      
      {items.map(n => (
        <div 
          key={n.id} 
          className={`relative p-4 rounded-lg border transition-colors cursor-pointer hover:bg-opacity-80 ${
            !n.isRead ? getNotificationColor(n.type) : 'bg-white border-gray-200'
          }`}
          onClick={() => !n.isRead && markAsRead(n.id)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(n.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-gray-900 text-sm leading-5">
                  {n.title}
                </h4>
                {!n.isRead && (
                  <div className="flex-shrink-0">
                    <Dot className="h-4 w-4 text-blue-600 fill-current" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1 leading-5">
                {n.message}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
                {n.metadata?.orderNumber && (
                  <Badge variant="outline" className="text-xs">
                    #{n.metadata.orderNumber}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Load More Button */}
      {hasMore && (
        <div className="pt-4 text-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

export function NotificationsSheet() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [refreshTrigger, setRefreshTrigger] = useState(false)

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshTrigger(prev => !prev) // Toggle to trigger refresh
    fetchUnreadCount()
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Optional: Set up polling to update count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] flex flex-col">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-8 w-8 p-0 shrink-0"
              title="Refresh notifications"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={<LoadingSpinner message="Loading..." className="py-8" />}>
            <NotificationsList onCountUpdate={fetchUnreadCount} triggerRefresh={refreshTrigger} />
          </Suspense>
        </div>
      </SheetContent>
    </Sheet>
  )
}

