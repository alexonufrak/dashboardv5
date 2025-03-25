"use client"

import React from 'react'
import { Button } from "@/components/ui/button"

/**
 * Component displayed when the user is not participating in any program
 */
export function NotParticipatingError({ onNavigateToDashboard }) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <div className="bg-muted border rounded-md p-4 mb-4">
          <h3 className="text-lg font-medium">No Active Program</h3>
          <p className="text-muted-foreground">You are not currently participating in any program.</p>
        </div>
        
        <div className="bg-background border rounded-md p-4 mb-4">
          <h4 className="font-medium mb-2">Looking for Programs?</h4>
          <p className="text-muted-foreground mb-3">Check out available programs on the dashboard page.</p>
          <Button onClick={onNavigateToDashboard}>
            Browse Programs
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Component displayed when there is a general error loading the program
 */
export function GeneralProgramError({ error, onRetry, onNavigateToDashboard }) {
  // Import ErrorDisplay dynamically to avoid circular dependencies
  const [ErrorDisplay, setErrorDisplay] = React.useState(null);
  
  React.useEffect(() => {
    // Dynamically import the ErrorDisplay component
    import('@/components/common/ErrorDisplay').then(module => {
      setErrorDisplay(() => module.default);
    });
  }, []);
  
  // Show a simpler error while loading the ErrorDisplay component
  if (!ErrorDisplay) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-md mb-4">
            <h3 className="text-lg font-medium">Error Loading Program</h3>
            <p>{error}</p>
          </div>
          <Button onClick={onRetry}>Retry</Button>
          <Button variant="outline" className="ml-2" onClick={onNavigateToDashboard}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <div className="w-full max-w-3xl">
        <ErrorDisplay
          title="Error Loading Program"
          message={error}
          redirectUrl="/dashboard"
          redirectLabel="Return to Dashboard"
          onRetry={onRetry}
          errorCode="PROGRAM_LOAD_ERROR"
          errorDetails={`Failed to load program data. This could be due to network issues, data access permissions, or a temporary service disruption.`}
        />
      </div>
    </div>
  );
}

/**
 * Component displayed when no program data is available
 */
export function NoProgramDataPlaceholder({ onNavigateToDashboard }) {
  return (
    <div className="program-dashboard space-y-6">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-xl mx-auto">
          <div className="bg-muted border rounded-md p-4 mb-4">
            <h3 className="text-lg font-medium">No Active Program</h3>
            <p className="text-muted-foreground">You are not currently participating in any program.</p>
          </div>
          
          <div className="bg-background border rounded-md p-4 mb-4">
            <h4 className="font-medium mb-2">Looking for Programs?</h4>
            <p className="text-muted-foreground mb-3">Check out available programs on the dashboard page.</p>
            <Button onClick={onNavigateToDashboard}>
              Browse Programs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}