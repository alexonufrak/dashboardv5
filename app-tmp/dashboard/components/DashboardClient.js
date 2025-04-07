'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardPage from '@/pages/dashboard/DashboardHome'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import ProgramDashboard from '@/components/program/ProgramDashboard'
import ProgramsPage from '@/pages/dashboard/programs/index'
import { useDashboard } from '@/contexts/DashboardContext'

/**
 * Client component wrapper for dashboard
 * Reuses existing components but provides App Router compatibility
 */
export default function DashboardClient({ user }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const programId = searchParams.get('programId')
  const view = searchParams.get('view')
  
  const {
    setActiveProgram,
    refreshData
  } = useDashboard()
  
  // Set active program in context if present in URL
  useEffect(() => {
    if (programId) {
      setActiveProgram(programId)
    }
    
    // Refresh data on initial load
    refreshData('all')
  }, [programId, setActiveProgram, refreshData])
  
  // Handle navigation between dashboard sections
  const handleNavigation = (page) => {
    console.log(`Navigation requested to page: ${page}`)
    
    // Extract program ID if this is a program-specific page
    let programId = null
    if (page.startsWith('program-')) {
      programId = page.replace('program-', '')
      page = 'program' // Set base page to program
    }
    
    // Update URL based on navigation
    if (programId) {
      router.push(`/dashboard?programId=${programId}`)
    } else {
      switch (page) {
        case "dashboard":
          router.push('/dashboard')
          break
        case "profile":
          router.push('/dashboard?view=profile')
          break
        case "programs":
          router.push('/dashboard?view=programs')
          break
        default:
          router.push('/dashboard')
      }
    }
  }
  
  // Render the appropriate page based on URL parameters
  if (programId) {
    return <ProgramDashboard programId={programId} onNavigate={handleNavigation} />
  }
  
  switch (view) {
    case 'profile':
      return <ProfilePage onNavigate={handleNavigation} />
    case 'programs':
      return <ProgramsPage onNavigate={handleNavigation} />
    default:
      return <DashboardPage onNavigate={handleNavigation} />
  }
}