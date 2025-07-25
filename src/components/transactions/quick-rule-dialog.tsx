"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/supabase"
import { Transaction, Category } from "@/types/database"

interface QuickRuleDialogProps {
  transaction: Transaction
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRuleCreated: () => void
}

export function QuickRuleDialog({ 
  transaction, 
  categories, 
  open, 
  onOpenChange,
  onRuleCreated 
}: QuickRuleDialogProps) {
  const [ruleText, setRuleText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [confidence, setConfidence] = useState(80) // Display as percentage
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update ruleText when transaction changes or dialog opens
  useEffect(() => {
    if (open) {
      // Extract merchant name from transaction description
      const desc = transaction.description.trim()
      // Try to find the main merchant name (usually the first part before special characters)
      const merchantMatch = desc.match(/^([A-Za-z0-9\s&'-]+)/)
      setRuleText(merchantMatch ? merchantMatch[1].trim() : desc)
      // Reset other form fields
      setSelectedCategory("")
      setConfidence(80)
      setError(null)
    }
  }, [transaction, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory || !ruleText.trim()) return

    setLoading(true)
    setError(null)

    try {
      // Wrap the rule text with %% for pattern matching
      const matcher = `%${ruleText.trim()}%`
      
      // Create the rule first (convert percentage to decimal)
      await db.createRule(matcher, selectedCategory, confidence / 100)
      
      // Then update the current transaction with the selected category
      await db.updateTransactionCategory(transaction.id, selectedCategory)
      
      // Notify parent components to refresh data
      onRuleCreated()
      onOpenChange(false)
      
      // Reset form
      setSelectedCategory("")
      setConfidence(80) // Reset to default percentage
      setError(null)
    } catch (err) {
      console.error('Error creating rule:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rule and categorize transaction'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Rule for Transaction</DialogTitle>
          <DialogDescription>
            Create an automatic categorization rule based on this transaction&apos;s description.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Transaction:</p>
            <p className="font-medium">{transaction.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Pattern
              </label>
              <input
                type="text"
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                className="w-full border rounded-md px-3 py-2"
                placeholder="Enter text to match"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This will match transactions containing: <code>%{ruleText.trim()}%</code>
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.name)}
                    className={`text-left p-2 rounded border ${
                      selectedCategory === category.name 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Badge className={category.color} variant="secondary">
                      {category.name}
                    </Badge>
                  </button>
                ))}
              </div>
              {!selectedCategory && (
                <p className="text-xs text-red-500 mt-1">Please select a category</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={confidence}
                onChange={(e) => setConfidence(parseInt(e.target.value))}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !selectedCategory}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Rule & Categorize'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}