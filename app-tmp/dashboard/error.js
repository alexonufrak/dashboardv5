'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">
          Something went wrong
        </h2>
        <p className="text-red-700 dark:text-red-300 mb-6">
          {error.message || 'An unexpected error occurred loading the dashboard.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/dashboard'}
          >
            Go to Dashboard Home
          </Button>
          <Button 
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  )
}