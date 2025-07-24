import { SpendingOverview } from "@/components/dashboard/spending-overview"

export default function Home() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your personal finance overview</p>
      </div>
      
      <SpendingOverview />
    </div>
  )
}
