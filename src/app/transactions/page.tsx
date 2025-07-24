"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { Transaction, Category } from "@/types/database"
import { QuickRuleDialog } from "@/components/transactions/quick-rule-dialog"
import { Plus, Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'uncategorized'>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showRuleDialog, setShowRuleDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage] = useState(25)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Debounce search term
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when searching
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * itemsPerPage
      
      const [transactionsData, categoriesData, count] = await Promise.all([
        filter === 'uncategorized' 
          ? db.getUncategorizedTransactions(debouncedSearchTerm, startDate, endDate)
          : db.getTransactions(itemsPerPage, offset, debouncedSearchTerm, startDate, endDate),
        db.getCategories(),
        filter === 'uncategorized' 
          ? Promise.resolve(0) // We don't paginate uncategorized, so no count needed
          : db.getTransactionsCount(debouncedSearchTerm, startDate, endDate)
      ])
      
      setTransactions(transactionsData)
      setCategories(categoriesData)
      setTotalCount(count)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, filter, startDate, endDate])

  // Load data when debounced search term, filter, or dates change
  useEffect(() => {
    loadData()
  }, [debouncedSearchTerm, filter, startDate, endDate, loadData])

  // Load data when page changes
  useEffect(() => {
    loadData()
  }, [currentPage, loadData])

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

  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const showPagination = filter === 'all' && totalPages > 1

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
                {totalCount || transactions.length}
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

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search transactions or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        
        {/* Date Range Filters */}
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10 w-40 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Start date"
            />
          </div>
          <span className="text-slate-500 text-sm">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10 w-40 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="End date"
            />
          </div>
          {(startDate || endDate) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="text-slate-600 border-slate-300 hover:bg-slate-100"
            >
              Clear
            </Button>
          )}
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
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 rounded-lg border hover:bg-slate-50 transition-all duration-200 ${
                  !transaction.category 
                    ? 'border-amber-200 bg-amber-50' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Main Transaction Row */}
                <div className="flex items-center gap-4 mb-3">
                  {/* Category Indicator */}
                  <div className="flex-shrink-0">
                    {transaction.category ? (
                      <div 
                        className={`w-10 h-10 rounded-full ${getCategoryColor(transaction.category)} flex items-center justify-center text-white text-sm font-semibold`}
                      >
                        {transaction.category.slice(0, 2).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 text-lg">
                        ⚠️
                      </div>
                    )}
                  </div>

                  {/* Transaction Info Block */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">
                        {transaction.description}
                      </h3>
                      <span className={`font-bold text-lg tabular-nums ${
                        transaction.amount_cents < 0 
                          ? 'text-red-600' 
                          : 'text-emerald-600'
                      }`}>
                        {formatCurrency(transaction.amount_cents)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{transaction.account?.name}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.posted_at)}</span>
                      {transaction.confidence && (
                        <>
                          <span>•</span>
                          <span>{Math.round(parseFloat(transaction.confidence) * 100)}% confident</span>
                        </>
                      )}
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <Badge 
                            className={`${getCategoryColor(transaction.category)} border-none text-white text-xs px-2 py-0.5`}
                            variant="secondary"
                          >
                            {transaction.category}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Row */}
                <div className="flex items-center gap-2 ml-14">
                  <select
                    className="flex-1 text-sm border border-slate-300 rounded-md px-3 py-1.5 bg-white text-slate-700 focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors"
                    value={transaction.category || ''}
                    onChange={(e) => updateTransactionCategory(transaction.id, e.target.value)}
                  >
                    <option value="">
                      {transaction.category ? 'Change category...' : 'Select category...'}
                    </option>
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
                    className="text-xs border-slate-300 text-slate-600 hover:bg-slate-100 px-3 py-1.5"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Rule
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

        {/* Pagination Controls */}
        {showPagination && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-slate-600 px-3 py-1">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="border-slate-300 text-slate-600 hover:bg-slate-100"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
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