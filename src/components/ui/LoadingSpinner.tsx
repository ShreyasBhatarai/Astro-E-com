'use client'

import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({ message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`min-h-[50vh] flex items-center justify-center text-muted-foreground ${className}`}>
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      {message}
    </div>
  )
}

