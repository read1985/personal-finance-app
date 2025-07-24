"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface AnalyticsData {
  monthlySpending: Array<{ month: string; amount: number }>
  categoryBreakdown: Array<{ category: string; amount: number; color: string }>
  totalSpent: number
  avgMonthlySpending: number
  topCategory: string | null
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m'>('6m')

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  async function loadAnalytics() {
    try {
      setLoading(true)
      
      // Get date range
      const endDate = new Date()
      const startDate = new Date()
      const months = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12
      startDate.setMonth(startDate.getMonth() - months)

      // Get spending data
      const [monthlyTransactions, categorySpending, categories] = await Promise.all([
        db.getMonthlySpending(months),
        db.getSpendingByCategory(startDate.toISOString(), endDate.toISOString()),
        db.getCategories()
      ])

      // Process monthly data
      const monthlyTotals = monthlyTransactions.reduce((acc, tx) => {
        const month = new Date(tx.posted_at).toLocaleDateString('en-US', { 
          month: 'short', 
          year: '2-digit' 
        })
        acc[month] = (acc[month] || 0) + Math.abs(tx.amount_cents)
        return acc
      }, {} as Record<string, number>)

      const monthlySpending = Object.entries(monthlyTotals)
        .map(([month, amount]) => ({
          month,
          amount: amount / 100
        }))
        .sort((a, b) => new Date(`01 ${a.month}`).getTime() - new Date(`01 ${b.month}`).getTime())

      // Process category data
      const categoryColors = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.color
        return acc
      }, {} as Record<string, string>)

      const categoryTotals = categorySpending.reduce((acc, tx) => {
        const category = tx.category || 'Uncategorized'
        acc[category] = (acc[category] || 0) + Math.abs(tx.amount_cents)
        return acc
      }, {} as Record<string, number>)

      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([category, amount]) => ({
          category,
          amount: amount / 100,
          color: categoryColors[category] || 'bg-gray-500'
        }))
        .sort((a, b) => b.amount - a.amount)

      // Calculate totals
      const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0)
      const avgMonthlySpending = totalSpent / months / 100
      const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : null

      setData({
        monthlySpending,
        categoryBreakdown,
        totalSpent,
        avgMonthlySpending,
        topCategory
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff']

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Unable to load analytics data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your spending patterns</p>
        </div>
        
        <div className="flex gap-2">
          {(['3m', '6m', '12m'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === range 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '3m' ? '3 Months' : range === '6m' ? '6 Months' : '12 Months'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Spent ({timeRange.toUpperCase()})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.totalSpent)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Avg Monthly Spending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.avgMonthlySpending * 100)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Top Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.topCategory || 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.categoryBreakdown.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown.slice(0, 8)} // Top 8 categories
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="amount"
                    label={({ category, value }) => `${category}: ${formatCurrency((value || 0) * 100)}`}
                  >
                    {data.categoryBreakdown.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.categoryBreakdown.map((category, index) => {
              const percentage = (category.amount / (data.totalSpent / 100)) * 100
              
              return (
                <div key={category.category} className="flex items-center space-x-4">
                  <div className="flex-1 flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                    <span className="font-medium">{category.category}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-500 w-12">
                      {percentage.toFixed(1)}%
                    </div>
                    <div className="font-semibold w-24 text-right">
                      {formatCurrency(category.amount * 100)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}