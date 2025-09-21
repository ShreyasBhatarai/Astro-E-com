import { ShopHeader } from '@/components/layout/ShopHeader'
import { Footer } from '@/components/layout/Footer'

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      <ShopHeader />
      <main className="min-h-[calc(100vh-4rem)] lg:px-[10%]">
        {children}
      </main>
        <Footer />
    </div>
  )
}