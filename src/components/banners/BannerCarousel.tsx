'use client'

import { useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BannerSlide } from './BannerSlide'
import { CarouselBanner } from '@/types'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/autoplay'


interface BannerCarouselProps {
  banners: CarouselBanner[]
  autoPlay?: boolean
  autoPlayInterval?: number
  showControls?: boolean
  showDots?: boolean
  className?: string
}

export function BannerCarousel({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
  showControls = true,
  showDots = true,
  className = ''
}: BannerCarouselProps) {
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Initialize navigation after swiper is mounted
    if (prevRef.current && nextRef.current) {
      const swiper = (prevRef.current.closest('.swiper') as any)?.swiper
      if (swiper && swiper.navigation) {
        swiper.navigation.update()
      }
    }
  }, [])


  if (banners.length === 0) {
    return null
  }

  if (banners.length === 1) {
    return (
      <div className={`relative w-full ${className}`}>
        <div className="aspect-[16/6] md:aspect-[21/8] lg:aspect-[21/7] w-full rounded-xl overflow-hidden shadow-2xl">
          <BannerSlide banner={banners[0]} />
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full ${className} group`}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        pagination={{
          clickable: true,
          renderBullet: function (index, className) {
            return `<span class="${className} !w-3 !h-3 !bg-white/70 hover:!bg-white !transition-all !duration-300"></span>`
          },
        }}
        autoplay={autoPlay ? {
          delay: autoPlayInterval,
          disableOnInteraction: false,
        } : false}
        loop={banners.length > 1}
        speed={700}
        effect="slide"
        className="w-full rounded-xl shadow-2xl overflow-hidden"
        style={{
          '--swiper-navigation-color': '#ffffff',
          '--swiper-pagination-color': '#ffffff',
          '--swiper-pagination-bullet-inactive-color': 'rgba(255, 255, 255, 0.5)',
        } as any}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <div className="aspect-[16/8] md:aspect-[21/8] lg:aspect-[21/7] w-full">
              <BannerSlide banner={banner} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Controls */}
      {showControls && banners.length > 1 && (
        <>
          <button
            ref={prevRef}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110 w-10 h-10 rounded-full flex items-center justify-center z-10"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>

          <button
            ref={nextRef}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border-none shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm hover:scale-110 w-10 h-10 rounded-full flex items-center justify-center z-10"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </>
      )}
    </div>
  )
}