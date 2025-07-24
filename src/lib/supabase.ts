import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for database operations
export const db = {
  // Transactions
  async getTransactions(limit = 50, offset = 0, search = '', startDate = '', endDate = '') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(*)
      `)
      .order('posted_at', { ascending: false })

    // Add search functionality
    if (search) {
      query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Add date range filtering
    if (startDate) {
      query = query.gte('posted_at', startDate)
    }
    if (endDate) {
      query = query.lte('posted_at', endDate + 'T23:59:59.999Z')
    }

    const { data, error } = await query.range(offset, offset + limit - 1)
    
    if (error) throw error
    return data || []
  },

  async getTransactionsCount(search = '', startDate = '', endDate = '') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })

    // Add search functionality
    if (search) {
      query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%`)
    }

    // Add date range filtering
    if (startDate) {
      query = query.gte('posted_at', startDate)
    }
    if (endDate) {
      query = query.lte('posted_at', endDate + 'T23:59:59.999Z')
    }

    const { count, error } = await query
    
    if (error) throw error
    return count || 0
  },

  async getUncategorizedTransactions(search = '', startDate = '', endDate = '') {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(*)
      `)
      .is('category', null)
      .order('posted_at', { ascending: false })

    // Add search functionality
    if (search) {
      query = query.ilike('description', `%${search}%`)
    }

    // Add date range filtering
    if (startDate) {
      query = query.gte('posted_at', startDate)
    }
    if (endDate) {
      query = query.lte('posted_at', endDate + 'T23:59:59.999Z')
    }

    const { data, error } = await query
    
    if (error) throw error
    return data || []
  },

  async updateTransactionCategory(id: string, category: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .update({ 
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    
    if (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
    return data?.[0]
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteCategory(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

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

  async createRule(matcher: string, category: string, confidence: number = 0.5) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Ensure confidence is in decimal format (0.0 to 1.0) for rules table (integer)
    // But we need to store it as integer percentage for rules table
    const confidenceForRules = Math.round(confidence * 100)

    const { data, error } = await supabase
      .from('rules')
      .insert({ matcher, category, confidence: confidenceForRules, user_id: user.id })
      .select()
    
    if (error) {
      console.error('Error creating rule:', error)
      throw error
    }
    return data[0]
  },

  async updateRule(id: string, updates: { matcher?: string; category?: string; confidence?: number }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Convert confidence from decimal to percentage if provided
    const updatesWithConversion = { ...updates }
    if (updates.confidence !== undefined) {
      updatesWithConversion.confidence = Math.round(updates.confidence * 100)
    }

    const { data, error } = await supabase
      .from('rules')
      .update({ ...updatesWithConversion, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteRule(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

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