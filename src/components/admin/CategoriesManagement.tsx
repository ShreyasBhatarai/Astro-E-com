'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { CategoryWithCount } from '@/types'
import Image from 'next/image'

interface CategoryFormData {
  name: string
  image: string
  isActive: boolean
}

export function CategoriesManagement() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    image: '',
    isActive: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.data || [])
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch categories',
          variant: 'destructive'
        })
      }
    } catch (error) {
      // console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    if (!formData.image.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category image is required',
        variant: 'destructive'
      })
      setIsSubmitting(false)
      return
    }

    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Category ${editingCategory ? 'updated' : 'created'} successfully`
        })
        
        setIsAddDialogOpen(false)
        setEditingCategory(null)
        resetForm()
        fetchCategories()
      } else {
        const errorData = await response.json()
        toast({
          title: 'Error',
          description: errorData.message || 'Failed to save category',
          variant: 'destructive'
        })
      }
    } catch (error) {
      // console.error('Error saving category:', error)
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Category deleted successfully'
        })
        fetchCategories()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete category',
          variant: 'destructive'
        })
      }
    } catch (error) {
      // console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      isActive: true
    })
  }

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      image: category.image || '',
      isActive: category.isActive
    })
    setIsAddDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingCategory(null)
    resetForm()
    setIsAddDialogOpen(true)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '')
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formDataUpload
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = await res.json()
      setFormData(prev => ({ ...prev, image: data.secure_url }))
      toast({ title: 'Image uploaded' })
    } catch (err) {
      // console.error(err)
      toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading categories...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                  required
                />
              </div>
              
              
              
              <div className="space-y-2">
                <Label htmlFor="image">Category Image</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="image-file"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-file')?.click()}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  {formData.image && (
                    <div className="relative h-16 w-16">
                      <Image
                        src={formData.image}
                        alt="Category preview"
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                </div>
                <Input
                  id="image-url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  placeholder="Or enter image URL"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No categories found</p>
              {searchTerm && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchTerm('')}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4">
                    <div className="relative h-12 w-12 bg-muted rounded overflow-hidden">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{category.name}</h3>
                        <Badge variant={category.isActive ? 'default' : 'secondary'}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {category._count.products} products
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}