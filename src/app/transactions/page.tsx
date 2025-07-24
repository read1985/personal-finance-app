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
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {transactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`transaction-row grid grid-cols-[48px_1fr_auto_120px_100px_100px] gap-3 items-center py-3 px-4 hover:bg-slate-50 transition-colors duration-200 ${
                  !transaction.category 
                    ? 'bg-amber-50 border-l-4 border-l-amber-400' 
                    : index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                {/* Icon Column - 48px */}
                <div className="flex-shrink-0">
                  {transaction.category ? (
                    <div 
                      className={`w-8 h-8 rounded-full ${getCategoryColor(transaction.category)} flex items-center justify-center text-white text-xs font-semibold`}
                    >
                      {transaction.category.slice(0, 2).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-sm">
                      ⚠️
                    </div>
                  )}
                </div>

                {/* Description Column - 1fr */}
                <div className="min-w-0">
                  <h3 className="font-medium text-slate-800 truncate text-sm leading-tight">
                    {transaction.description}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {transaction.account?.name}
                    {transaction.confidence && (
                      <span className="ml-2">
                        {Math.round(parseFloat(transaction.confidence) * 100)}% confident
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Column - auto */}
                <div className="text-right">
                  <span className={`font-bold text-sm tabular-nums ${
                    transaction.amount_cents < 0 
                      ? 'text-red-600' 
                      : 'text-emerald-600'
                  }`}>
                    {formatCurrency(transaction.amount_cents)}
                  </span>
                </div>

                {/* Category Column - 120px */}
                <div className="category-dropdown max-w-[120px]">
                  {transaction.category ? (
                    <Badge 
                      className={`${getCategoryColor(transaction.category)} border-none text-white text-xs px-2 py-1 cursor-pointer hover:opacity-80 w-full justify-center truncate`}
                      onClick={() => {
                        // TODO: Implement category popover
                        const newCategory = prompt('Select new category:', transaction.category)
                        if (newCategory && newCategory !== transaction.category) {
                          updateTransactionCategory(transaction.id, newCategory)
                        }
                      }}
                    >
                      {transaction.category}
                    </Badge>
                  ) : (
                    <button
                      onClick={() => {
                        // Quick category selector
                        const categoryNames = categories.map(c => c.name)
                        const selected = prompt(`Select category:\n${categoryNames.join('\n')}`)
                        if (selected && categoryNames.includes(selected)) {
                          updateTransactionCategory(transaction.id, selected)
                        }
                      }}
                      className="w-full px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded border border-amber-300 hover:bg-amber-200 transition-colors"
                    >
                      + Category
                    </button>
                  )}
                </div>

                {/* Date Column - 100px */}
                <div className="text-xs text-slate-500 text-right">
                  {formatDate(transaction.posted_at)}
                </div>

                {/* Actions Column - 100px */}
                <div className="actions-column w-[100px] justify-self-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRuleDialog(transaction)}
                    className="text-xs border-slate-300 text-slate-600 hover:bg-slate-100 px-2 py-1 h-6"
                    title="Create rule for automatic categorization"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Rule
                  </Button>
                </div>
              </div>
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