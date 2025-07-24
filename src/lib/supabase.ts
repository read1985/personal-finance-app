import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for database operations
export const db = {
  // Transactions
  async getTransactions(limit = 50, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(*)
      `)
      .order('posted_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (error) throw error
    return data || []
  },

  async getUncategorizedTransactions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(*)
      `)
      .or('category.is.null,needs_review.eq.true')
      .order('posted_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async updateTransactionCategory(id: string, category: string) {
    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        category,
        needs_review: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Categories
  async getCategories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async createCategory(name: string, color: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, user_id: user.id })
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateCategory(id: string, updates: { name?: string; color?: string }) {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Rules
  async getRules() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async createRule(matcher: string, category: string, confidence: number = 50) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('rules')
      .insert({ matcher, category, confidence, user_id: user.id })
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateRule(id: string, updates: { matcher?: string; category?: string; confidence?: number }) {
    const { data, error } = await supabase
      .from('rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteRule(id: string) {
    const { error } = await supabase
      .from('rules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Accounts
  async getAccounts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  // Analytics
  async getSpendingByCategory(startDate: string, endDate: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        category,
        amount_cents
      `)
      .gte('posted_at', startDate)
      .lte('posted_at', endDate)
      .not('category', 'is', null)
      .lt('amount_cents', 0) // Only expenses
    
    if (error) throw error
    return data || []
  },

  async getMonthlySpending(months: number = 6) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        posted_at,
        amount_cents,
        category
      `)
      .gte('posted_at', startDate.toISOString())
      .lte('posted_at', endDate.toISOString())
      .lt('amount_cents', 0) // Only expenses
      .order('posted_at')
    
    if (error) throw error
    return data || []
  }
}