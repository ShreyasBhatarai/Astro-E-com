'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWishlist } from '@/contexts/WishlistContext'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Thumbs } from 'swiper/modules'
import type { Swiper as SwiperType } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/thumbs'

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  productId: string
  className?: string
}

export function ProductImageGallery({ images, productName, productId, className }: ProductImageGalleryProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null)
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false)

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const isProductInWishlist = isInWishlist(productId)

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Require login for wishlist
    if (!session) {
      toast.info('Please sign in to add items to wishlist', {
        description: 'You will be redirected to the login page',
        action: {
          label: 'Sign In',
          onClick: () => router.push('/login')
        },
        duration: 4000,
      })
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    setIsAddingToWishlist(true)
    try {
      if (isProductInWishlist) {
        const success = await removeFromWishlist(productId)
        if (success) {
          toast.success('Removed from wishlist')
        } else {
          toast.error('Failed to remove from wishlist')
        }
      } else {
        const success = await addToWishlist(productId)
        if (success) {
          toast.success('Added to wishlist')
        } else {
          toast.error('Failed to add to wishlist')
        }
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsAddingToWishlist(false)
    }
  }


  if (!images || images.length === 0) {
    return (
      <div className={cn('aspect-square bg-gray-100 rounded-lg flex items-center justify-center', className)}>
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sm">No image available</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Image Swiper */}
      <div className="relative aspect-square overflow-hidden ">
        <Swiper
          modules={[Navigation, Pagination, Thumbs]}
          navigation={{
            prevEl: '.swiper-button-prev-custom',
            nextEl: '.swiper-button-next-custom',
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
          className="h-full w-full"
          spaceBetween={0}
          slidesPerView={1}
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full">
                <Image
                  src={image || '/placeholder-product.jpg'}
                  alt={`${productName} - Image ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  draggable={false}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Wishlist Heart Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-10 w-10 bg-white/95 hover:bg-white shadow-lg opacity-100 z-20"
          onClick={handleWishlistToggle}
          disabled={isAddingToWishlist}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-colors",
              isProductInWishlist
                ? "text-red-500 fill-red-500"
                : "text-gray-600 hover:text-red-500"
            )}
          />
        </Button>

        {/* Custom Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button className="swiper-button-prev-custom absolute left-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-10 w-10 bg-white/95 hover:bg-white shadow-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="swiper-button-next-custom absolute right-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 h-10 w-10 bg-white/95 hover:bg-white shadow-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Swiper */}
      {images.length > 1 && (
        <div className="h-20">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            className="h-full"
            breakpoints={{
              640: {
                slidesPerView: 5,
              },
              768: {
                slidesPerView: 6,
              },
            }}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}>
                <div className="relative w-full h-full cursor-pointer overflow-hidden bg-gray-100 border-2 border-transparent hover:border-gray-300 transition-all">
                  <Image
                    src={image || '/placeholder-product.jpg'}
                    alt={`${productName} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  )
}