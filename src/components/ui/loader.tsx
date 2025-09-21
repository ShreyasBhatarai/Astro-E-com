import { cn } from '@/lib/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function Loader({ size = 'md', className, text }: LoaderProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-astro-primary border-t-transparent',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-astro-gray-600 text-sm font-medium">{text}</p>
      )}
    </div>
  )
}

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader size="lg" text={text} />
    </div>
  )
}

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Loader size="xl" text={text} />
    </div>
  )
}