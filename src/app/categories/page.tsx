"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/supabase"
import { Category } from "@/types/database"
import { Plus, Edit, Trash2 } from "lucide-react"

const TAILWIND_COLORS = [
  'bg-slate-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-indigo-500',
  'bg-pink-500',
]

interface CategoryForm {
  name: string
  color: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CategoryForm>({ name: '', color: 'bg-slate-500' })

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await db.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingCategory) {
        await db.updateCategory(editingCategory.id, form)
      } else {
        await db.createCategory(form.name, form.color)
      }
      
      await loadCategories()
      setShowForm(false)
      setEditingCategory(null)
      setForm({ name: '', color: 'bg-slate-500' })
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      await db.deleteCategory(categoryId)
      await loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  function startEdit(category: Category) {
    setEditingCategory(category)
    setForm({ name: category.name, color: category.color })
    setShowForm(true)
  }

  function cancelEdit() {
    setShowForm(false)
    setEditingCategory(null)
    setForm({ name: '', color: 'bg-slate-500' })
  }

  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Categories</h1>
          <p className="text-slate-600">Manage your transaction categories</p>
        </div>
        
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-slate-700 hover:bg-slate-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6 border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-slate-50/50">
            <CardTitle className="text-slate-800">
              {editingCategory ? 'Edit Category' : 'New Category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {TAILWIND_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-8 h-8 rounded-full ${color} transition-all ${
                        form.color === color ? 'ring-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <Badge className={`${form.color} border-none text-white`}>Preview: {form.name || 'Category'}</Badge>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit"
                  className="bg-slate-700 hover:bg-slate-800 text-white"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                  className="border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id} className="border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${category.color}`} />
                  <span className="font-medium text-slate-800">{category.name}</span>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(category)}
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.id)}
                    className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {categories.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">📂</div>
            <p className="text-lg font-medium text-slate-600 mb-1">
              No categories found
            </p>
            <p className="text-sm text-slate-500">
              Create your first category to get started organizing your transactions.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}