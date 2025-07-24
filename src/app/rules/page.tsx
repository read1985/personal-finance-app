"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/supabase"
import { Rule, Category } from "@/types/database"
import { Plus, Edit, Trash2, Info } from "lucide-react"

interface RuleForm {
  matcher: string
  category: string
  confidence: number
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [form, setForm] = useState<RuleForm>({ matcher: '', category: '', confidence: 80 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [rulesData, categoriesData] = await Promise.all([
        db.getRules(),
        db.getCategories()
      ])
      setRules(rulesData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      if (editingRule) {
        await db.updateRule(editingRule.id, form)
      } else {
        await db.createRule(form.matcher, form.category, form.confidence)
      }
      
      await loadData()
      setShowForm(false)
      setEditingRule(null)
      setForm({ matcher: '', category: '', confidence: 80 })
    } catch (error) {
      console.error('Error saving rule:', error)
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm('Are you sure you want to delete this rule?')) return
    
    try {
      await db.deleteRule(ruleId)
      await loadData()
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  function startEdit(rule: Rule) {
    setEditingRule(rule)
    setForm({ 
      matcher: rule.matcher, 
      category: rule.category, 
      confidence: rule.confidence || 80 
    })
    setShowForm(true)
  }

  function cancelEdit() {
    setShowForm(false)
    setEditingRule(null)
    setForm({ matcher: '', category: '', confidence: 80 })
  }

  function getCategoryColor(categoryName: string) {
    const category = categories.find(c => c.name === categoryName)
    return category?.color || 'bg-gray-500'
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
          <h1 className="text-3xl font-bold text-gray-900">Categorization Rules</h1>
          <p className="text-gray-600">Manage automatic categorization rules for transactions</p>
        </div>
        
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Rule Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Pattern matching examples:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><code>%SUPERMARKET%</code> - matches any text containing &ldquo;SUPERMARKET&rdquo;</li>
              <li><code>Pak N Save%</code> - matches text starting with &ldquo;Pak N Save&rdquo;</li>
              <li><code>%Gas Station</code> - matches text ending with &ldquo;Gas Station&rdquo;</li>
              <li><code>EXACTLY THIS</code> - matches exact text &ldquo;EXACTLY THIS&rdquo;</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {editingRule ? 'Edit Rule' : 'New Rule'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern (Use % as wildcards)
                </label>
                <input
                  type="text"
                  value={form.matcher}
                  onChange={(e) => setForm({ ...form, matcher: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="%MERCHANT NAME%"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This pattern will match transaction descriptions
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select a category...</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.confidence}
                  onChange={(e) => setForm({ ...form, confidence: parseInt(e.target.value) })}
                  className="w-full border rounded-md px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher confidence rules take precedence
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">
                  {editingRule ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {rule.matcher}
                        </code>
                        <span className="text-gray-400">→</span>
                        <Badge className={getCategoryColor(rule.category)}>
                          {rule.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Confidence: {rule.confidence}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEdit(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {rules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No rules found. Create your first rule to start automatic categorization.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}