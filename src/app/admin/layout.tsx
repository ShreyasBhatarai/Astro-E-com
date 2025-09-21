import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated or not admin
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Redirect to 2FA if required (commented out for now as 2FA is not fully implemented)
  // if (session.requiresTwoFactor) {
  //   redirect('/admin/2fa')
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      
      {/* Main Content Area */}
      <div className="md:ml-64">
        <div className="flex flex-col min-h-screen">
          <AdminHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile overlay when sidebar is open */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden" />
    </div>
  )
}