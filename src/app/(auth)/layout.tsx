import { Inter } from 'next/font/google'


const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      {/* Clean auth layout without main app header/sidebar */}
      <main className="min-h-screen">
        {/* Logo Header */}
        {/* <div className="flex justify-center pt-8 pb-4 -mb-10">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.webp" 
              alt="Astro E-com" 
              className=" object-contain" 
              width={150}
              height={150}
            />
        
          </Link>
        </div> */}
        {children}
      </main>
    </div>
  )
}