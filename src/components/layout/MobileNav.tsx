'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Search, ShoppingCart, Heart, User, Package, Tag, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { href: '/products', label: 'Products', icon: Package },
    { href: '/categories', label: 'Categories', icon: Tag },
    { href: '/deals', label: 'Deals', icon: Gift },
  ]

  const accountItems = [
    { href: '/account', label: 'My Account', icon: User },
    { href: '/orders', label: 'My Orders', icon: Package },
    { href: '/wishlist', label: 'Wishlist', icon: Heart },
  ]

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">A</span>
            </div>
            <span>Astro E-commerce</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search products..."
              className="w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Main Navigation */}
          <nav className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Shop
            </h3>
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Account Section */}
          <nav className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Account
            </h3>
            {accountItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4 border-t">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/cart" onClick={() => setIsOpen(false)}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                View Cart (0)
              </Link>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/wishlist" onClick={() => setIsOpen(false)}>
                <Heart className="h-4 w-4 mr-2" />
                Wishlist (0)
              </Link>
            </Button>
          </div>

          {/* Contact Info */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p className="font-medium">Need Help?</p>
            <p>Call us: +977-1-2345678</p>
            <p>Email: support@astroecommerce.com</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}