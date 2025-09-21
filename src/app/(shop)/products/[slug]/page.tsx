import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProductBySlug, getRelatedProducts } from '@/lib/queries/products'
import { ProductImageGallery } from '@/components/products/ProductImageGallery'
import { ProductInfo } from '@/components/products/ProductInfo'
import { ProductGrid } from '@/components/products/ProductGrid'
import { ReviewSection } from '@/components/products/ReviewSection'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { ReviewWithUser } from '@/types'

interface ProductPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const product = await getProductBySlug(resolvedParams.slug)

  if (!product) {
    return {
      title: 'Product Not Found',
    }
  }

  return {
    title: product.name,
    description: product.description || '',
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.images.length > 0 ? [product.images[0]] : [],
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const product = await getProductBySlug(resolvedParams.slug)

  if (!product) {
    notFound()
  }

  // Fetch related products
  const relatedProducts = await getRelatedProducts(product.id, product.categoryId, 5)

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-astro-primary transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li>
              <Link href="/products" className="hover:text-astro-primary transition-colors">
               Products
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li>
              <Link 
                href={`/products?category=${product.category?.slug}`}
                className="hover:text-astro-primary transition-colors"
              >
                {product.category?.name}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <li className="text-gray-900 font-medium">
              {product.name}
            </li>
          </ol>
        </nav>

        {/* Product Details */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 space-y-8 lg:space-y-0 mb-16">
          {/* Left Column: Images and Reviews */}
          <div className="space-y-8">
            <ProductImageGallery 
              images={product.images}
              productName={product.name}
              productId={product.id}
            />
            
            {/* Reviews Section - Desktop: Below images, Mobile: After product info */}
            <div className="hidden lg:block">
              <ReviewSection
                reviews={product.reviews as ReviewWithUser[]}
                averageRating={product.averageRating as number}
                totalReviews={product.reviewCount as number}
                productId={product.id}
              />
            </div>
          </div>

          {/* Right Column: Product Info */}
          <div className="space-y-6">
            <ProductInfo product={product} />
            
            {/* Reviews Section - Mobile: After product info */}
            <div className="lg:hidden">
              <ReviewSection
                reviews={product.reviews as ReviewWithUser[]}
                averageRating={product.averageRating as number}
                totalReviews={product.reviewCount as number}
                productId={product.id}
              />
            </div>
          </div>
        </div>

        {/* Similar Products */}
        <div>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Recommended Similar Products
            </h2>
            <p className="text-gray-600">
              You might also like these products
            </p>
          </div>
          
          {relatedProducts.length > 0 ? (
            <ProductGrid products={relatedProducts} />
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Similar Products Found
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                We couldn&apos;t find any similar products at the moment. Check back later or explore our other categories.
              </p>
              <Button asChild variant="outline" className="px-6">
                <Link href="/products">
                  Browse All Products
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}