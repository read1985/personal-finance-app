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

    // Add date range filtering with timezone support
    if (startDate) {
      // Convert local date to start of day in user's timezone
      const startDateTime = new Date(startDate + 'T00:00:00')
      query = query.gte('posted_at', startDateTime.toISOString())
    }
    if (endDate) {
      // Convert local date to end of day in user's timezone
      const endDateTime = new Date(endDate + 'T23:59:59.999')
      query = query.lte('posted_at', endDateTime.toISOString())
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

    // Add date range filtering with timezone support
    if (startDate) {
      // Convert local date to start of day in user's timezone
      const startDateTime = new Date(startDate + 'T00:00:00')
      query = query.gte('posted_at', startDateTime.toISOString())
    }
    if (endDate) {
      // Convert local date to end of day in user's timezone
      const endDateTime = new Date(endDate + 'T23:59:59.999')
      query = query.lte('posted_at', endDateTime.toISOString())
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

    // Add date range filtering with timezone support
    if (startDate) {
      // Convert local date to start of day in user's timezone
      const startDateTime = new Date(startDate + 'T00:00:00')
      query = query.gte('posted_at', startDateTime.toISOString())
    }
    if (endDate) {
      // Convert local date to end of day in user's timezone
      const endDateTime = new Date(endDate + 'T23:59:59.999')
      query = query.lte('posted_at', endDateTime.toISOString())
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
  },

  // Budgets
  async getBudgets() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getBudget(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async createBudget({
    category_id,
    name,
    amount_cents,
    start_date,
    recurrence_type,
    recurrence_interval = 1,
    end_date
  }: {
    category_id: string
    name: string
    amount_cents: number
    start_date: string
    recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurrence_interval?: number
    end_date?: string | null
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category_id,
        name,
        amount_cents,
        start_date,
        recurrence_type,
        recurrence_interval,
        end_date
      })
      .select(`
        *,
        category:categories(*)
      `)
    
    if (error) throw error
    
    // Generate initial budget periods
    if (data?.[0]?.id) {
      const { error: periodError } = await supabase.rpc('generate_budget_periods', {
        p_budget_id: data[0].id
      })
      if (periodError) {
        console.error('Error generating budget periods:', periodError)
      }
    }
    
    return data[0]
  },

  async updateBudget(id: string, updates: {
    name?: string
    amount_cents?: number
    start_date?: string
    recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly'
    recurrence_interval?: number
    end_date?: string | null
    is_active?: boolean
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        category:categories(*)
      `)
    
    if (error) throw error
    
    // Regenerate budget periods if timing-related fields changed
    if (updates.start_date || updates.recurrence_type || updates.recurrence_interval || updates.end_date) {
      const { error: periodError } = await supabase.rpc('generate_budget_periods', {
        p_budget_id: id
      })
      if (periodError) {
        console.error('Error regenerating budget periods:', periodError)
      }
    }
    
    return data[0]
  },

  async deleteBudget(id: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Budget Periods
  async getBudgetPeriods(budgetId: string, limit = 12) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budget_periods')
      .select(`
        *,
        budget:budgets(
          *,
          category:categories(*)
        )
      `)
      .eq('budget_id', budgetId)
      .order('period_start', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async getCurrentBudgetPeriod(budgetId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const today = new Date().toISOString().split('T')[0] // Get YYYY-MM-DD format

    const { data, error } = await supabase
      .from('budget_periods')
      .select(`
        *,
        budget:budgets(
          *,
          category:categories(*)
        )
      `)
      .eq('budget_id', budgetId)
      .lte('period_start', today)
      .gte('period_end', today)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // Ignore "not found" error
    return data
  },

  async refreshBudgetSpending() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('refresh_budget_spending')
    if (error) throw error
  },

  async generateBudgetPeriods(budgetId: string, endDate?: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase.rpc('generate_budget_periods', {
      p_budget_id: budgetId,
      p_end_date: endDate || null
    })
    if (error) throw error
  },

  // Budget Analytics
  async getBudgetAnalytics(budgetId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get budget details
    const budget = await this.getBudget(budgetId)
    if (!budget) throw new Error('Budget not found')

    // Get current period
    const currentPeriod = await this.getCurrentBudgetPeriod(budgetId)
    
    // Get historical periods (last 12)
    const historicalPeriods = await this.getBudgetPeriods(budgetId, 12)

    // Calculate current period analytics
    let currentAnalytics = null
    if (currentPeriod) {
      const remainingAmount = currentPeriod.budgeted_amount_cents - currentPeriod.spent_amount_cents
      const percentageUsed = currentPeriod.budgeted_amount_cents > 0 
        ? (currentPeriod.spent_amount_cents / currentPeriod.budgeted_amount_cents) * 100 
        : 0
      
      const periodEnd = new Date(currentPeriod.period_end)
      const today = new Date()
      const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

      currentAnalytics = {
        period_start: currentPeriod.period_start,
        period_end: currentPeriod.period_end,
        budgeted_amount_cents: currentPeriod.budgeted_amount_cents,
        spent_amount_cents: currentPeriod.spent_amount_cents,
        remaining_amount_cents: remainingAmount,
        percentage_used: Math.round(percentageUsed * 100) / 100,
        days_remaining: daysRemaining
      }
    }

    // Process historical periods
    const historicalAnalytics = historicalPeriods.map(period => ({
      period_start: period.period_start,
      period_end: period.period_end,
      budgeted_amount_cents: period.budgeted_amount_cents,
      spent_amount_cents: period.spent_amount_cents,
      percentage_used: period.budgeted_amount_cents > 0 
        ? Math.round((period.spent_amount_cents / period.budgeted_amount_cents) * 10000) / 100
        : 0
    }))

    return {
      budget_id: budget.id,
      budget_name: budget.name,
      category_name: budget.category?.name || 'Unknown',
      current_period: currentAnalytics,
      historical_periods: historicalAnalytics
    }
  },

  async getAllBudgetAnalytics() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const budgets = await this.getBudgets()
    const analytics = await Promise.all(
      budgets.filter(budget => budget.is_active).map(budget => 
        this.getBudgetAnalytics(budget.id)
      )
    )
    
    return analytics
  }
}