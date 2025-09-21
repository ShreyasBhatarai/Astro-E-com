import React from 'react'
import { Metadata } from 'next'
import { WishlistPageClient } from './WishlistPageClient'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'View and manage your saved products',
  openGraph: {
    title: 'My Wishlist',
    description: 'View and manage your saved products',
    type: 'website',
  },
}

export default function WishlistPage() {
  return <WishlistPageClient />
}