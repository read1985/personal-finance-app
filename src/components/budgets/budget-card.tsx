'use client'

import { useState } from 'react'
import { Budget, BudgetAnalytics } from '@/types/database'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PencilIcon, TrashIcon, Calendar, TrendingUp, TrendingDown, AlertTriangle, History, ChevronDown, ChevronUp } from 'lucide-react'

interface BudgetCardProps {
  budget: Budget
  analytics?: BudgetAnalytics
  onEdit: () => void
  onDelete: () => void
  onViewHistory?: () => void
}

export default function BudgetCard({ budget, analytics, onEdit, onDelete, onViewHistory }: BudgetCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  const currentPeriod = analytics?.current_period
  const isOverBudget = currentPeriod && currentPeriod.percentage_used > 100
  const isNearBudget = currentPeriod && currentPeriod.percentage_used > 80 && currentPeriod.percentage_used <= 100

  const getRecurrenceText = () => {
    const interval = budget.recurrence_interval === 1 ? '' : `${budget.recurrence_interval} `
    const type = budget.recurrence_type === 'daily' ? 'day' :
                 budget.recurrence_type === 'weekly' ? 'week' :
                 budget.recurrence_type === 'monthly' ? 'month' : 'year'
    const plural = budget.recurrence_interval === 1 ? type : type + 's'
    return `Every ${interval}${plural}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = () => {
    if (isOverBudget) return 'bg-red-500'
    if (isNearBudget) return 'bg-amber-500'
    return 'bg-emerald-500'
  }

  const getStatusIcon = () => {
    if (isOverBudget) return <AlertTriangle className="w-4 h-4 text-red-600" />
    if (isNearBudget) return <TrendingUp className="w-4 h-4 text-amber-600" />
    return <TrendingDown className="w-4 h-4 text-emerald-600" />
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{budget.name}</h3>
            {!budget.is_active && (
              <Badge variant="secondary" className="text-xs">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            <span className={`w-3 h-3 rounded-full ${budget.category?.color || 'bg-slate-500'}`}></span>
            <span>{budget.category?.name || 'Unknown Category'}</span>
          </div>
        </div>
        <div className="flex gap-1">
          {onViewHistory && (
            <Button variant="ghost" size="sm" onClick={onViewHistory} title="View History">
              <History className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit Budget">
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} title="Delete Budget">
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Budget Amount */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-600">Budget</span>
          <span className="text-lg font-bold text-slate-900">
            ${(budget.amount_cents / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>{getRecurrenceText()}</span>
        </div>
      </div>

      {/* Current Period Progress */}
      {currentPeriod ? (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Current Period</span>
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-sm font-medium">
                {currentPeriod.percentage_used.toFixed(1)}%
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all ${getStatusColor()}`}
              style={{ width: `${Math.min(currentPeriod.percentage_used, 100)}%` }}
            />
          </div>

          {/* Period Details */}
          <div className="space-y-1 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Spent:</span>
              <span className="font-medium">
                ${(currentPeriod.spent_amount_cents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className={`font-medium ${currentPeriod.remaining_amount_cents < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${(Math.abs(currentPeriod.remaining_amount_cents) / 100).toFixed(2)}
                {currentPeriod.remaining_amount_cents < 0 && ' over'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Period:</span>
              <span>
                {formatDate(currentPeriod.period_start)} - {formatDate(currentPeriod.period_end)}
              </span>
            </div>
            {currentPeriod.days_remaining > 0 && (
              <div className="flex justify-between">
                <span>Days left:</span>
                <span className="font-medium">{currentPeriod.days_remaining}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-slate-50 rounded text-center">
          <p className="text-sm text-slate-600">No current period data</p>
          <p className="text-xs text-slate-500 mt-1">
            Budget starts {formatDate(budget.start_date)}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-slate-500">
            <span>Start: {formatDate(budget.start_date)}</span>
            {budget.end_date && (
              <span className="ml-3">End: {formatDate(budget.end_date)}</span>
            )}
          </div>
          
          {analytics?.historical_periods && analytics.historical_periods.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-6 px-2 text-xs text-slate-600 hover:text-slate-900"
            >
              <History className="w-3 h-3 mr-1" />
              History
              {showHistory ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Historical Periods */}
      {showHistory && analytics?.historical_periods && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-3">Budget History</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.historical_periods.slice(0, 12).map((period, index) => {
              const isOverBudget = period.percentage_used > 100
              const isNearBudget = period.percentage_used > 80 && period.percentage_used <= 100
              const isUnderBudget = period.percentage_used <= 80
              
              return (
                <div key={index} className="p-2 bg-slate-50 rounded text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">
                      {formatDate(period.period_start)} - {formatDate(period.period_end)}
                    </span>
                    <div className="flex items-center gap-1">
                      {isOverBudget && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      {isNearBudget && <TrendingUp className="w-3 h-3 text-amber-500" />}
                      {isUnderBudget && <TrendingDown className="w-3 h-3 text-emerald-500" />}
                      <span className={`font-medium ${
                        isOverBudget ? 'text-red-600' : 
                        isNearBudget ? 'text-amber-600' : 
                        'text-emerald-600'
                      }`}>
                        {period.percentage_used.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-slate-600">
                    <span>Spent: ${(period.spent_amount_cents / 100).toFixed(2)}</span>
                    <span className={
                      period.spent_amount_cents > period.budgeted_amount_cents 
                        ? 'text-red-600' 
                        : 'text-emerald-600'
                    }>
                      {period.spent_amount_cents <= period.budgeted_amount_cents ? 'Under' : 'Over'}: 
                      ${(Math.abs(period.budgeted_amount_cents - period.spent_amount_cents) / 100).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                    <div
                      className={`h-1 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : 
                        isNearBudget ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(period.percentage_used, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}