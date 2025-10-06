'use client'

import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Home, LogOut } from 'lucide-react'
import { NotificationsSheet } from '@/components/header/NotificationsSheet'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface AdminHeaderProps {
  title?: string
  className?: string
}

export function AdminHeader({ title = '', className }: AdminHeaderProps) {
  const { data: session } = useSession()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'A'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className={`sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6 ${className}`}>
      {/* Left side - Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationsSheet />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={session?.user?.name || 'Admin'} />
                <AvatarFallback className="text-xs">
                  {getInitials(session?.user?.name || null)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/" className="flex items-center">
                <Home className="mr-2 h-4 w-4" />
                <span>Go to Shop</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}