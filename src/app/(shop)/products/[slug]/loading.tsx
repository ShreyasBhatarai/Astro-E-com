import { Loader2 } from 'lucide-react'

export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50/50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-astro-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    </div>
  )
}