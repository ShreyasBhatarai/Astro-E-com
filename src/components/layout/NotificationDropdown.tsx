'use client'

import React from 'react'
import { Bell, Package, User, Info, XCircle, CheckCircle, Loader2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Notification } from '@prisma/client'

const notificationIcons = {
  ORDER_CREATED: Package,
  ORDER_UPDATED: Package,
  ORDER_SHIPPED: Package,
  ORDER_DELIVERED: CheckCircle,
  PRODUCT_REVIEW: User,
  ACCOUNT_UPDATE: User,
  SYSTEM: Info,
  PROMOTION: Info,
}

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    redirectToPage,
    fetchNotifications,
  } = useNotifications()

  const handleNotificationClick = (notification: Notification) => {
    redirectToPage(notification)
  }

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    markAsRead([notificationId])
  }

  const getNotificationIcon = (type: string) => {
    const IconComponent = notificationIcons[type as keyof typeof notificationIcons] || Info
    return IconComponent
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_CREATED':
        return 'text-blue-600'
      case 'ORDER_UPDATED':
        return 'text-yellow-600'
      case 'ORDER_SHIPPED':
        return 'text-purple-600'
      case 'ORDER_DELIVERED':
        return 'text-green-600'
      case 'PRODUCT_REVIEW':
        return 'text-orange-600'
      case 'ACCOUNT_UPDATE':
        return 'text-indigo-600'
      case 'PROMOTION':
        return 'text-pink-600'
      default:
        return 'text-gray-600'
    }
  }

  const handleDropdownOpen = (open: boolean) => {
    if (open && notifications.length === 0) {
      fetchNotifications(1)
    }
  }

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10">
          <Bell className="h-5 w-5 lg:h-6 lg:w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-medium border-2 border-white"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 lg:w-96">
        <div className="flex items-center justify-between p-3 lg:p-4 border-b">
          <h3 className="font-medium text-base lg:text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground font-normal"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px] lg:h-[400px]">
          {notifications.length === 0 && !isLoading ? (
            <div className="p-4 lg:p-6 text-center">
              <Bell className="h-6 w-6 lg:h-8 lg:w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-normal">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1 p-1 lg:p-2">
              {notifications.map((notification) => {
                const IconComponent = getNotificationIcon(notification.type)
                const iconColor = getNotificationColor(notification.type)
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50',
                      !notification.isRead && 'bg-muted/30'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={cn(
                          'text-sm font-medium leading-tight',
                          !notification.isRead && 'text-foreground font-semibold'
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
              
              {hasMore && (
                <div className="p-3 text-center border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        Load More
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

      </DropdownMenuContent>
    </DropdownMenu>
  )
}