export interface Account {
  id: string
  akahu_id: string
  owner: string
  name: string
  type: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  account_id: string | null
  akahu_id: string | null
  posted_at: string
  amount_cents: number
  description: string
  category: string | null
  needs_review: boolean | null
  confidence: string | null
  raw: Record<string, unknown> | null
  created_at: string
  updated_at: string
  account?: Account
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  updated_at: string
}

export interface Rule {
  id: string
  matcher: string
  category: string
  confidence: number | null
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface AICategorization {
  id: string
  transaction_id: string | null
  description: string
  suggested_category: string | null
  confidence: string | null
  reasoning: string | null
  model_used: string | null
  created_at: string
}

export interface SpendingInsight {
  category: string
  amount: number
  color: string
  percentage: number
}

export interface MonthlySpending {
  month: string
  total: number
  categories: SpendingInsight[]
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  name: string
  amount_cents: number
  start_date: string
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  recurrence_interval: number
  end_date: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  category?: Category
}

export interface BudgetPeriod {
  id: string
  budget_id: string
  period_start: string
  period_end: string
  budgeted_amount_cents: number
  spent_amount_cents: number
  created_at: string
  updated_at: string
  budget?: Budget
}

export interface BudgetAnalytics {
  budget_id: string
  budget_name: string
  category_name: string
  current_period: {
    period_start: string
    period_end: string
    budgeted_amount_cents: number
    spent_amount_cents: number
    remaining_amount_cents: number
    percentage_used: number
    days_remaining: number
  } | null
  historical_periods: Array<{
    period_start: string
    period_end: string
    budgeted_amount_cents: number
    spent_amount_cents: number
    percentage_used: number
  }>
}