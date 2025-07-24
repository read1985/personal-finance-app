"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { Transaction, Category } from "@/types/database"
import { QuickRuleDialog } from "@/components/transactions/quick-rule-dialog"
import { Plus, Zap } from "lucide-react"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'uncategorized'>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)

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

  function openRuleDialog(transaction: Transaction) {
    setSelectedTransaction(transaction)
    setShowRuleDialog(true)
  }

  function handleRuleCreated() {
    loadData() // Refresh the transactions
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
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Transactions</h1>
          <p className="text-slate-600">View and categorize your financial transactions</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
          >
            All Transactions
            {filter === 'all' && (
              <Badge variant="secondary" className="ml-2 bg-white text-slate-600">
                {transactions.length}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'uncategorized' ? 'default' : 'outline'}
            onClick={() => setFilter('uncategorized')}
            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
          >
            Uncategorized
            {filter === 'uncategorized' && (
              <Badge variant="secondary" className="ml-2 bg-white text-amber-600">
                {transactions.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-slate-800">
            {filter === 'uncategorized' ? 'Uncategorized Transactions' : 'Recent Transactions'}
          </CardTitle>
          {filter === 'uncategorized' && (
            <p className="text-sm text-slate-600">
              These transactions don&apos;t have a category yet. Use the dropdown to categorize them or click &ldquo;Add Rule&rdquo; to create automatic rules.
            </p>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                className={`p-0 transition-all duration-200 hover:shadow-md ${
                  !transaction.category 
                    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <CardContent className="p-4">
                  {/* Transaction Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">
                        {transaction.description}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-medium">{transaction.account?.name}</span>
                        <span>•</span>
                        <span>{formatDate(transaction.posted_at)}</span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-3">
                      <p className={`text-xl font-bold ${
                        transaction.amount_cents < 0 
                          ? 'text-red-500' 
                          : 'text-emerald-600'
                      }`}>
                        {formatCurrency(transaction.amount_cents)}
                      </p>
                      {transaction.confidence && (
                        <span className="text-xs text-slate-400">
                          {Math.round(parseFloat(transaction.confidence) * 100)}% confident
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Status */}
                  <div className="mb-3">
                    {transaction.category ? (
                      <Badge 
                        className={`${getCategoryColor(transaction.category)} border-none text-white`}
                        variant="secondary"
                      >
                        {transaction.category}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-400 text-amber-800 bg-amber-100">
                        ⚠️ Needs Categorization
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <select
                      className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-colors"
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

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRuleDialog(transaction)}
                      className="px-3 py-2 border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-700 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">
                  {filter === 'uncategorized' ? '🎉' : '📝'}
                </div>
                <p className="text-lg font-medium text-slate-600 mb-1">
                  {filter === 'uncategorized' 
                    ? 'All transactions are categorized!' 
                    : 'No transactions found'
                  }
                </p>
                <p className="text-sm text-slate-500">
                  {filter === 'uncategorized' 
                    ? 'Great job keeping your finances organized!'
                    : 'Your transactions will appear here once they are synced.'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTransaction && (
        <QuickRuleDialog
          transaction={selectedTransaction}
          categories={categories}
          open={showRuleDialog}
          onOpenChange={setShowRuleDialog}
          onRuleCreated={handleRuleCreated}
        />
      )}
    </div>
  )
}