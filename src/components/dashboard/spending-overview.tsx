"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

interface SpendingData {
  category: string
  amount: number
  color: string
}

interface MonthlyData {
  month: string
  amount: number
}

export function SpendingOverview() {
  const [spendingData, setSpendingData] = useState<SpendingData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSpendingData()
  }, [])

  async function loadSpendingData() {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 1)

      // Get current month spending by category
      const transactions = await db.getSpendingByCategory(
        startDate.toISOString(),
        endDate.toISOString()
      )

      // Get categories for colors
      const categories = await db.getCategories()
      const categoryColors = categories.reduce((acc, cat) => {
        acc[cat.name] = cat.color
        return acc
      }, {} as Record<string, string>)

      // Process spending data
      const categoryTotals = transactions.reduce((acc, tx) => {
        const category = tx.category || 'Uncategorized'
        acc[category] = (acc[category] || 0) + Math.abs(tx.amount_cents)
        return acc
      }, {} as Record<string, number>)

      const spending = Object.entries(categoryTotals).map(([category, amount]) => ({
        category,
        amount,
        color: categoryColors[category] || 'bg-gray-500'
      }))

      setSpendingData(spending)
      setTotalSpent(Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0))

      // Get monthly data for the last 6 months
      const monthlyTransactions = await db.getMonthlySpending(6)
      const monthlyTotals = monthlyTransactions.reduce((acc, tx) => {
        const month = new Date(tx.posted_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        acc[month] = (acc[month] || 0) + Math.abs(tx.amount_cents)
        return acc
      }, {} as Record<string, number>)

      const monthly = Object.entries(monthlyTotals).map(([month, amount]) => ({
        month,
        amount: amount / 100 // Convert to dollars
      }))

      setMonthlyData(monthly)
    } catch (error) {
      console.error('Error loading spending data:', error)
    } finally {
      setLoading(false)
    }
  }

  const chartColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff']

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{spendingData.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {spendingData.length > 0 ? spendingData[0].category : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent / 30)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendingData.map((item, index) => ({
                      ...item,
                      value: item.amount / 100
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ category, value }) => `${category}: ${formatCurrency((value || 0) * 100)}`}
                  >
                    {spendingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency((Number(value) || 0) * 100)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency((Number(value) || 0) * 100)} />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}