"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { Transaction, Category } from "@/types/database"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'uncategorized'>('all')

  useEffect(() => {
    loadData()
  }, [filter])

  async function loadData() {
    try {
      setLoading(true)
      const [transactionsData, categoriesData] = await Promise.all([
        filter === 'uncategorized' ? db.getUncategorizedTransactions() : db.getTransactions(),
        db.getCategories()
      ])
      
      setTransactions(transactionsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateTransactionCategory(transactionId: string, categoryName: string) {
    try {
      await db.updateTransactionCategory(transactionId, categoryName)
      await loadData() // Refresh data
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  function getCategoryColor(categoryName: string | null) {
    if (!categoryName) return 'bg-gray-100 text-gray-800'
    const category = categories.find(c => c.name === categoryName)
    return category?.color || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600">View and categorize your financial transactions</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Transactions
          </Button>
          <Button
            variant={filter === 'uncategorized' ? 'default' : 'outline'}
            onClick={() => setFilter('uncategorized')}
          >
            Need Review
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {transaction.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transaction.account?.name} • {formatDate(transaction.posted_at)}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.amount_cents < 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(transaction.amount_cents)}
                      </p>
                      {transaction.confidence && (
                        <p className="text-xs text-gray-500">
                          {Math.round(parseFloat(transaction.confidence) * 100)}% confidence
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  {transaction.category ? (
                    <Badge 
                      className={getCategoryColor(transaction.category)}
                      variant="secondary"
                    >
                      {transaction.category}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Uncategorized</Badge>
                  )}
                  
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={transaction.category || ''}
                    onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {filter === 'uncategorized' 
                  ? 'No transactions need review' 
                  : 'No transactions found'
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}