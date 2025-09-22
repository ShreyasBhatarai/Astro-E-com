'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Search, Heart, User,  Package, Tag, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useWishlist } from '@/contexts/WishlistContext'
import { NotificationDropdown } from '@/components/layout/NotificationDropdown'
import { CartIcon } from '@/components/cart/CartIcon'
import { NotificationsSheet } from '@/components/header/NotificationsSheet'
import Image from 'next/image'
import { signOut } from 'next-auth/react'

export function ShopHeader() {
  const { data: session } = useSession()
  const { wishlistCount } = useWishlist()
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'product' | 'category'
    text: string
    url: string
    brand?: string
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSuggestions(false)
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim().length > 2) {
      // Show loading immediately
      setIsLoadingSuggestions(true)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        try {
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
          if (response.ok) {
            const result = await response.json()
            setSuggestions(result.data)
            setShowSuggestions(result.data.length > 0)
          } else {
            setSuggestions([])
            setShowSuggestions(false)
          }
        } catch (error) {
          // console.error('Error fetching suggestions:', error)
          setSuggestions([])
          setShowSuggestions(false)
        } finally {
          setIsLoadingSuggestions(false)
        }
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  const handleSuggestionClick = (suggestion: { type: string; text: string; url: string }) => {
    setSearchQuery(suggestion.text)
    setShowSuggestions(false)
    router.push(suggestion.url)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        {/* Mobile Layout - Two Layers */}
        <div className="block lg:hidden">
          {/* Top Layer - Logo/Name and Icons */}
          <div className="flex h-14 items-center justify-between">
            {/* Logo + Name (responsive) */}
            <Link href="/" className="flex items-center space-x-2">
              {/* Logo - hidden on very small screens */}
              <Image 
                src="/logo.webp" 
                alt="Astro E-com" 
                width={60} 
                height={60} 
                className="hidden min-[400px]:block"
              />
              {/* Brand Name - always visible on mobile */}
              <span className="text-lg font-normal text-gray-900">
                Astro <span className="text-primary font-extrabold">E-Com</span>
              </span>
            </Link>

            {/* Icons Row */}
            <div className="flex items-center space-x-2">
              {/* Notifications - Only for authenticated non-admin users */}
              {session && session.user.role !== 'ADMIN' && <NotificationDropdown />}

              {/* Wishlist */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 relative"
                onClick={() => router.push('/wishlist')}
              >
                <Heart className="h-4 w-4" />
                <span className="sr-only">Wishlist</span>
                {wishlistCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500 text-white font-semibold rounded-full border-2 border-white"
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </Badge>
                )}
              </Button>


            {/* Shopping Cart */}
            <CartIcon />

              {/* User Account */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <User className="h-4 w-4" />
                    <span className="sr-only">Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {session ? (
                    <>
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-normal">{session.user?.name}</p>
                        <p className="text-xs text-muted-foreground font-normal">
                          {session.user?.email}
                        </p>
                        {session.user?.role === 'ADMIN' && (
                          <p className="text-xs text-blue-600 font-medium">Administrator</p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                      {session.user?.role === 'ADMIN' ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="font-normal text-blue-600">Admin Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/profile" className="font-normal">My Account</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                 
                      <DropdownMenuItem asChild>
                        <Link href="/orders" className="font-normal">My Orders</Link>
                      </DropdownMenuItem>
                   
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => signOut()}
                        className="text-red-600 font-normal"
                      >
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/login" className="font-normal">Sign In</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/register" className="font-normal">Create Account</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bottom Layer - Search Bar */}
          <div className="pb-3" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full pl-10 pr-4 h-10 bg-gray-50 border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-black text-sm font-normal"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-astro-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-astro-primary" />
                      <span className="ml-2 text-sm text-astro-gray-600 font-normal">Searching...</span>
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => {
                      const Icon = suggestion.type === 'category' ? Tag : Package
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-astro-gray-50 transition-colors flex items-center gap-3 border-b border-astro-gray-100 last:border-b-0"
                        >
                          <Icon className={`h-4 w-4 ${suggestion.type === 'category' ? 'text-blue-500' : 'text-astro-primary'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-astro-gray-900 font-normal">{suggestion.text}</span>
                            {suggestion.brand && (
                              <span className="text-astro-gray-500 text-xs ml-2 font-normal">by {suggestion.brand}</span>
                            )}
                            <div className="text-xs text-astro-gray-400 capitalize font-normal">
                              {suggestion.type}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Desktop Layout - Single Row */}
        <div className="hidden lg:flex h-16 items-center justify-between gap-4">
          {/* Left side - Logo + Brand */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo.webp" alt="Astro E-com" width={80} height={80} />
              <span className="text-xl font-normal text-gray-900">
                Astro <span className="text-primary font-extrabold">E-Com</span>
              </span>
            </Link>
          </div>

          {/* Center - Search Bar */}
          <div className="flex-1 max-w-2xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="w-full pl-10 pr-4 h-11 bg-gray-50 border-gray-200 rounded-full focus:ring-2 focus:ring-black focus:border-black text-base font-normal"
              />
              
              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-astro-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {isLoadingSuggestions ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-astro-primary" />
                      <span className="ml-2 text-sm text-astro-gray-600 font-normal">Searching...</span>
                    </div>
                  ) : (
                    suggestions.map((suggestion, index) => {
                      const Icon = suggestion.type === 'category' ? Tag : Package
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm hover:bg-astro-gray-50 transition-colors flex items-center gap-3 border-b border-astro-gray-100 last:border-b-0"
                        >
                          <Icon className={`h-4 w-4 ${suggestion.type === 'category' ? 'text-blue-500' : 'text-astro-primary'}`} />
                          <div className="flex-1 min-w-0">
                            <span className="text-astro-gray-900 font-normal">{suggestion.text}</span>
                            {suggestion.brand && (
                              <span className="text-astro-gray-500 text-xs ml-2 font-normal">by {suggestion.brand}</span>
                            )}
                            <div className="text-xs text-astro-gray-400 capitalize font-normal">
                              {suggestion.type}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Notifications - Only for authenticated non-admin users */}
            {session && session.user.role !== 'ADMIN' && <NotificationDropdown />}

            {/* Wishlist */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 relative"
              onClick={() => router.push('/wishlist')}
            >
              <Heart className="h-5 w-5" />
              <span className="sr-only">Wishlist</span>
              {wishlistCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center bg-red-500 text-white font-normal rounded-full border-2 border-white"
                >
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </Badge>
              )}
            </Button>


            {/* Shopping Cart */}
            <CartIcon />

            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <User className="h-5 w-5" />
                  <span className="sr-only">Account</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {session ? (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-normal">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground font-normal">
                        {session.user?.email}
                      </p>
                      {session.user?.role === 'ADMIN' && (
                        <p className="text-xs text-blue-600 font-medium">Administrator</p>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    {session.user?.role === 'ADMIN' ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="font-normal text-blue-600">Admin Dashboard</Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="font-normal">My Account</Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="font-normal">My Orders</Link>
                    </DropdownMenuItem>
               
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-red-600 font-normal"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="font-normal">Sign In</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" className="font-normal">Create Account</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}