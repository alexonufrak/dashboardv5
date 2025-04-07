'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Error Page - Client Component
 * 
 * Handles application errors in the App Router
 */
export default function Error({ error, reset }) {
  // Log the error to console
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mx-auto max-w-lg">
        <h2 className="text-red-800 dark:text-red-200 text-xl font-semibold mb-4">Something went wrong</h2>
        <div className="bg-white dark:bg-gray-800 p-4 rounded border border-red-100 dark:border-red-700 mb-4">
          <p className="text-red-700 dark:text-red-300">{error?.message || "An error occurred"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}