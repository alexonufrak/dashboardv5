import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { DashboardProvider } from '@/contexts/DashboardContext'

// Dynamically import DashboardShell to prevent SSR
// This ensures the DashboardProvider is available before the component renders
const DashboardShell = dynamic(() => import('@/components/DashboardShell'), {
  ssr: false
})

export default function ProgramDashboardPage() {
  const router = useRouter()
  
  // We must wrap the DashboardShell in a DashboardProvider to ensure
  // the context is available when navigating directly to this route
  return (
    <DashboardProvider>
      <DashboardShell />
    </DashboardProvider>
  )
}

// Disable static generation for this page to avoid rendering issues
export async function getServerSideProps() {
  return {
    props: {},
  }
}