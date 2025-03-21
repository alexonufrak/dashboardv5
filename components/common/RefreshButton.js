"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

/**
 * A button component that refreshes data with status indicators
 * 
 * @param {Object} props Component props
 * @param {Function} props.onRefresh Callback to refresh data
 * @param {string} props.lastUpdated ISO timestamp of last data refresh
 * @param {string} props.variant Button variant (default: "ghost")
 * @param {string} props.size Button size (default: "sm")
 * @param {string} props.className Additional CSS classes
 * @param {Array} props.queryKeys Array of query keys to invalidate
 */
export default function RefreshButton({ 
  onRefresh, 
  lastUpdated,
  variant = "ghost",
  size = "sm",
  className,
  queryKeys = ["submissions", "milestones", "teams"],
}) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [status, setStatus] = useState("neutral") // neutral, fresh, stale, outdated
  
  // Determine data freshness status based on lastUpdated timestamp
  useEffect(() => {
    if (!lastUpdated) {
      setStatus("neutral")
      return
    }
    
    const lastUpdatedTime = new Date(lastUpdated).getTime()
    const now = Date.now()
    const minutesSinceUpdate = (now - lastUpdatedTime) / (1000 * 60)
    
    if (minutesSinceUpdate < 5) {
      setStatus("fresh") // Less than 5 minutes old - green
    } else if (minutesSinceUpdate < 15) {
      setStatus("stale") // 5-15 minutes old - yellow
    } else {
      setStatus("outdated") // More than 15 minutes old - red
    }
  }, [lastUpdated])
  
  // Get color classes based on status
  const getStatusClasses = () => {
    switch (status) {
      case "fresh":
        return "text-green-600 hover:text-green-700 hover:bg-green-100/50"
      case "stale":
        return "text-amber-600 hover:text-amber-700 hover:bg-amber-100/50"
      case "outdated":
        return "text-red-600 hover:text-red-700 hover:bg-red-100/50"
      default:
        return ""
    }
  }

  // Handle refresh click
  const handleRefresh = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    const toastId = toast.loading("Refreshing data...")
    
    try {
      // Use global queryClient if available
      if (typeof window !== 'undefined' && window._queryClient) {
        console.log(`Refreshing data for queries: ${queryKeys.join(', ')}`)
        
        // Invalidate all specified query keys
        queryKeys.forEach(key => {
          window._queryClient.invalidateQueries([key])
        })
        
        // Allow custom refresh logic if provided
        if (onRefresh) {
          await onRefresh()
        }
        
        toast.success("Data refreshed", { id: toastId })
      } else {
        console.warn("QueryClient not available, using fallback refresh method")
        if (onRefresh) {
          await onRefresh()
          toast.success("Data refreshed", { id: toastId })
        } else {
          toast.error("Refresh failed - no refresh method available", { id: toastId })
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data", { id: toastId })
    } finally {
      setIsRefreshing(false)
    }
  }
  
  // Get status text for tooltip
  const getStatusText = () => {
    if (!lastUpdated) return "Click to refresh data";
    
    const lastUpdatedTime = new Date(lastUpdated);
    const now = new Date();
    const minutesSinceUpdate = Math.floor((now - lastUpdatedTime) / (1000 * 60));
    
    if (minutesSinceUpdate < 1) {
      return "Data is fresh (updated just now)";
    } else if (minutesSinceUpdate === 1) {
      return "Data is fresh (updated 1 minute ago)";
    } else if (minutesSinceUpdate < 5) {
      return `Data is fresh (updated ${minutesSinceUpdate} minutes ago)`;
    } else if (minutesSinceUpdate < 15) {
      return `Data may be stale (updated ${minutesSinceUpdate} minutes ago)`;
    } else {
      return `Data may be outdated (updated ${minutesSinceUpdate} minutes ago)`;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleRefresh}
            variant={variant}
            size={size}
            className={cn(
              "gap-1 focus-visible:ring-offset-0", 
              getStatusClasses(),
              className
            )}
            disabled={isRefreshing}
          >
            <RefreshCw 
              className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {getStatusText()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}