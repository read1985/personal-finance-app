'use client'

import { useState, useEffect } from 'react'
import { Budget, BudgetAnalytics } from '@/types/database'
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
  ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react'

interface BudgetHistoryProps {
  budget: Budget
}

export default function BudgetHistory({ budget }: BudgetHistoryProps) {
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'chart' | 'table'>('chart')

  useEffect(() => {
    loadBudgetHistory()
  }, [budget.id])

  const loadBudgetHistory = async () => {
    try {
      setLoading(true)
      const budgetAnalytics = await db.getBudgetAnalytics(budget.id)
      setAnalytics(budgetAnalytics)
    } catch (error) {
      console.error('Error loading budget history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </Card>
    )
  }

  if (!analytics || !analytics.historical_periods.length) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No History Available</h3>
        <p className="text-slate-600">Budget periods will appear here as time progresses.</p>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = analytics.historical_periods.slice(-12).map((period, index) => ({
    period: `${new Date(period.period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(period.period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    budgeted: period.budgeted_amount_cents / 100,
    spent: period.spent_amount_cents / 100,
    percentage: period.percentage_used,
    over: period.spent_amount_cents > period.budgeted_amount_cents,
    variance: (period.spent_amount_cents - period.budgeted_amount_cents) / 100
  }))

  // Calculate summary stats
  const totalPeriods = analytics.historical_periods.length
  const overBudgetPeriods = analytics.historical_periods.filter(p => p.percentage_used > 100).length
  const averageUsage = analytics.historical_periods.reduce((sum, p) => sum + p.percentage_used, 0) / totalPeriods
  const totalVariance = analytics.historical_periods.reduce((sum, p) => 
    sum + ((p.spent_amount_cents - p.budgeted_amount_cents) / 100), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{budget.name} Budget History</h2>
          <p className="text-slate-600">Track your budget performance over time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'chart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('chart')}
          >
            Chart View
          </Button>
          <Button
            variant={view === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('table')}
          >
            Table View
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Periods</p>
              <p className="text-2xl font-bold text-slate-900">{totalPeriods}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Over Budget</p>
              <p className="text-2xl font-bold text-slate-900">{overBudgetPeriods}</p>
              <p className="text-sm text-slate-500">{((overBudgetPeriods / totalPeriods) * 100).toFixed(1)}% of periods</p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${overBudgetPeriods > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Usage</p>
              <p className="text-2xl font-bold text-slate-900">{averageUsage.toFixed(1)}%</p>
            </div>
            {averageUsage > 100 ? (
              <TrendingUp className="w-8 h-8 text-red-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-emerald-500" />
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Variance</p>
              <p className={`text-2xl font-bold ${totalVariance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${Math.abs(totalVariance).toFixed(2)}
              </p>
              <p className="text-sm text-slate-500">{totalVariance > 0 ? 'Over' : 'Under'} budget</p>
            </div>
            {totalVariance > 0 ? (
              <TrendingUp className="w-8 h-8 text-red-500" />
            ) : (
              <TrendingDown className="w-8 h-8 text-emerald-500" />
            )}
          </div>
        </Card>
      </div>

      {/* Chart or Table View */}
      {view === 'chart' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending vs Budget Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Budget vs Actual Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `$${value.toFixed(2)}`,
                    name === 'budgeted' ? 'Budgeted' : 'Spent'
                  ]}
                />
                <Bar dataKey="budgeted" fill="#3b82f6" name="budgeted" />
                <Bar dataKey="spent" fill={(entry: any) => entry.over ? '#ef4444' : '#10b981'} name="spent" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Usage Percentage Trend */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Usage Percentage Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Usage']}
                />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="5 5" label="Budget Limit" />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Period Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-2 font-medium text-slate-700">Period</th>
                  <th className="text-right p-2 font-medium text-slate-700">Budgeted</th>
                  <th className="text-right p-2 font-medium text-slate-700">Spent</th>
                  <th className="text-right p-2 font-medium text-slate-700">Usage</th>
                  <th className="text-right p-2 font-medium text-slate-700">Variance</th>
                  <th className="text-center p-2 font-medium text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.historical_periods.slice(-20).reverse().map((period, index) => {
                  const isOverBudget = period.percentage_used > 100
                  const variance = (period.spent_amount_cents - period.budgeted_amount_cents) / 100
                  
                  return (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2">
                        <div className="font-medium">
                          {new Date(period.period_start).toLocaleDateString()} - {new Date(period.period_end).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-2 text-right">${(period.budgeted_amount_cents / 100).toFixed(2)}</td>
                      <td className="p-2 text-right">${(period.spent_amount_cents / 100).toFixed(2)}</td>
                      <td className={`p-2 text-right font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {period.percentage_used.toFixed(1)}%
                      </td>
                      <td className={`p-2 text-right font-medium ${
                        variance > 0 ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {variance >= 0 ? '+' : ''}${variance.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center">
                          {isOverBudget ? (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : period.percentage_used > 80 ? (
                            <TrendingUp className="w-4 h-4 text-amber-500" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}