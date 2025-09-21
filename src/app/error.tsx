'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {


  return (
    <div className="min-h-[100vh] flex flex-col items-center justify-center text-center space-y-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">Please try again or refresh the page.</p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    </div>
  )
}

