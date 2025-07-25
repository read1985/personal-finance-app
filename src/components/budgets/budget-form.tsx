'use client'

import { useState, useEffect } from 'react'
import { Budget, Category } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { X } from 'lucide-react'

interface BudgetFormProps {
  budget?: Budget | null
  categories: Category[]
  onSubmit: (data: {
    category_id: string
    name: string
    amount_cents: number
    start_date: string
    recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurrence_interval: number
    end_date: string | null
    is_active: boolean
  }) => Promise<void>
  onClose: () => void
}

export default function BudgetForm({ budget, categories, onSubmit, onClose }: BudgetFormProps) {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    start_date: '',
    recurrence_type: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrence_interval: '1',
    end_date: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (budget) {
      setFormData({
        category_id: budget.category_id,
        amount: (budget.amount_cents / 100).toString(),
        start_date: budget.start_date,
        recurrence_type: budget.recurrence_type,
        recurrence_interval: budget.recurrence_interval.toString(),
        end_date: budget.end_date || '',
        is_active: budget.is_active
      })
    } else {
      // Set default start date to today - ensure we get the correct date
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayString = `${year}-${month}-${day}`
      
      setFormData(prev => ({ ...prev, start_date: todayString }))
    }
  }, [budget])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.category_id) {
      setError('Please select a category')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!formData.start_date) {
      setError('Start date is required')
      return
    }

    try {
      setLoading(true)
      
      // Get the category name for the budget name
      const selectedCategory = categories.find(cat => cat.id === formData.category_id)
      const budgetName = selectedCategory?.name || 'Unknown Category'
      
      // Debug: Log the start date being submitted
      console.log('Budget form submitting with start_date:', formData.start_date)
      
      const submitData = {
        name: budgetName,
        category_id: formData.category_id,
        amount_cents: Math.round(parseFloat(formData.amount) * 100),
        start_date: formData.start_date,
        recurrence_type: formData.recurrence_type,
        recurrence_interval: parseInt(formData.recurrence_interval),
        end_date: formData.end_date || null,
        is_active: formData.is_active
      }

      console.log('Submit data:', submitData)
      await onSubmit(submitData)
    } catch (error) {
      console.error('Error saving budget:', error)
      setError('Failed to save budget. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-xl">
        <div className="p-6 bg-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {budget ? 'Edit Budget' : 'Create Budget'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white text-slate-900"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Budget Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">$</span>
                <Input
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="pl-8 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Start Date
              </label>
              <Input
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                min="2024-01-01"
                max="2030-12-31"
                className="border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Current value: {formData.start_date}
              </p>
            </div>

            {/* Recurrence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Repeat Every
                </label>
                <Input
                  name="recurrence_interval"
                  type="number"
                  min="1"
                  value={formData.recurrence_interval}
                  onChange={handleInputChange}
                  className="border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Period
                </label>
                <select
                  name="recurrence_type"
                  value={formData.recurrence_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none bg-white text-slate-900"
                >
                  <option value="daily">Day(s)</option>
                  <option value="weekly">Week(s)</option>
                  <option value="monthly">Month(s)</option>
                  <option value="yearly">Year(s)</option>
                </select>
              </div>
            </div>

            {/* End Date (Optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End Date (Optional)
              </label>
              <Input
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave empty for ongoing budget
              </p>
            </div>

            {/* Active Status */}
            {budget && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white"
                />
                <label className="text-sm font-medium text-slate-700">
                  Budget is active
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}