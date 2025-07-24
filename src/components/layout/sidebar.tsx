"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  Settings,
  CreditCard,
  BarChart3,
  LogOut
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/transactions",
    icon: Receipt,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    name: "Rules",
    href: "/rules",
    icon: Settings,
  },
  {
    name: "Accounts",
    href: "/accounts",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold text-gray-900">Finance App</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-400"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 pb-4 border-t pt-4">
        <div className="mb-3 px-3">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.email}
          </p>
        </div>
        <Button
          onClick={signOut}
          variant="ghost"
          className="w-full justify-start text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}