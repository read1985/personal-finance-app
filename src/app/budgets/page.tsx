'use client'

import { useState, useEffect } from 'react'
import { Budget, BudgetAnalytics, Category } from '@/types/database'
import { db } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react'
import BudgetForm from '@/components/budgets/budget-form'
import BudgetCard from '@/components/budgets/budget-card'

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [budgetAnalytics, setBudgetAnalytics] = useState<BudgetAnalytics[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [budgetsData, analyticsData, categoriesData] = await Promise.all([
        db.getBudgets(),
        db.getAllBudgetAnalytics(),
        db.getCategories()
      ])
      setBudgets(budgetsData)
      setBudgetAnalytics(analyticsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading budgets data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBudget = async (budgetData: {
    category_id: string
    name: string
    amount_cents: number
    start_date: string
    recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurrence_interval?: number
    end_date?: string | null
  }) => {
    try {
      await db.createBudget(budgetData)
      await loadData() // Refresh data
      setShowForm(false)
    } catch (error) {
      console.error('Error creating budget:', error)
      throw error
    }
  }

  const handleUpdateBudget = async (id: string, updates: {
    name?: string
    amount_cents?: number
    start_date?: string
    recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurrence_interval?: number
    end_date?: string | null
    is_active?: boolean
  }) => {
    try {
      await db.updateBudget(id, updates)
      await loadData() // Refresh data
      setEditingBudget(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating budget:', error)
      throw error
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return
    
    try {
      await db.deleteBudget(id)
      await loadData() // Refresh data
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBudget(null)
  }

  // Calculate summary stats
  const totalBudgeted = budgetAnalytics.reduce((sum, analytics) => 
    sum + (analytics.current_period?.budgeted_amount_cents || 0), 0)
  const totalSpent = budgetAnalytics.reduce((sum, analytics) => 
    sum + (analytics.current_period?.spent_amount_cents || 0), 0)
  const overBudgetCount = budgetAnalytics.filter(analytics => 
    analytics.current_period && analytics.current_period.percentage_used > 100).length

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-600 mt-1">Track your spending against your budget goals</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Budget
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Budgeted</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(totalBudgeted / 100).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Spent</p>
              <p className="text-2xl font-bold text-slate-900">
                ${(totalSpent / 100).toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">
                {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}% of budget
              </p>
            </div>
            <div className={`p-3 rounded-full ${totalSpent > totalBudgeted ? 'bg-red-100' : 'bg-emerald-100'}`}>
              {totalSpent > totalBudgeted ? (
                <TrendingUp className="w-6 h-6 text-red-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Over Budget</p>
              <p className="text-2xl font-bold text-slate-900">{overBudgetCount}</p>
              <p className="text-sm text-slate-500">of {budgetAnalytics.length} budgets</p>
            </div>
            <div className={`p-3 rounded-full ${overBudgetCount > 0 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              {overBudgetCount > 0 ? (
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-emerald-600" />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No budgets yet</h3>
            <p className="text-slate-600 mb-6">
              Create your first budget to start tracking your spending goals.
            </p>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Create Your First Budget
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => {
            const analytics = budgetAnalytics.find(a => a.budget_id === budget.id)
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                analytics={analytics}
                onEdit={() => handleEditBudget(budget)}
                onDelete={() => handleDeleteBudget(budget.id)}
              />
            )
          })}
        </div>
      )}

      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          categories={categories}
          onSubmit={editingBudget ? 
            (data) => handleUpdateBudget(editingBudget.id, data) : 
            handleCreateBudget
          }
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}