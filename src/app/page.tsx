import { SpendingOverview } from "@/components/dashboard/spending-overview"

export default function Home() {
  return (
    <div className="p-6 bg-slate-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Welcome to your personal finance overview</p>
      </div>
      
      <SpendingOverview />
    </div>
  )
}
