'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { OptimizedCategory } from '@/types'
import { cn } from '@/lib/utils'

interface CategoryGridProps {
  categories: OptimizedCategory[]
  className?: string
}

export function CategoryGrid({ categories, className }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No categories found
        </h3>
        <p className="text-sm text-gray-500">
          Categories will appear here once they are added.
        </p>
      </div>
    )
  }

  return (
<div
  className={cn(
    'flex flex-row gap-4 overflow-x-auto no-scrollbar px-2 py-4',
    className
  )}
>
  {categories.map((category) => (
    <Link
      key={category.id}
      href={`/products?category=${category.slug}`}
      className="shrink-0 basis-[28%] sm:basis-[28%] md:basis-[18%] lg:basis-[18%] xl:basis-[18%] 2xl:basis-[18%]"
    >
      <div className="group cursor-pointer">
        {/* Image */}
        <div className="relative aspect-square rounded-lg bg-gray-100 mb-2">
          <Image
            src={category.image || '/placeholder-category.jpg'}
            alt={category.name}
            fill
            className="object-center rounded-lg transition-transform duration-200 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
          />

        </div>

        {/* Info */}
        <div className="text-center">
          <h3 className="font-light text-xs md:text-base lg:text-lg text-gray-900 group-hover:text-black transition-colors">
            {category.name}
          </h3>
   
        </div>
      </div>
    </Link>
  ))}
</div>

  )
}