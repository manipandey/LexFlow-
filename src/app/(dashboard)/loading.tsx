import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-72 bg-muted/60 rounded-md" />
      </div>

      {/* Grid Skeleton for Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card/50 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-8 rounded-lg bg-muted" />
            </div>
            <div className="h-6 w-16 bg-muted rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Charts / Main Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-96 rounded-xl border bg-card/30 p-6 flex flex-col justify-between">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
          </div>
        </div>
        <div className="h-96 rounded-xl border bg-card/30 p-6 flex flex-col justify-between">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/30" />
          </div>
        </div>
      </div>
    </div>
  )
}
