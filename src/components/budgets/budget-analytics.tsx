'use client'

import { useState, useEffect } from 'react'
import { BudgetAnalytics } from '@/types/database'
import { db } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react'

interface BudgetAnalyticsProps {
  budgetId?: string // If provided, show analytics for specific budget
}

export default function BudgetAnalyticsComponent({ budgetId }: BudgetAnalyticsProps) {
  const [analytics, setAnalytics] = useState<BudgetAnalytics[]>([])
  const [selectedBudget, setSelectedBudget] = useState<BudgetAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'overview' | 'trends' | 'comparison'>('overview')

  useEffect(() => {
    loadAnalytics()
  }, [budgetId])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      if (budgetId) {
        const budgetAnalytics = await db.getBudgetAnalytics(budgetId)
        setAnalytics([budgetAnalytics])
        setSelectedBudget(budgetAnalytics)
      } else {
        const allAnalytics = await db.getAllBudgetAnalytics()
        setAnalytics(allAnalytics)
        if (allAnalytics.length > 0) {
          setSelectedBudget(allAnalytics[0])
        }
      }
    } catch (error) {
      console.error('Error loading budget analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (analytics.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Budget Data</h3>
        <p className="text-slate-600">Create some budgets to see analytics here.</p>
      </Card>
    )
  }

  // Prepare chart data
  const overviewData = analytics.map(budget => ({
    name: budget.budget_name,
    budgeted: budget.current_period?.budgeted_amount_cents || 0,
    spent: budget.current_period?.spent_amount_cents || 0,
    remaining: Math.max(0, (budget.current_period?.budgeted_amount_cents || 0) - (budget.current_period?.spent_amount_cents || 0)),
    percentage: budget.current_period?.percentage_used || 0
  }))

  const trendData = selectedBudget?.historical_periods.slice(-6).reverse().map(period => ({
    period: new Date(period.period_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    budgeted: period.budgeted_amount_cents / 100,
    spent: period.spent_amount_cents / 100,
    percentage: period.percentage_used
  })) || []

  const statusData = [
    { name: 'On Track', value: analytics.filter(a => a.current_period && a.current_period.percentage_used <= 80).length, color: '#10b981' },
    { name: 'Near Limit', value: analytics.filter(a => a.current_period && a.current_period.percentage_used > 80 && a.current_period.percentage_used <= 100).length, color: '#f59e0b' },
    { name: 'Over Budget', value: analytics.filter(a => a.current_period && a.current_period.percentage_used > 100).length, color: '#ef4444' }
  ]

  const totalBudgeted = analytics.reduce((sum, a) => sum + (a.current_period?.budgeted_amount_cents || 0), 0)
  const totalSpent = analytics.reduce((sum, a) => sum + (a.current_period?.spent_amount_cents || 0), 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overBudgetCount = analytics.filter(a => a.current_period && a.current_period.percentage_used > 100).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Budget Analytics</h2>
        <div className="flex gap-2">
          <Button
            variant={view === 'overview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('overview')}
          >
            Overview
          </Button>
          <Button
            variant={view === 'trends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('trends')}
          >
            Trends
          </Button>
          <Button
            variant={view === 'comparison' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('comparison')}
          >
            Comparison
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Budgeted</p>
              <p className="text-xl font-bold text-slate-900">${(totalBudgeted / 100).toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Spent</p>
              <p className="text-xl font-bold text-slate-900">${(totalSpent / 100).toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Remaining</p>
              <p className={`text-xl font-bold ${totalRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${(Math.abs(totalRemaining) / 100).toFixed(2)}
                {totalRemaining < 0 && ' over'}
              </p>
            </div>
            {totalRemaining < 0 ? 
              <AlertTriangle className="w-8 h-8 text-red-500" /> :
              <TrendingDown className="w-8 h-8 text-emerald-500" />
            }
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Over Budget</p>
              <p className="text-xl font-bold text-slate-900">{overBudgetCount}</p>
              <p className="text-sm text-slate-500">of {analytics.length} budgets</p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${overBudgetCount > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
          </div>
        </Card>
      </div>

      {/* Charts based on selected view */}
      {view === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget vs Spent Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget vs Spent (Current Period)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overviewData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, '']}
                  labelStyle={{ color: '#334155' }}
                />
                <Bar dataKey="budgeted" fill="#3b82f6" name="Budgeted" />
                <Bar dataKey="spent" fill="#ef4444" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Budget Status Pie Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {view === 'trends' && selectedBudget && (
        <div className="space-y-6">
          {/* Budget Selector */}
          {!budgetId && analytics.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Budget for Trends
              </label>
              <select
                value={selectedBudget.budget_id}
                onChange={(e) => {
                  const budget = analytics.find(a => a.budget_id === e.target.value)
                  setSelectedBudget(budget || null)
                }}
                className="px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {analytics.map(budget => (
                  <option key={budget.budget_id} value={budget.budget_id}>
                    {budget.budget_name} - {budget.category_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trend Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {selectedBudget.budget_name} - Historical Performance
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'percentage' ? `${value.toFixed(1)}%` : `$${value.toFixed(2)}`,
                    name === 'budgeted' ? 'Budgeted' : name === 'spent' ? 'Spent' : 'Usage %'
                  ]}
                />
                <Line type="monotone" dataKey="budgeted" stroke="#3b82f6" strokeWidth={2} name="budgeted" />
                <Line type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} name="spent" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {view === 'comparison' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Usage Percentage']}
                labelStyle={{ color: '#334155' }}
              />
              <Bar 
                dataKey="percentage" 
                fill="#3b82f6"
                name="Usage %"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}