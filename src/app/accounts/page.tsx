"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { db } from "@/lib/supabase"
import { Account } from "@/types/database"
import { CreditCard, Wallet } from "lucide-react"

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
  }, [])

  async function loadAccounts() {
    try {
      const data = await db.getAccounts()
      setAccounts(data)
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  function getAccountIcon(accountType: string) {
    switch (accountType.toLowerCase()) {
      case 'credit card':
      case 'credit_card':
        return CreditCard
      default:
        return Wallet
    }
  }

  function getAccountTypeColor(accountType: string) {
    switch (accountType.toLowerCase()) {
      case 'credit card':
      case 'credit_card':
        return 'bg-red-100 text-red-800'
      case 'savings':
        return 'bg-green-100 text-green-800'
      case 'checking':
      case 'transaction':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
        <p className="text-gray-600">View your connected bank accounts and cards</p>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              <Wallet className="mx-auto h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium mb-2">No accounts found</h3>
              <p>No bank accounts are currently connected to your profile.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const IconComponent = getAccountIcon(account.type)
            
            return (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <IconComponent className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {account.name}
                        </h3>
                        <Badge 
                          variant="secondary"
                          className={getAccountTypeColor(account.type)}
                        >
                          {account.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Account ID</span>
                      <span className="font-mono text-xs">
                        {account.akahu_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Added</span>
                      <span>{formatDate(account.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}