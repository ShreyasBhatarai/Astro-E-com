'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from 'sonner'
import { Search, Users, UserCheck, UserX, Crown, Calendar, Mail, Phone, Eye } from 'lucide-react'
import { formatDistance } from 'date-fns'
import Link from 'next/link'
import { PaginationWithRows } from '@/components/ui/pagination-with-rows'

interface User {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'USER' | 'ADMIN'
  emailVerified: boolean
  lastLoginAt: Date | null
  createdAt: Date
  _count: {
    orders: number
    reviews: number
  }
}

interface UsersResponse {
  success: boolean
  data: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data: UsersResponse = await response.json()
      setUsers(data.data)
      setPagination(data.pagination)
    } catch (error) {
      // console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'USER' | 'ADMIN') => {
    try {
      setUpdating(userId)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      })

      if (!response.ok) throw new Error('Failed to update user role')

      const data = await response.json()
      if (data.success) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
        toast.success('User role updated successfully')
      }
    } catch (error) {
      // console.error('Error updating user role:', error)
      toast.error('Failed to update user role')
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, search, roleFilter, limit])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' ? (
      <Badge variant="destructive" className="gap-1">
        <Crown className="h-3 w-3" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        User
      </Badge>
    )
  }

  const getVerificationBadge = (verified: boolean) => {
    return verified ? (
      <Badge variant="default" className="gap-1">
        <UserCheck className="h-3 w-3" />
        Verified
      </Badge>
    ) : (
      <Badge variant="outline" className="gap-1">
        <UserX className="h-3 w-3" />
        Unverified
      </Badge>
    )
  }

  return (
    <div className="space-y-6">

      
  

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner message="Loading users..." className="py-8" />
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">
                {search || roleFilter !== 'all' 
                  ? 'Try adjusting your search filters.' 
                  : 'No users have registered yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">User</th>
                      <th className="text-left p-4 font-medium">Role</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Activity</th>
                      <th className="text-left p-4 font-medium">Stats</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">
                              {user.name || 'No name'}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="p-4">
                          {getVerificationBadge(user.emailVerified)}
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Joined {formatDistance(new Date(user.createdAt), new Date(), { addSuffix: true })}
                            </div>
                            {user.lastLoginAt && (
                              <div className="text-muted-foreground">
                                Last login {formatDistance(new Date(user.lastLoginAt), new Date(), { addSuffix: true })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm space-y-1">
                            <div>{user._count.orders} orders</div>
                            <div>{user._count.reviews} reviews</div>
    
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-center gap-2">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                            <Select
                              value={user.role}
                              onValueChange={(newRole: 'USER' | 'ADMIN') => updateUserRole(user.id, newRole)}
                              disabled={updating === user.id}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <PaginationWithRows
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={limit}
                  onPageChange={(newPage) => setPage(newPage)}
                  onRowsChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                  }}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}