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