import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// Dynamically import DashboardShell to prevent SSR
// This ensures the DashboardProvider is available before the component renders
const DashboardShell = dynamic(() => import('@/components/DashboardShell'), {
  ssr: false
})

export default function ProgramDashboardPage() {
  const router = useRouter()
  
  // The DashboardShell component will handle rendering the appropriate program
  // based on the programId from the router query
  return <DashboardShell />
}

// Disable static generation for this page to avoid rendering issues
export async function getServerSideProps() {
  return {
    props: {},
  }
}