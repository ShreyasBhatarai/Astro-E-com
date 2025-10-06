import { getFeaturedProducts, getCategories, getProducts } from '@/lib/queries/products'
import { getActiveBanners } from '@/lib/queries/banners'
import { ProductGrid } from '@/components/products/ProductGrid'
import { BannerCarousel } from '@/components/banners/BannerCarousel'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CategoryGrid } from '@/components/categories/CategoryGrid'

export default async function HomePage() {
  // Fetch featured products, categories, and active banners
  const [featuredProducts, categories, banners] = await Promise.all([
    getFeaturedProducts(20),
    getCategories(),
    getActiveBanners()
  ])



  return (
    <div className="min-h-screen bg-white">

      <main>
        {/* Hero/Banner Section */}
        {banners.length > 0 ? (
          <section className="relative mb-8">
            <div className="container mx-auto px-4 py-6">
              <div className="rounded-xl overflow-hidden shadow-lg">
                <BannerCarousel banners={banners} />
              </div>
            </div>
          </section>
) : (
          <section className="bg-gradient-to-br from-white via-astro-primary/5 to-astro-primary/10 py-12 md:py-20 lg:py-28">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl md:text-5xl lg:text-7xl font-light mb-4 md:mb-6 text-astro-gray-900 leading-tight">
                Welcome to{' '}
                  <span className="text-astro-primary font-normal">Astronova</span>
              </h1>
                <p className="text-base md:text-lg lg:text-xl text-astro-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed font-light">
                  Discover premium products with unbeatable convenience. Quality guaranteed, delivered to your doorstep.
              </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center">
                  <Button asChild size="lg" className="bg-astro-primary hover:bg-astro-primary-hover text-white shadow-lg px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-xl font-normal w-full sm:w-auto">
                  <Link href="/products">
                      Explore Products
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-2 border-astro-primary text-astro-primary hover:bg-astro-primary hover:text-white px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-xl font-normal w-full sm:w-auto">
                    <Link href="/products">
                      Browse Categories
                  </Link>
                </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Shop by Categories - Modern Grid */}
        <section className="py-8 md:py-12 lg:py-16 ">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-8 lg:mb-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-astro-gray-900">
                Shop by Categories
              </h2>
            </div>

            {/* Category Grid */}


                <CategoryGrid categories={categories} />


          </div>
        </section>

        {/* Featured Products - Clean Layout */}
        <section className="py-8 lg:py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6 md:mb-8 lg:mb-10">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-light text-astro-gray-900">
                Featured Products
              </h2>
            </div>

            <ProductGrid
              products={featuredProducts}
              variant="homepage"
            />

            <div className="text-center mt-8 md:mt-12 lg:mt-16">
              <Button variant="outline" size="lg" asChild className="border-2 border-astro-primary text-astro-primary hover:bg-astro-primary hover:text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-xl font-normal">
                <Link href="/products">
                  Explore All Products
                </Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

    </div>
  )
}
