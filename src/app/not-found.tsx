import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4">
      <h2 className="text-2xl font-semibold">Page not found</h2>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild>
        <Link href="/">Go back home</Link>
      </Button>
    </div>
  )
}

