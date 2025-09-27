'use client'

import Image from 'next/image'
import { CarouselBanner } from '@/types'

interface BannerSlideProps {
  banner: CarouselBanner
  className?: string
}

export function BannerSlide({ banner, className = '' }: BannerSlideProps) {
  const handleClick = () => {
    const url = banner.redirectUrl || '#'
    // Open in new tab for external links, same tab for internal links
    const isExternal = url.startsWith('http') && !url.includes(window.location.hostname)

    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else if (url !== '#') {
      window.location.href = url
    }
  }

  return (
    <div 
      className={`relative w-full h-full cursor-pointer group ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      aria-label={`Banner - Click to visit ${banner.redirectUrl}`}
    >
      {/* Banner Image */}
      <div className="relative w-full h-full overflow-hidden rounded-lg">
        <Image
          src={banner.image || '/placeholder-banner.jpg'}
          alt={`Banner ${banner.position}`}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          priority={banner.position <= 2}
        />
        
        {/* Overlay for better text readability if needed */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 rounded-lg transition-colors duration-300" />
    </div>
  )
}