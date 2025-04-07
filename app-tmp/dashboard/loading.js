import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="dashboard-loading-container space-y-6 w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      
      {/* Main content skeleton */}
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        
        <div>
          <Skeleton className="h-6 w-32 mb-3" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}